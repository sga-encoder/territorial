import { Component, computed, inject, input, signal } from '@angular/core';
import { Button, Container, Text, ModalService } from '../../components/ui';
import type { TableRow } from '../../components/ui';
import { DynamicTable } from '../../components/dynamic';
import type { DynamicColumn, DynamicSelectionValue } from '../../components/dynamic';
import type { Official } from '../../models/official.model';

/**
 * Multi-select dialog to start live tracking. Lists the officials in a
 * `<ui-dynamic-table>` (selectionMode `multiple`) and resolves the modal with
 * the selected ids (`number[]`) when confirmed, or `null` when cancelled.
 */
@Component({
  selector: 'app-official-tracking-dialog',
  imports: [Button, Container, Text, DynamicTable],
  template: `
    <ui-container direction="column" [gap]="4">
      <ui-text color="muted">
        Selecciona los funcionarios cuyo GPS quieres seguir en tiempo real.
      </ui-text>

      <ui-dynamic-table
        [columns]="columns"
        [rows]="rows()"
        selectionMode="multiple"
        rowKey="id"
        [rowLabel]="rowLabel"
        [pageSize]="8"
        (selectionChange)="onSelectionChange($event)"
      />

      <ui-container justify="between" center="vertical" [gap]="2" wrap>
        <ui-text color="muted" variant="caption">
          {{ selectedIds().length }} seleccionado(s)
        </ui-text>
        <ui-container justify="end" [gap]="2">
          <ui-button variant="ghost" (clicked)="modal.close(null)">Cancelar</ui-button>
          <ui-button
            [disabled]="selectedIds().length === 0"
            (clicked)="modal.close(selectedIds())"
          >
            Iniciar seguimiento
          </ui-button>
        </ui-container>
      </ui-container>
    </ui-container>
  `,
})
export class OfficialTrackingDialog {
  /** Officials to choose from (already loaded by the list). */
  readonly officials = input<readonly Official[]>([]);

  protected readonly modal = inject(ModalService);

  protected readonly selectedIds = signal<readonly number[]>([]);

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.officials().map((official) => ({
      id: official.id,
      name: official.name,
      role: official.role,
    })),
  );

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'name', header: 'Funcionario' },
    { key: 'role', header: 'Cargo' },
  ];

  protected readonly rowLabel = (row: TableRow): string => `Seleccionar ${String(row['name'])}`;

  protected onSelectionChange(selection: DynamicSelectionValue): void {
    const selectedRows = Array.isArray(selection) ? selection : selection ? [selection] : [];
    this.selectedIds.set(selectedRows.map((row) => Number((row as TableRow)['id'])));
  }
}
