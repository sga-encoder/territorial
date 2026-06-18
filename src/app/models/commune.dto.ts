import type { ActiveStatus } from '../pages/shared/status';

/** Backend contract for /api/communes — snake_case. Plain JSON. */
export interface CommuneDto {
  /** Backend primary key — serialized as `id_commune`, not `id`. */
  readonly id_commune: number;
  readonly id_city: number;
  readonly name: string;
  readonly status: ActiveStatus;
}
