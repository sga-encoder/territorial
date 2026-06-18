import { EntityStatus } from './entity.model';

/**
 * Backend contract for /api/entities — snake_case (confirmed via Postman).
 * Create/Update are sent as `multipart/form-data` with an optional logo `file`
 * (see entity.repository.ts); GET responses use this shape.
 */
export interface EntityDto {
  /** Backend primary key — serialized as `id_entity`, not `id`. */
  readonly id_entity: number;
  readonly name: string;
  readonly status: EntityStatus;
  readonly nit: string;
  readonly phone: string;
  readonly email: string;
  readonly address: string;
  readonly logo_url: string;
}
