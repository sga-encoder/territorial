import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { DepartmentService } from '../department.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { DepartmentFormDialog } from '../department-form-dialog';

/** Page listing every department with filter + actions (mirrors EntityList). */
@Component({
  selector: 'app-department-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './department-list.html',
})
export class DepartmentList {
  protected readonly departmentService = inject(DepartmentService);
  private readonly modal = inject(ModalService);

  /** Source rows (department → TableRow), fed to the filter; the table reads the result. */
  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.departmentService.departments().map((department) => ({
      id: department.id,
      name: department.name,
      daneCode: department.daneCode,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  /** Muted subtitle with the live registered-departments count. */
  protected readonly subtitle = computed(
    () => `Departamentos del país (${this.departmentService.totalDepartments()} registrados).`,
  );

  /** Header button dictionary — extend this array to add more actions. */
  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nuevo departamento', icon: 'plus', run: () => this.openCreate() },
  ];

  constructor() {
    // Data loads in the browser only — SSR must not call the backend at render time.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.departmentService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'daneCode', header: 'Código DANE', align: 'center' },
  ];

  protected readonly filterConfig: FilterConfig = {
    fields: [
      { key: 'name', label: 'Buscar por nombre', type: 'text', placeholder: 'Nombre del departamento', matchMode: 'contains' },
      { key: 'daneCode', label: 'Código DANE', type: 'text', placeholder: 'Ej. 17', matchMode: 'contains' },
    ],
  };

  protected readonly actions: readonly DynamicRowAction[] = [
    { id: 'edit', icon: 'edit', label: 'Editar', color: 'info', run: (row) => this.openEdit(row) },
    { id: 'delete', icon: 'trash', label: 'Eliminar', color: 'danger', run: (row) => void this.remove(row) },
  ];

  protected onFiltered(rows: readonly TableRow[]): void {
    this.filteredRows.set(rows);
  }

  /** Opens the create form in a modal (no navigation). */
  protected openCreate(): void {
    void this.modal.open(DepartmentFormDialog, { title: 'Nuevo departamento', size: 'lg' });
  }

  /** Opens the edit form in a modal, prefilled from the in-memory department. */
  private openEdit(row: TableRow): void {
    // Compare as string: backend ids may serialize as number OR string.
    const department = this.departmentService
      .departments()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(DepartmentFormDialog, {
      title: 'Editar departamento',
      size: 'lg',
      inputs: { department: department ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar departamento',
      size: 'sm',
      inputs: {
        message: `¿Eliminar “${String(row['name'])}”? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.departmentService.deleteById(Number(row['id']));
    }
  }
}
