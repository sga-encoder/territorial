import type { ActiveStatus } from '../pages/shared/status';

/**
 * UI model for a category (camelCase). Self-referential: a category may have an
 * optional parent (`idParentCategory`, null = root). Create/update go out as
 * multipart/form-data with an optional image `file` (see category.repository.ts).
 */
export interface Category {
  readonly id: number;
  /** FK → Category.id; null for a root category. */
  readonly idParentCategory: number | null;
  readonly name: string;
  readonly description: string;
  readonly status: ActiveStatus;
  /** Image URL/filename returned by the backend (field `image_url`). */
  readonly imageUrl: string;
}
