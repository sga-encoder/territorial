import { environment } from '../../../environments/environment';
import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { EntityDto } from '../../models/entity.dto';
import { Entity } from '../../models/entity.model';

function toAbsoluteUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('/') ? `${environment.baseUrl}${path}` : path;
}

function toRelativeUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith(environment.baseUrl) ? url.slice(environment.baseUrl.length) : url;
}

/**
 * Pure DTO ↔ model translation for Entity. This is the only place where the
 * snake_case backend shape is visible (spec.md §2 — non-negotiable rule).
 * Note: create/update go out as multipart/form-data (entity.repository.ts);
 * `toDto` is kept for completeness and the GET response shape.
 */
export const entityMapper: ResourceMapper<EntityDto, Entity> = {
  toModel: (dto: EntityDto): Entity => ({
    id: dto.id_entity,
    name: dto.name,
    status: dto.status,
    nit: dto.nit,
    phone: dto.phone,
    email: dto.email,
    address: dto.address,
    logoUrl: toAbsoluteUrl(dto.logo_url),
  }),

  toDto: (model: Entity | CreateModel<Entity>): Omit<EntityDto, 'id_entity'> => ({
    name: model.name,
    status: model.status,
    nit: model.nit,
    phone: model.phone,
    email: model.email,
    address: model.address,
    logo_url: toRelativeUrl(model.logoUrl),
  }),
};
