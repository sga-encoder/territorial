/**
 * Backend contract for /api/points — snake_case, plain JSON (spec.md §3).
 *
 * A point belongs to EITHER a neighborhood (polygon vertex) OR an annotation —
 * never both (DB XOR constraint `ck_point_xor_owner`). For polygons only the
 * rows with a non-null `id_neighborhood` are relevant.
 */
export interface PolygonPointDto {
  readonly id_point: number;
  /** FK → Neighborhood.id_neighborhood. Null when the point is an annotation pin. */
  readonly id_neighborhood: number | null;
  /** FK → Annotation.id_annotation. Null when the point is a polygon vertex. */
  readonly id_annotation: number | null;
  readonly latitude: number;
  readonly longitude: number;
  /** Position in the polygon ring. Nullable in the backend (`order` column). */
  readonly order: number | null;
  readonly point_type: string;
}
