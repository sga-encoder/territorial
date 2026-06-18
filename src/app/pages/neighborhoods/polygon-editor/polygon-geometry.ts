import type { Feature, FeatureCollection, LineString, Point, Polygon, Position } from 'geojson';
import type { NeighborhoodPolygon } from '../../../models/neighborhood-polygon';
import type { PolygonPoint } from '../../../models/polygon-point';
import type {
  EditableVertex,
  OrderedVertex,
  PolygonPersistenceDiff,
  RingIssue,
  RingValidation,
} from './polygon-editor.types';

/**
 * Pure geometry/transform layer for the polygon editor. NO Angular, NO MapLibre,
 * NO HTTP — only deterministic functions over plain data, so every rule (order,
 * ring validity, DTO↔model, persistence diff) is unit-testable in isolation and
 * the map/state layers stay thin. The frontend does NOT compute geometry beyond
 * ordering and validating the ring (spec.md CU-09 / CU-10).
 */

/** Fewest vertices that enclose an area (a triangle) — mirrors NeighborhoodPolygon. */
const MINIMUM_POLYGON_VERTICES = 3;

/**
 * Coordinate equality tolerance (~1.1 cm at the equator). Two vertices closer
 * than this are treated as the same position: it is the single knob that decides
 * when a dragged vertex counts as "moved" (→ PUT) versus untouched (→ skip), and
 * what makes two vertices "duplicate". Tightening it sends more PUTs; loosening
 * it risks ignoring small but intentional nudges.
 */
const COORDINATE_EPSILON = 1e-7;

// --- Loading: aggregate → editable vertices ----------------------------------

/**
 * Seeds the editor from the read-only aggregate. The points are already ordered
 * (NeighborhoodPolygon sorts by `order`); each keeps its `id_point` so a later
 * save can tell which vertices to update vs create. Client ids are derived from
 * the backend id, so they are stable across reloads.
 */
export function toEditableVertices(polygon: NeighborhoodPolygon): EditableVertex[] {
  return polygon.points.map((point) => ({
    clientId: `p-${point.idPoint}`,
    idPoint: point.idPoint,
    latitude: point.latitude,
    longitude: point.longitude,
  }));
}

// --- Validation --------------------------------------------------------------

function samePosition(
  left: { readonly latitude: number; readonly longitude: number },
  right: { readonly latitude: number; readonly longitude: number },
): boolean {
  return (
    Math.abs(left.latitude - right.latitude) < COORDINATE_EPSILON &&
    Math.abs(left.longitude - right.longitude) < COORDINATE_EPSILON
  );
}

/** True if any two vertices share the same position (a degenerate ring). */
function hasDuplicateVertices(vertices: readonly EditableVertex[]): boolean {
  for (let outer = 0; outer < vertices.length; outer++) {
    for (let inner = outer + 1; inner < vertices.length; inner++) {
      if (samePosition(vertices[outer], vertices[inner])) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Validates the working ring. The ring is implicitly closed (RN-24: an open
 * polygon auto-closes, last point joins the first), so no explicit closing
 * vertex is required — only at least three DISTINCT vertices.
 */
export function validateRing(vertices: readonly EditableVertex[]): RingValidation {
  const issues: RingIssue[] = [];
  if (vertices.length < MINIMUM_POLYGON_VERTICES) {
    issues.push('too-few-vertices');
  }
  if (hasDuplicateVertices(vertices)) {
    issues.push('duplicate-vertices');
  }
  return { isValid: issues.length === 0, vertexCount: vertices.length, issues };
}

// --- GeoJSON for the map (render is a pure function of the vertices) ----------

/**
 * The polygon area + perimeter as one feature. A closed Polygon once there are
 * ≥3 vertices (first coordinate repeated to close the ring), a LineString while
 * the ring is still being traced (2 vertices), or nothing below that. The map's
 * `fill` layer paints the Polygon; a single `line` layer outlines both shapes.
 */
export function toRingFeatureCollection(
  vertices: readonly EditableVertex[],
): FeatureCollection<Polygon | LineString> {
  const positions: Position[] = vertices.map((vertex) => [vertex.longitude, vertex.latitude]);
  const features: Feature<Polygon | LineString>[] = [];

  if (positions.length >= MINIMUM_POLYGON_VERTICES) {
    const closedRing: Position[] = [...positions, positions[0]];
    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [closedRing] },
      properties: {},
    });
  } else if (positions.length === 2) {
    features.push({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: positions },
      properties: {},
    });
  }

  return { type: 'FeatureCollection', features };
}

