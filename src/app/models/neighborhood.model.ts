import type { ActiveStatus } from '../pages/shared/status';

/** UI model for a neighborhood (camelCase). Belongs to a commune. Plain JSON. */
export interface Neighborhood {
  readonly id: number;
  /** FK → Commune.id. */
  readonly idCommune: number;
  readonly name: string;
  readonly status: ActiveStatus;
}
