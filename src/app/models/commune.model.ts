import type { ActiveStatus } from '../pages/shared/status';

/** UI model for a commune (camelCase). Belongs to a city. Plain JSON contract. */
export interface Commune {
  readonly id: number;
  /** FK → City.id. */
  readonly idCity: number;
  readonly name: string;
  readonly status: ActiveStatus;
}
