/** RN-03 — lifecycle state of an entity. */
export type EntityStatus = 'active' | 'inactive';

/**
 * UI model for a registered entity (CU-01) — camelCase, produced by `entityMapper`
 * from EntityDto. Matches the real backend contract (multipart create/update with
 * an optional logo `file`; see entity.repository.ts). Components only see this shape.
 */
export interface Entity {
  readonly id: number;
  /** RN-01 — unique system-wide (enforced by the backend). */
  readonly name: string;
  readonly status: EntityStatus;
  readonly nit: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  /** Logo URL/filename returned by the backend (field `logo_url`). */
  readonly logoUrl: string;
}
