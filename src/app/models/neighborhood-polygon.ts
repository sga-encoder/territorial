import { PolygonPoint } from './polygon-point';

/** Fewest vertices that can enclose an area (a triangle). */
const MINIMUM_POLYGON_VERTICES = 3;

/**
 * Sorts vertices ascending by `order`. Points without an order (`null`) sink to
 * the end while keeping their original relative position (Array.sort is stable),
 * so a polygon whose backend rows lack `order` still renders in insertion order.
 */
function byOrderAscending(left: PolygonPoint, right: PolygonPoint): number {
  const leftOrder = left.order ?? Number.POSITIVE_INFINITY;
  const rightOrder = right.order ?? Number.POSITIVE_INFINITY;
  return leftOrder - rightOrder;
}

/**
 * The polygon that demarcates a neighborhood (spec.md RN-26): the ordered set of
 * vertices that close its perimeter on the map. It is a derived aggregate — never
 * a CRUD row — so it lives as a class with behaviour (`isValid`) instead of a
 * plain model. The frontend does NOT compute geometry; it only orders and
 * validates the points the backend already persisted (CU-09 / CU-10).
 */
export class NeighborhoodPolygon {
  private constructor(
    readonly idNeighborhood: number,
    readonly neighborhoodName: string,
    /** Vertices already sorted by `order`. Empty when the neighborhood has no demarcation yet. */
    readonly points: readonly PolygonPoint[],
  ) {}

  /**
   * Builds the aggregate from the raw (possibly unordered) points of a single
   * neighborhood. Construction always succeeds — an empty list is a legitimate
   * state ("not demarcated yet", RN-18) surfaced through `isValid`, not an error.
   */
  static fromPoints(
    idNeighborhood: number,
    neighborhoodName: string,
    points: readonly PolygonPoint[],
  ): NeighborhoodPolygon {
    const orderedPoints = [...points].sort(byOrderAscending);
    return new NeighborhoodPolygon(idNeighborhood, neighborhoodName, orderedPoints);
  }

  /** How many vertices the polygon has. */
  get vertexCount(): number {
    return this.points.length;
  }

  /**
   * Whether this set of vertices forms a usable polygon: at least three of them.
   * The ring is treated as implicitly closed (spec.md RN-24: an open polygon
   * auto-closes, last point joins the first), so no explicit closing vertex is
   * required.
   */
  get isValid(): boolean {
    return this.vertexCount >= MINIMUM_POLYGON_VERTICES;
  }
}
