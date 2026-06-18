import type { PolygonPointDto } from './polygon-point.dto';

/**
 * Backend column `point_type` is an unconstrained `String(40)` and spec.md §3
 * documents its value as `"..."`, so the vocabulary is not yet fixed. Kept as a
 * string alias to narrow into a union the day the real values are confirmed.
 */
export type PolygonPointType = string;

/**
 * A single vertex of a neighborhood polygon (camelCase domain class).
 *
 * It is a class — not a plain model — so the polygon aggregate can build it from
 * the DTO in one place (`fromDto`) and never let a snake_case DTO leak out of the
 * data layer (spec.md §2). Instances are immutable.
 */
export class PolygonPoint {
  private constructor(
    /** Backend primary key (`id_point`). Identifies the row when persisting edits. */
    readonly idPoint: number,
    readonly latitude: number,
    readonly longitude: number,
    /** Position in the ring; `null` when the backend did not assign one. */
    readonly order: number | null,
    readonly pointType: PolygonPointType,
  ) {}

  /** Translates one backend DTO into a domain point. */
  static fromDto(dto: PolygonPointDto): PolygonPoint {
    return new PolygonPoint(dto.id_point, dto.latitude, dto.longitude, dto.order, dto.point_type);
  }
}
