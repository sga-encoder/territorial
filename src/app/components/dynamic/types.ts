// Dynamic layer type vocabulary (capa `dynamic`). These types describe
// DATA-DRIVEN compositions OVER the UI Kit — they are NOT kit atoms (RN-UI-05),
// so they live here and never in components/ui/types.ts. They reuse the kit's
// public unions (BadgeVariant, ChipVariant, IconName…) instead of redefining
// them, and they never carry CSS classes (RN-UI-02 keeps Tailwind in components).

import type {
  BadgeVariant,
  ButtonVariant,
  ChipVariant,
  FieldOption,
  IconColor,
  IconName,
  TableColumn,
  TableRow,
} from '../ui';

/** How a cell paints its raw value. `text` is the default fallback. */
export type DynamicCellType = 'text' | 'number' | 'date' | 'badge' | 'chip' | 'boolean' | 'images';

/** Date presets mapped to Intl.DateTimeFormat (no free format strings — RN-UI-01). */
export type DynamicDateStyle = 'short' | 'medium' | 'long';

/**
 * Per-type rendering hints. Carries DATA and value→variant maps only; never CSS
 * classes — the cell component owns the Tailwind, the config stays declarative.
 */
export interface DynamicCellTypeConfig {
  /** `date` cells: Intl preset. Default `medium`. */
  readonly dateStyle?: DynamicDateStyle;
  /** `number` cells: minimum fraction digits for Intl.NumberFormat. */
  readonly minimumFractionDigits?: number;
  /** `badge` cells: raw value → Badge variant. Unmapped values fall back to `neutral`. */
  readonly badgeVariants?: Readonly<Record<string, BadgeVariant>>;
  /** `chip` cells: raw value → Chip variant. Unmapped values fall back to `neutral`. */
  readonly chipVariants?: Readonly<Record<string, ChipVariant>>;
  /** `boolean` cells: labels per state. Default `Sí` / `No`. */
  readonly booleanLabels?: { readonly truthy: string; readonly falsy: string };
  /** Maps a raw value to a display label (e.g. 'active' → 'Activa'). Applies to text/badge/chip. */
  readonly labels?: Readonly<Record<string, string>>;
}

/** A column = the kit's TableColumn (key/header/align) + a render type. */
export interface DynamicColumn extends TableColumn {
  /** Default `text`. */
  readonly type?: DynamicCellType;
  readonly typeConfig?: DynamicCellTypeConfig;
}

/** An action rendered as a ghost icon-button in the trailing actions column. */
export interface DynamicRowAction {
  /** Stable id for `@for` tracking. */
  readonly id: string;
  readonly icon: IconName;
  /** Accessible name (rendered sr-only inside the button); required for AXE. */
  readonly label: string;
  readonly color?: IconColor;
  /** Invoked with the row when the action is pressed. */
  readonly run: (row: TableRow) => void;
  /** When provided, the action only renders for rows where it returns true. */
  readonly visible?: (row: TableRow) => boolean;
}

export type DynamicSelectionMode = 'none' | 'single' | 'multiple';

/** Value emitted by selection (and the CVA model): one row, many rows, or none. */
export type DynamicSelectionValue = TableRow | readonly TableRow[] | null;

// --- Form generator ----------------------------------------------------------

/** Field kinds the generator renders; each maps to a kit control. */
export type FormFieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'date'
  | 'range'
  | 'file'
  | 'location'
  | 'hidden';

/**
 * Validator descriptor mapped to a Reactive Forms `Validators.*`. A discriminated
 * union keeps each `value` typed (no `any`): only `min/max/length/pattern` carry one.
 */
export type FormFieldValidator =
  | { readonly type: 'required' }
  | { readonly type: 'requiredTrue' }
  | { readonly type: 'email' }
  | { readonly type: 'min'; readonly value: number }
  | { readonly type: 'max'; readonly value: number }
  | { readonly type: 'minLength'; readonly value: number }
  | { readonly type: 'maxLength'; readonly value: number }
  | { readonly type: 'pattern'; readonly value: string };