/**
 * One Point feature per vertex for the draggable `circle` layer. Each feature
 * carries its `clientId` (to resolve which vertex a drag/click hit), 1-based
 * `label`, and whether it is the currently selected vertex (drives paint).
 */
export function toVertexFeatureCollection(
  vertices: readonly EditableVertex[],
  selectedClientId: string | null,
): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: vertices.map((vertex, index) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [vertex.longitude, vertex.latitude] },
      properties: {
        clientId: vertex.clientId,
        index,
        label: String(index + 1),
        selected: vertex.clientId === selectedClientId,
      },
    })),
  };
}

/** Bounding box `[[minLng, minLat], [maxLng, maxLat]]`, or null when empty. */
export function verticesBounds(
  vertices: readonly EditableVertex[],
): [[number, number], [number, number]] | null {
  if (vertices.length === 0) {
    return null;
  }
  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;
  for (const vertex of vertices) {
    minLng = Math.min(minLng, vertex.longitude);
    minLat = Math.min(minLat, vertex.latitude);
    maxLng = Math.max(maxLng, vertex.longitude);
    maxLat = Math.max(maxLat, vertex.latitude);
  }
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

// --- Persistence diff (diff & sync) ------------------------------------------

function hasMovedOrReordered(
  baseline: PolygonPoint,
  edited: EditableVertex,
  order: number,
): boolean {
  return !samePosition(baseline, edited) || baseline.order !== order;
}

/**
 * Classifies the edited vertices against the loaded baseline into the three sets
 * the backend understands. `order` is the vertex's 1-based position in the
 * current editing sequence, so reordering a vertex marks it for update too.
 *
 * - A vertex without `idPoint` is new → create (POST).
 * - A vertex whose position OR order changed → update (PUT).
 * - A baseline `id_point` no longer present → delete (DELETE).
 * - An unchanged vertex is skipped (no request), which is why diff & sync is
 *   cheaper than replace-all.
 */
export function diffPolygonPoints(
  baseline: readonly PolygonPoint[],
  edited: readonly EditableVertex[],
): PolygonPersistenceDiff {
  const baselineById = new Map(baseline.map((point) => [point.idPoint, point]));
  const keptIds = new Set<number>();
  const toCreate: OrderedVertex[] = [];
  const toUpdate: OrderedVertex[] = [];

  edited.forEach((vertex, index) => {
    const ordered: OrderedVertex = {
      idPoint: vertex.idPoint,
      latitude: vertex.latitude,
      longitude: vertex.longitude,
      order: index + 1,
    };

    if (vertex.idPoint === null) {
      toCreate.push(ordered);
      return;
    }

    keptIds.add(vertex.idPoint);
    const original = baselineById.get(vertex.idPoint);
    if (original === undefined || hasMovedOrReordered(original, vertex, ordered.order)) {
      toUpdate.push(ordered);
    }
  });

  const toDelete = baseline
    .map((point) => point.idPoint)
    .filter((idPoint) => !keptIds.has(idPoint));

  return { toCreate, toUpdate, toDelete };
}

// --- City overview: multiple polygons ----------------------------------------

/**
 * Converts a list of NeighborhoodPolygon aggregates into a GeoJSON FeatureCollection
 * with one Polygon feature per valid neighborhood. Used by the polygon editor to
 * render all boundaries of a city when no single neighborhood is selected.
 */
export function toOverviewFeatureCollection(polygons: readonly NeighborhoodPolygon[]): FeatureCollection {
  const features: Feature<Polygon>[] = [];
  for (const polygon of polygons) {
    if (!polygon.isValid) {
      continue;
    }
    const coords: Position[] = polygon.points.map((p) => [p.longitude, p.latitude]);
    coords.push(coords[0]); // close the ring
    features.push({
      type: 'Feature',
      properties: { id: polygon.idNeighborhood, name: polygon.neighborhoodName },
      geometry: { type: 'Polygon', coordinates: [coords] },
    });
  }
  return { type: 'FeatureCollection', features };
}
