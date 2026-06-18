import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { Spinner } from '../spinner/spinner';
import type { TableAlign, TableCellContext, TableColumn, TableRow } from '../types';

/**
 * Marks a custom cell template inside <ui-table>; the value is the column
 * key it replaces. The row arrives as the implicit template context:
 *
 *   <ng-template uiTableCell="status" let-row>…</ng-template>
 */
@Directive({ selector: 'ng-template[uiTableCell]' })
export class TableCellDef {
  readonly uiTableCell = input.required<string>();
  readonly templateRef = inject(TemplateRef<TableCellContext>);
}

const ALIGN_CLASSES: Record<TableAlign, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

/**
 * Data table on a solid surface (dense content is read, never glass).
 * Columns and rows arrive as inputs; any column can swap its default text
 * rendering for a projected template (TableCellDef). `loading` keeps the
 * header visible and replaces the body with a spinner row.
 */
@Component({
  selector: 'ui-table',
  imports: [NgTemplateOutlet, Spinner],
  template: `
    <div
      class="inset-shadow-glass-highlight overflow-x-auto rounded-xl border border-glass-border bg-glass-surface shadow-md backdrop-blur-glass [border-top-color:var(--color-border-h)]"
    >
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-glass-border">
            @for (column of columns(); track column.key) {
              <th
                scope="col"
                class="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted"
                [class]="alignClass(column)"
              >
                {{ column.header }}
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @if (loading()) {
            <tr>
              <td [attr.colspan]="columns().length" class="px-4 py-10 text-center">
                <ui-spinner label="Cargando registros" />
              </td>
            </tr>
          } @else if (rows().length === 0) {
            <tr>
              <td [attr.colspan]="columns().length" class="px-4 py-10 text-center text-muted">
                {{ emptyMessage() }}
              </td>
            </tr>
          } @else {
            @for (row of rows(); track $index) {
              <tr
                class="border-b border-glass-border transition-colors last:border-b-0 odd:bg-transparent even:bg-[rgba(130,150,255,0.05)] hover:bg-primary-tint"
              >
                @for (column of columns(); track column.key) {
                  <td class="px-4 py-3 text-foreground" [class]="alignClass(column)">
                    @if (cellTemplateFor(column.key); as cellTemplate) {
                      <ng-container
                        *ngTemplateOutlet="cellTemplate; context: { $implicit: row }"
                      />
                    } @else {
                      {{ formatCell(row, column) }}
                    }
                  </td>
                }
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
  `,
  host: { class: 'block' },
})
export class Table {
  readonly columns = input.required<readonly TableColumn[]>();
  readonly rows = input.required<readonly TableRow[]>();
  readonly loading = input(false);
  readonly emptyMessage = input('Sin registros');

  private readonly cellDefs = contentChildren(TableCellDef);
  private readonly cellTemplates = computed(
    () => new Map(this.cellDefs().map((cellDef) => [cellDef.uiTableCell(), cellDef.templateRef])),
  );

  protected cellTemplateFor(key: string): TemplateRef<TableCellContext> | null {
    return this.cellTemplates().get(key) ?? null;
  }

  protected alignClass(column: TableColumn): string {
    return ALIGN_CLASSES[column.align ?? 'left'];
  }

  protected formatCell(row: TableRow, column: TableColumn): string {
    const value = row[column.key];
    return value === null || value === undefined ? '—' : String(value);
  }
}