/** Scalar a field can hold / compare against (no `any`). `multiselect` fields use `readonly string[]`. */
export type FormFieldScalar = string | number | boolean | null | readonly string[];

/** Grid span over a section's 12-col layout. Semantic — never a Tailwind class. */
export type FormFieldSpan = 1 | 2 | 3 | 4 | 6 | 12;

/** Show the field only while another field's value equals `equals`. */
export interface FormFieldVisibility {
  readonly fieldKey: string;
  readonly equals: FormFieldScalar;
}

export interface FormFieldConfig {
  readonly key: string;
  readonly label: string;
  readonly type: FormFieldType;
  readonly placeholder?: string;
  /** `select` and `radio` options. */
  readonly options?: readonly FieldOption[];
  /** `range` bounds (value defaults to `min`). */
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  /** `file` only: MIME/extension filter (e.g. 'image/*'), multi-select, helper line. */
  readonly accept?: string;
  readonly multiple?: boolean;
  /** Optional max files allowed for file fields. */
  readonly maxFiles?: number;
  readonly hint?: string;
  readonly validators?: readonly FormFieldValidator[];
  /** Per-validator message overrides for fieldErrorMessage (RN-UI-07). */
  readonly messages?: Readonly<Record<string, string>>;
  readonly initialValue?: FormFieldScalar;
  /** Column span in its section's 12-col grid. Default 12 (full row). */
  readonly span?: FormFieldSpan;
  readonly conditionalVisibility?: FormFieldVisibility;
}

export interface FormSectionConfig {
  readonly title?: string;
  readonly description?: string;
  readonly fields: readonly FormFieldConfig[];
}

export interface FormPageConfig {
  readonly title: string;
  readonly description?: string;
  readonly sections: readonly FormSectionConfig[];
}

/** The whole schema: one page = a plain form, many pages = a wizard. */
export type FormSchema = readonly FormPageConfig[];

/** Flat value emitted on change/submit, keyed by field key. */
export type FormValue = Record<string, unknown>;

// --- Chatbot -----------------------------------------------------------------

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  readonly id: string;
  readonly role: ChatRole;
  readonly content: string;
  /** Optional ISO timestamp shown under the bubble. */
  readonly timestamp?: string;
}

// --- Filter -----------------------------------------------------------------

/** How a filter field's value is matched against the row cell. */
export type FilterMatchMode = 'contains' | 'equals' | 'gte' | 'lte' | 'in';

/** Control kinds a filter renders (compact subset of the form controls). */
export type FilterFieldType = 'text' | 'select' | 'date' | 'checkbox';

export interface FilterFieldConfig {
  readonly key: string;
  readonly label: string;
  readonly type: FilterFieldType;
  readonly placeholder?: string;
  /** `select` options. */
  readonly options?: readonly FieldOption[];
  readonly matchMode: FilterMatchMode;
}

export interface FilterConfig {
  readonly fields: readonly FilterFieldConfig[];
}

/** `auto` filters live (debounced); `manual` waits for the Filtrar button. */
export type FilterMode = 'auto' | 'manual';

// --- Page header -------------------------------------------------------------

/**
 * A header button declared as DATA — the "dictionary" entry a page passes to
 * `<ui-page-header>` to append actions next to the title. Each item carries its
 * own `run` callback (same pattern as DynamicRowAction), so adding a button is a
 * config change, never a template edit. Reuses the kit's ButtonVariant/IconName.
 */
export interface PageHeaderAction {
  /** Stable id for `@for` tracking. */
  readonly id: string;
  /** Visible button label. */
  readonly label: string;
  /** Optional leading icon (curated kit subset). */
  readonly icon?: IconName;
  /** Button style; default `primary`. */
  readonly variant?: ButtonVariant;
  /** Disable the button. */
  readonly disabled?: boolean;
  /** Show an inline spinner and block interaction. */
  readonly loading?: boolean;
  /** Invoked when the button is pressed (only fires while operable). */
  readonly run: () => void;
}
