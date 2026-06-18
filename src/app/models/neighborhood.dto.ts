import type { ActiveStatus } from '../pages/shared/status';

/** Backend contract for /api/neighborhoods — snake_case. Plain JSON. */
export interface NeighborhoodDto {
  /** Backend primary key — serialized as `id_neighborhood`, not `id`. */
  readonly id_neighborhood: number;
  readonly id_commune: number;
  readonly name: string;
  readonly status: ActiveStatus;
}
