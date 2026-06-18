import {
  booleanAttribute,
  Component,
  computed,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Button, Container, Icon, Pagination, Table, TableCellDef } from '../ui';
import type { TableColumn, TableRow } from '../ui';
import { DynamicCell } from './dynamic-cell';
import type {
  DynamicColumn,
  DynamicRowAction,
  DynamicSelectionMode,
  DynamicSelectionValue,
} from './types';

const SELECT_KEY = '__select__';
const ACTIONS_KEY = '__actions__';
const GROUP_TOGGLE_KEY = '__group_toggle__';

// Unique per instance so single-select radios from different tables never share
// a native group name.
let nextRadioGroup = 0;

/**
 * Data-driven table: wraps <ui-table> + <ui-pagination> and adds dynamic cell
 * rendering (DynamicColumn.type), row selection (radio/checkbox) and a trailing
 * actions column. Composes the kit and carries the orchestration the atoms
 * deliberately don't (capa `dynamic`, not components/ui — RN-UI-05).
 *
 * It injects two synthetic columns (`__select__`, `__actions__`) into the dumb
 * <ui-table> and projects one cell template per column; <ui-table> matches them
 * by key. Selection is exposed both as a form value (ControlValueAccessor) and
 * as `selectionChange`; the shape follows `selectionMode` — `single` emits a row
 * or null, `multiple` emits an array.
 */
