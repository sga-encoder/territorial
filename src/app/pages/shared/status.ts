import type { FieldOption } from '../../components/ui';
import type { DynamicCellTypeConfig } from '../../components/dynamic';

/**
 * Shared `active`/`inactive` lifecycle vocabulary. Several resources (commune,
 * neighborhood, citizen, category, annotation, official) carry the same status,
 * so the select options and the table badge mapping are declared once here.
 */
export type ActiveStatus = 'active' | 'inactive';

/** Select/radio options for an `active`/`inactive` field. */
export const ACTIVE_STATUS_OPTIONS: readonly FieldOption[] = [
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
];

/** DynamicTable `badge` column config for an `active`/`inactive` cell. */
export const STATUS_BADGE_CONFIG: DynamicCellTypeConfig = {
  labels: { active: 'Activo', inactive: 'Inactivo' },
  badgeVariants: { active: 'success', inactive: 'neutral' },
};
