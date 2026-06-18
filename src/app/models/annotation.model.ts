import type { ActiveStatus } from '../pages/shared/status';

/**
 * UI model for an annotation (camelCase). Reported by a citizen in a
 * neighborhood, at a geographic point. Plain JSON contract.
 */
export interface Annotation {
  readonly id: number;
  /** FK → Neighborhood.id. */
  readonly idNeighborhood: number;
  /** FK → Citizen.id. */
  readonly idCitizen: number;
  readonly description: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly status: ActiveStatus;
}
