// UI Kit type vocabulary — single home for every public union type of the
// design system. Each layer adds its component types here; component files
// keep only implementation details (class maps, defaults).

// Theme (Capa 0)
export type ThemeScheme = 'dark' | 'light';

// Container (Capa 1)
export type ContainerLayout = 'flex' | 'grid';
export type ContainerDirection = 'row' | 'column';
export type ContainerAlign = 'start' | 'center' | 'end' | 'stretch';
export type ContainerJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
export type ContainerCenter = 'both' | 'horizontal' | 'vertical';
export type ContainerGap = 0 | 1 | 2 | 3 | 4 | 6 | 8 | 12;
export type ContainerCols = 1 | 2 | 3 | 4 | 6 | 12;

// Text (Capa 1)
export type TextVariant = 'body' | 'caption' | 'label';
export type TextColor =
  | 'default'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

// Title (Capa 1)
export type TitleLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type TitleColor = 'default' | 'muted' | 'primary';

// Divider (Capa 1)
export type DividerOrientation = 'horizontal' | 'vertical';

// Split (Capa 1) — responsive main + aside layout (stacks to one column on mobile)
export type SplitAsideSize = 'sm' | 'md' | 'lg';
export type SplitAsidePosition = 'start' | 'end';

// Button (Capa 2)
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonType = 'button' | 'submit';

// Icon (Capa 2) — curated subset of @ng-icons/lucide (RN-UI-06); the map in
// icon/icon.ts must stay in sync with this union (the compiler enforces it).
export type IconName =
  | 'calendar'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-up'
  | 'close'
  | 'edit'
  | 'error'
  | 'eye'
  | 'eye-off'
  | 'info'
  | 'locate'
  | 'map-pin'
  | 'menu'
  | 'minus'
  | 'more'
  | 'moon'
  | 'move'
  | 'plus'
  | 'save'
  | 'search'
  | 'success'
  | 'sun'
  | 'trash'
  | 'undo'
  | 'user'
  | 'warning'
  | 'waypoints'
  | 'alert-circle'
  | 'bar-chart'
  | 'bar-chart-2'
  | 'key'
  | 'message-square'
  | 'panel-right-close'
  | 'panel-right-open';
export type IconSize = 'xs' | 'sm' | 'md' | 'lg';
export type IconColor =
  | 'inherit'
  | 'default'
  | 'muted'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

// Spinner (Capa 2)
export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = IconColor;

// Avatar (Capa 2)
export type AvatarSize = 'sm' | 'md' | 'lg';

// Badge / Chip (Capa 3)
export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
export type BadgeSize = 'sm' | 'md';
export type ChipVariant = BadgeVariant;

// Breadcrumbs (Capa 3)
export interface BreadcrumbItem {
  readonly label: string;
  /** Without a path the item renders as plain text (current page). */
  readonly path?: string;
}

// Table (Capa 3)
export type TableAlign = 'left' | 'center' | 'right';
export interface TableColumn {
  /** Row property to read; also the key that matches a custom cell template. */
  readonly key: string;
  readonly header: string;
  readonly align?: TableAlign;
}
export type TableRow = Record<string, unknown>;
export interface TableCellContext {
  readonly $implicit: TableRow;
}

// Pagination (Capa 3)
export type PaginationItem = number | 'ellipsis';

// Tabs (Capa 3)
export interface TabItem {
  readonly id: string;
  readonly label: string;
  readonly icon?: IconName;
  readonly disabled?: boolean;
}

// Forms (Capa 4)
export type InputTextType = 'text' | 'email' | 'password' | 'number';
/** Option of Select and Radio. */
export interface FieldOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}
/** Overrides per validator key for fieldErrorMessage (RN-UI-07). */
export type FieldErrorMessages = Readonly<Record<string, string>>;

// Toast (Capa 5)
export type ToastVariant = 'success' | 'error' | 'info' | 'warning';
export interface ToastOptions {
  readonly title?: string;
  /** Milliseconds before auto-dismiss; 0 keeps the toast until closed (RN-UI-08). */
  readonly duration?: number;
}
export interface ToastItem {
  readonly id: number;
  readonly variant: ToastVariant;
  readonly message: string;
  readonly title?: string;
}

// Modal (Capa 5)
export type ModalSize = 'sm' | 'md' | 'lg';
export interface ModalConfig {
  readonly title?: string;
  readonly size?: ModalSize;
  /** Inputs forwarded to the opened component (NgComponentOutlet). */
  readonly inputs?: Record<string, unknown>;
}

// Tooltip (Capa 5)
export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

// Dropdown (Capa 5) — menú flotante reusable (acciones de fila, menús, etc.).
export type DropdownAlign = 'start' | 'end';
export interface DropdownItem {
  /** Requerido salvo en separadores. */
  readonly value?: string;
  readonly label?: string;
  readonly icon?: IconName;
  readonly disabled?: boolean;
  /** Acción destructiva: se pinta en rojo (texto + hover). */
  readonly danger?: boolean;
  /** Línea divisoria no interactiva (ignora value/label). */
  readonly separator?: boolean;
}
