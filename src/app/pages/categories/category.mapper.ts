import { environment } from '../../../environments/environment';
import { CreateModel } from '../../core/http/create-model';
import { ResourceMapper } from '../../core/http/resource-mapper';
import { CategoryDto } from '../../models/category.dto';
import { Category } from '../../models/category.model';

function toAbsoluteUrl(path: string | null | undefined): string {
  if (!path) return '';
  return path.startsWith('/') ? `${environment.baseUrl}${path}` : path;
}

/** Strip the runtime baseUrl prefix before writing back to the backend so the DB
 *  always stores a clean relative path (e.g. /api/images/…), not an absolute URL. */
function toRelativeUrl(url: string | null | undefined): string {
  if (!url) return '';
  return url.startsWith(environment.baseUrl) ? url.slice(environment.baseUrl.length) : url;
}

/**
 * Pure DTO ↔ model translation for Category. create/update go out as multipart
 * (category.repository.ts); `toDto` is kept for the GET response shape.
 */
export const categoryMapper: ResourceMapper<CategoryDto, Category> = {
  toModel: (dto: CategoryDto): Category => ({
    id: dto.id_category,
    idParentCategory: dto.id_parent_category || null,
    name: dto.name,
    description: dto.description,
    status: dto.status,
    imageUrl: toAbsoluteUrl(dto.image_url),
  }),

  toDto: (model: Category | CreateModel<Category>): Omit<CategoryDto, 'id_category'> => ({
    id_parent_category: model.idParentCategory,
    name: model.name,
    description: model.description,
    status: model.status,
    image_url: toRelativeUrl(model.imageUrl),
  }),
};
