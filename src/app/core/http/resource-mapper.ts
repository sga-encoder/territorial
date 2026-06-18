import { CreateModel } from './create-model';
import { Identifiable } from './identifiable';

/**
 * Pure translation between backend DTOs (snake_case) and UI models (camelCase).
 * Non-negotiable rule (spec.md §2): a DTO must never reach a component, so every
 * resource provides one of these and the repository applies it on every verb.
 */
export interface ResourceMapper<TDto, TModel extends Identifiable> {
  toModel(dto: TDto): TModel;
  /**
   * Request body for create/update. The backend assigns the primary key (named
   * `id_<resource>`, not `id`), so the mapper never sends it — hence a partial
   * DTO. Only the UI model is guaranteed to carry an `id` (see Identifiable).
   */
  toDto(model: TModel | CreateModel<TModel>): Partial<TDto>;
}
