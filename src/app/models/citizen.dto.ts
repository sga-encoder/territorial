import type { ActiveStatus } from '../pages/shared/status';

/**
 * Backend contract for /api/citizens — snake_case, immutable (spec.md §3).
 * `id` is assumed present in responses since the resource is addressable by id.
 */
export interface CitizenDto {
  /** Backend primary key — serialized as `id_citizen`, not `id`. */
  readonly id_citizen: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly status: ActiveStatus;
}