@Component({
  selector: 'ui-dynamic-table',
  imports: [Table, TableCellDef, Pagination, Container, Button, Icon, DynamicCell],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DynamicTable), multi: true },
  ],
  template: `
    <div class="flex flex-col gap-4">
      <ui-table
        [columns]="effectiveColumns()"
        [rows]="pagedRows()"
        [loading]="loading()"
        [emptyMessage]="emptyMessage()"
      >
        @if (selectionMode() !== 'none') {
          <ng-template [uiTableCell]="selectKey" let-row>
            @if (row.__isGroupHeader) {
              <span></span>
            } @else if (selectionMode() === 'single') {
              <label class="relative inline-grid h-5 w-5 cursor-pointer place-items-center">
                <input
                  type="radio"
                  [name]="radioGroupName"
                  class="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  [checked]="isSelected(row)"
                  [disabled]="disabled()"
                  [attr.aria-label]="selectionLabel(row)"
                  (change)="toggleSelection(row)"
                />
                <span
                  class="pointer-events-none h-5 w-5 rounded-full border border-[var(--color-input-bdr-b)] bg-[var(--color-input-bg)] transition-[border-color,box-shadow,scale] duration-200 peer-hover:scale-105 peer-hover:border-primary peer-checked:border-primary-strong peer-focus-visible:[box-shadow:0_0_0_3px_var(--color-focus-ring)]"
                ></span>
                <span
                  class="pointer-events-none absolute h-2.5 w-2.5 scale-0 rounded-full bg-primary-strong transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] peer-checked:scale-100 motion-reduce:transition-none"
                ></span>
              </label>
            } @else {
              <label class="relative inline-grid h-5 w-5 cursor-pointer place-items-center">
                <input
                  type="checkbox"
                  class="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  [checked]="isSelected(row)"
                  [disabled]="disabled()"
                  [attr.aria-label]="selectionLabel(row)"
                  (change)="toggleSelection(row)"
                />
                <span
                  class="pointer-events-none h-5 w-5 rounded-md border border-[var(--color-input-bdr-b)] bg-[var(--color-input-bg)] transition-[background-color,border-color,box-shadow,scale] duration-200 peer-hover:scale-105 peer-hover:border-primary peer-checked:border-primary-strong peer-checked:bg-primary-strong peer-focus-visible:[box-shadow:0_0_0_3px_var(--color-focus-ring)]"
                ></span>
                <svg
                  class="pointer-events-none absolute h-3 w-3 scale-0 text-on-primary transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] peer-checked:scale-100 motion-reduce:transition-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </label>
            }
          </ng-template>
        }

        <ng-template [uiTableCell]="groupToggleKey" let-row>
          @if (row.__isGroupHeader) {
            <ui-button variant="ghost" size="sm" (clicked)="toggleGroup(row.__groupKey)">
              <ui-icon [name]="isGroupExpanded(row.__groupKey) ? 'chevron-down' : 'chevron-right'" size="sm" />
              <span class="sr-only">Expandir grupo</span>
            </ui-button>
          } @else {
            <span></span>
          }
        </ng-template>

        @for (column of columns(); track column.key) {
          <ng-template [uiTableCell]="column.key" let-row>
            @if (row.__isGroupHeader && groupBy() !== null) {
              @if (column.key === groupBy()) {
                <span class="text-sm font-semibold text-foreground">
                  {{ row.__groupKey }}
                  <span class="text-xs font-normal text-muted">({{ row.__groupCount }})</span>
                </span>
              } @else {
                <span class="text-muted">—</span>
              }
            } @else {
              <ui-dynamic-cell
                [value]="row[column.key]"
                [type]="column.type ?? 'text'"
                [typeConfig]="column.typeConfig"
              />
            }
          </ng-template>
        }

        @if (actions().length > 0) {
          <ng-template [uiTableCell]="actionsKey" let-row>
            @if (!row.__isGroupHeader || groupBy() === null) {
              <ui-container direction="row" justify="center" [gap]="1">
                @for (action of actions(); track action.id) {
                  @if (isActionVisible(action, row)) {
                    <ui-button variant="ghost" size="sm" (clicked)="action.run(row)">
                      <ui-icon [name]="action.icon" [color]="action.color ?? 'inherit'" size="sm" />
                      <span class="sr-only">{{ action.label }}</span>
                    </ui-button>
                  }
                }
              </ui-container>
            }
          </ng-template>
        }
      </ui-table>

      @if (paginated() && totalPages() > 1) {
        <ui-container direction="row" justify="between" align="center" [gap]="4" wrap>
          <span class="text-sm text-muted">{{ selectionSummary() ?? pageInfo() }}</span>
          <ui-pagination
            class="ms-auto"
            [total]="groupedRows().length"
            [pageSize]="pageSize()"
            [currentPage]="effectivePage()"
            (pageChanged)="page.set($event)"
          />
        </ui-container>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class DynamicTable implements ControlValueAccessor {
  readonly columns = input.required<readonly DynamicColumn[]>();
  readonly rows = input.required<readonly TableRow[]>();
  readonly actions = input<readonly DynamicRowAction[]>([]);
  readonly loading = input(false);
  readonly emptyMessage = input('Sin registros');

  readonly selectionMode = input<DynamicSelectionMode>('none');
  /** Row field used as stable selection identity. Null → identity by reference. */
  readonly rowKey = input<string | null>(null);
  /** Optional accessible-name builder for a row's selector control. */
  readonly rowLabel = input<((row: TableRow) => string) | null>(null);

  readonly paginated = input(true, { transform: booleanAttribute });
  readonly pageSize = input(10);
  /** Optional grouping key: when set, rows are grouped by this field's value. */
  readonly groupBy = input<string | null>(null);
  /** Group rows expanded by default when first rendered. */
  readonly groupsExpandedByDefault = input(true, { transform: booleanAttribute });
  /** Optional override for selection identity key (falls back to `rowKey`). */
  readonly selectionBaseKey = input<string | null>(null);

  readonly selectionChange = output<DynamicSelectionValue>();

  protected readonly selectKey = SELECT_KEY;
  protected readonly actionsKey = ACTIONS_KEY;
  protected readonly radioGroupName = `ui-dynamic-table-${nextRadioGroup++}`;
  protected readonly groupToggleKey = GROUP_TOGGLE_KEY;

  /** Internal selection model — always an array (single mode holds at most one). */
  protected readonly selection = signal<readonly TableRow[]>([]);
  protected readonly disabled = signal(false);

  private onChange: (value: DynamicSelectionValue) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  // --- pagination (client-side slicing; server-side can come later as a flag) ---

  protected readonly page = signal(1);
  protected readonly expandedGroups = signal<Record<string, boolean>>({});

  /** True when the caller pre-built a hierarchy (rows with __isGroupHeader / __parentGroup). */
  private readonly hasPreGroupedRows = computed(() =>
    this.rows().some((r) => (r as Record<string, unknown>)['__isGroupHeader'] === true),
  );

  protected readonly groupedRows = computed<readonly TableRow[]>(() => {
    const baseRows = this.rows();
    const groupKey = this.groupBy();
    if (!groupKey) {
      if (this.hasPreGroupedRows()) {
        const expanded = this.expandedGroups();
        return baseRows.filter((row) => {
          const parentGroup = (row as Record<string, unknown>)['__parentGroup'] as
            | string
            | undefined;
          if (!parentGroup) return true;
          return expanded[parentGroup] === undefined
            ? this.groupsExpandedByDefault()
            : expanded[parentGroup] === true;
        });
      }
      return baseRows;
    }

    const groups = new Map<string, TableRow[]>();
    for (const row of baseRows) {
      const key = String((row as Record<string, unknown>)[groupKey] ?? '');
      const entries = groups.get(key) ?? [];
      entries.push(row);
      groups.set(key, entries);
    }

    const expanded = this.expandedGroups();
    const flattened: TableRow[] = [];
    for (const [key, items] of groups) {
      const header = {
        __isGroupHeader: true,
        __groupKey: key,
        __groupCount: items.length,
      } as TableRow;
      flattened.push(header);
      const isExpanded =
        expanded[key] === undefined ? this.groupsExpandedByDefault() : expanded[key] === true;
      if (isExpanded) {
        flattened.push(...items.map((item) => ({ ...item, __parentGroup: key })));
      }
    }

    return flattened;
  });

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.groupedRows().length / this.pageSize())),
  );
  /** Clamped so a shrinking dataset never strands the view past the last page. */
  protected readonly effectivePage = computed(() => Math.min(this.page(), this.totalPages()));

  protected readonly pagedRows = computed<readonly TableRow[]>(() => {
    const source = this.groupedRows();

    if (!this.paginated()) {
      return source;
    }
    const start = (this.effectivePage() - 1) * this.pageSize();
    return source.slice(start, start + this.pageSize());
  });
  /** Range shown on the LEFT of the pagination bar (e.g. "1–10 de 42"). */
  protected readonly pageInfo = computed(() => {
    const total = this.groupedRows().length;
    if (total === 0) {
      return '';
    }
    const start = (this.effectivePage() - 1) * this.pageSize() + 1;
    const end = Math.min(this.effectivePage() * this.pageSize(), total);
    return `${start}–${end} de ${total}`;
  });

  /** Synthetic select column first, data columns, synthetic actions column last. */
  protected readonly effectiveColumns = computed<readonly TableColumn[]>(() => {
    const result: TableColumn[] = [];
    if (this.selectionMode() !== 'none') {
      result.push({ key: SELECT_KEY, header: '' });
    }
    if (this.groupBy() !== null || this.hasPreGroupedRows()) {
      result.push({ key: GROUP_TOGGLE_KEY, header: '' });
    }
    result.push(...this.columns());
    if (this.actions().length > 0) {
      result.push({ key: ACTIONS_KEY, header: 'Acciones', align: 'center' });
    }
    return result;
  });

  protected readonly selectionSummary = computed<string | null>(() => {
    if (this.selectionMode() !== 'multiple') {
      return null;
    }
    const count = this.selection().length;
    return count === 0 ? null : `${count} seleccionado${count === 1 ? '' : 's'}`;
  });

  // --- identity & selection helpers (the toggle itself is the contribution) ---

  protected rowId(row: TableRow): unknown {
    const selectionBaseKey = this.selectionBaseKey();
    if (selectionBaseKey !== null) {
      return row[selectionBaseKey];
    }
    const key = this.rowKey();
    return key === null ? row : row[key];
  }

  protected isSelected(row: TableRow): boolean {
    return this.selection().some((selected) => this.rowId(selected) === this.rowId(row));
  }

  protected isActionVisible(action: DynamicRowAction, row: TableRow): boolean {
    return action.visible === undefined || action.visible(row);
  }

  protected toggleGroup(key: string): void {
    this.expandedGroups.update((current) => {
      const expanded = current[key] === true;
      return { ...current, [key]: !expanded };
    });
  }

  protected isGroupExpanded(key: string): boolean {
    const value = this.expandedGroups()[key];
    return value === undefined ? this.groupsExpandedByDefault() : value === true;
  }

  protected selectionLabel(row: TableRow): string {
    const build = this.rowLabel();
    return build !== null ? build(row) : `Seleccionar fila ${String(this.rowId(row))}`;
  }

  /** Push the current selection out, shaped per mode (CVA value + output). */
  protected commitSelection(): void {
    const rows = this.selection();
    const value: DynamicSelectionValue =
      this.selectionMode() === 'single' ? (rows[0] ?? null) : rows;
    this.onChange(value);
    this.onTouched();
    this.selectionChange.emit(value);
  }

  /**
   * Selection logic. Updates the `selection` signal (always an array; single
   * mode holds at most one row) and publishes via `commitSelection()`. Identity
   * uses `rowId`, so a selection survives pagination. In single mode the active
   * row toggles OFF when re-clicked — set `rowKey` for stable identity. To make
   * single sticky instead, drop the `alreadySelected ? [] :` branch.
   */
  protected toggleSelection(row: TableRow): void {
    const alreadySelected = this.isSelected(row);
    if (this.selectionMode() === 'single') {
      this.selection.set(alreadySelected ? [] : [row]);
    } else {
      this.selection.update((selected) =>
        alreadySelected
          ? selected.filter((current) => this.rowId(current) !== this.rowId(row))
          : [...selected, row],
      );
    }
    this.commitSelection();
  }

  // --- ControlValueAccessor ---

  writeValue(value: DynamicSelectionValue): void {
    if (value === null || value === undefined) {
      this.selection.set([]);
      return;
    }
    this.selection.set(Array.isArray(value) ? [...value] : [value as TableRow]);
  }

  registerOnChange(fn: (value: DynamicSelectionValue) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
