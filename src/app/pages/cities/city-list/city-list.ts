import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { DepartmentService } from '../../departments/department.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { toLabelMap } from '../../shared/reference-options';
import { CityService } from '../city.service';
import { CityFormDialog } from '../city-form-dialog';

/** Page listing cities, resolving the parent department name (relational pattern). */
@Component({
  selector: 'app-city-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './city-list.html',
})
export class CityList {
  protected readonly cityService = inject(CityService);
  protected readonly departmentService = inject(DepartmentService);
  private readonly modal = inject(ModalService);

  /** id→name lookup to resolve the department shown per row and in the filter. */
  private readonly departmentNames = computed(() =>
    toLabelMap(this.departmentService.departments(), (department) => department.name),
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.cityService.cities().map((city) => ({
      id: city.id,
      name: city.name,
      daneCode: city.daneCode,
      department: this.departmentNames().get(String(city.idDepartment)) ?? '—',
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  protected readonly subtitle = computed(
    () => `Ciudades y municipios (${this.cityService.totalCities()} registrados).`,
  );

  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nueva ciudad', icon: 'plus', run: () => void this.openCreate() },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.cityService.loadAll();
      void this.departmentService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'department', header: 'Departamento' },
    { key: 'daneCode', header: 'Código DANE', align: 'center' },
  ];

  /** Filter config depends on the loaded departments (select by name). */
  protected readonly filterConfig = computed<FilterConfig>(() => ({
    fields: [
      { key: 'name', label: 'Buscar por nombre', type: 'text', placeholder: 'Nombre de la ciudad', matchMode: 'contains' },
      {
        key: 'department',
        label: 'Departamento',
        type: 'select',
        matchMode: 'equals',
        options: this.departmentService
          .departments()
          .map((department) => ({ value: department.name, label: department.name })),
      },
    ],
  }));

  protected readonly actions: readonly DynamicRowAction[] = [
    { id: 'edit', icon: 'edit', label: 'Editar', color: 'info', run: (row) => this.openEdit(row) },
    { id: 'delete', icon: 'trash', label: 'Eliminar', color: 'danger', run: (row) => void this.remove(row) },
  ];

  protected onFiltered(rows: readonly TableRow[]): void {
    this.filteredRows.set(rows);
  }

  protected async openCreate(): Promise<void> {
    await this.ensureDepartmentsLoaded();
    void this.modal.open(CityFormDialog, { title: 'Nueva ciudad', size: 'lg' });
  }

  private async openEdit(row: TableRow): Promise<void> {
    await this.ensureDepartmentsLoaded();
    const city = this.cityService
      .cities()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(CityFormDialog, {
      title: 'Editar ciudad',
      size: 'lg',
      inputs: { city: city ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar ciudad',
      size: 'sm',
      inputs: {
        message: `¿Eliminar “${String(row['name'])}”? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.cityService.deleteById(Number(row['id']));
    }
  }

  /** Guarantee the department options exist before opening the form modal. */
  private async ensureDepartmentsLoaded(): Promise<void> {
    if (!this.departmentService.hasDepartments()) {
      await this.departmentService.loadAll();
    }
  }
}
