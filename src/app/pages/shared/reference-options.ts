import type { Identifiable } from '../../core/http/identifiable';
import type { FieldOption } from '../../components/ui';

/**
 * Helpers to turn a loaded parent resource (e.g. departments) into the shapes a
 * relational CRUD needs: `<ui-select>` options (value is a STRING — the kit
 * compares with ===) and an id→label map to resolve names in table rows. Shared
 * by every feature with `id_X` selects so the mapping logic is written once.
 */

/** Build `FieldOption[]` for a relational select. Values are stringified ids. */
export function toFieldOptions<T extends Identifiable>(
  items: readonly T[],
  label: (item: T) => string,
): FieldOption[] {
  return items.map((item) => ({ value: String(item.id), label: label(item) }));
}

/** Build an id→label lookup (keyed by the stringified id) to resolve parent names in rows. */
export function toLabelMap<T extends Identifiable>(
  items: readonly T[],
  label: (item: T) => string,
): ReadonlyMap<string, string> {
  return new Map(items.map((item) => [String(item.id), label(item)]));
}
