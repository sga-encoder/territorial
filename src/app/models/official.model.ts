import type { ActiveStatus } from '../pages/shared/status';

/**
 * UI model for an official (camelCase). Belongs to an entity and carries the
 * last known GPS fix (used by the live tracking feature). Plain JSON contract.
 */
export interface Official {
  readonly id: number;
  /** FK → Entity.id. */
  readonly idEntity: number;
  readonly name: string;
  readonly email: string;
  readonly phone: string;
  readonly role: string;
  readonly status: ActiveStatus;
  // GPS fix — nullable: the backend columns are nullable and are managed by the
  // tracking feature, not the create/edit form (last_gps_update is a DateTime).
  readonly lastLatitude: number | null;
  readonly lastLongitude: number | null;
  readonly lastGpsUpdate: string | null;
  readonly gpsActive: boolean;
}
