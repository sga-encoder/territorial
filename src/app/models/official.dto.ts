import type { ActiveStatus } from '../pages/shared/status';

/**
 * Backend contract for /api/officials — snake_case, immutable (spec.md §3).
 * `id` is assumed present in responses since the resource is addressable by id.
 */
export interface OfficialDto {
  /** Backend primary key — serialized as `id_official`, not `id`. */
  readonly id_official: number;
  readonly id_entity: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly role: string;
  readonly status: ActiveStatus;
  // Nullable in the DB; `last_gps_update` is a DateTime, so it must be null (not
  // an empty string) when there is no fix yet — SQLAlchemy rejects '' on insert.
  readonly last_latitude: number | null;
  readonly last_longitude: number | null;
  readonly last_gps_update: string | null;
  readonly gps_active: boolean;
}
