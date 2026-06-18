import type { ActiveStatus } from '../pages/shared/status';

/** UI model for a citizen (camelCase), produced by `citizenMapper`. Plain JSON. */
export interface Citizen {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly status: ActiveStatus;
}
