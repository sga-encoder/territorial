import type { ActiveStatus } from '../pages/shared/status';

/**
 * Backend contract for /api/categories — snake_case. Create/Update are sent as
 * `multipart/form-data` with an optional image `file` (see category.repository.ts).
 */
export interface CategoryDto {
  /** Backend primary key — serialized as `id_category`, not `id`. */
  readonly id_category: number;
  readonly id_parent_category: number | null;
  readonly name: string;
  readonly description: string;
  readonly status: ActiveStatus;
  readonly image_url: string;
}
