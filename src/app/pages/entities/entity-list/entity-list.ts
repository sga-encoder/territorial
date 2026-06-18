import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { EntityService } from '../entity.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { EntityFormDialog } from '../entity-form-dialog';

/** Page listing every registered entity with filter + actions (CU-01). */
@Component({
  selector: 'app-entity-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './entity-list.html',
})
export class EntityList {
  protected readonly entityService = inject(EntityService);
  private readonly modal = inject(ModalService);

  /** Source rows (entity → TableRow), fed to the filter; the table reads the result. */
  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.entityService.entities().map((entity) => ({
      id: entity.id,
      logoUrl: entity.logoUrl,
      name: entity.name,
      nit: entity.nit,
      status: entity.status,
      email: entity.email,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  /** Muted subtitle with the live registered-entities count. */
  protected readonly subtitle = computed(
    () =>
      `Administración de entidades públicas y privadas (${this.entityService.totalEntities()} registradas).`,
  );

  /** Header button dictionary — extend this array to add more actions. */
  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nueva entidad', icon: 'plus', run: () => this.openCreate() },
  ];

  constructor() {
    // Data loads in the browser only — SSR must not call the backend at render time.
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.entityService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'logoUrl', header: 'Logo', type: 'images' },
    { key: 'name', header: 'Nombre' },
    { key: 'nit', header: 'NIT' },
    {
      key: 'status',
      header: 'Estado',
      align: 'center',
      type: 'badge',
      typeConfig: {
        labels: { active: 'Activa', inactive: 'Inactiva' },
        badgeVariants: { active: 'success', inactive: 'neutral' },
      },
    },
    { key: 'email', header: 'Correo' },
  ];

  protected readonly filterConfig: FilterConfig = {
    fields: [
      { key: 'name', label: 'Buscar por nombre', type: 'text', placeholder: 'Nombre de la entidad', matchMode: 'contains' },
      {
        key: 'status',
        label: 'Estado',
        type: 'select',
        matchMode: 'equals',
        options: [
          { value: 'active', label: 'Activa' },
          { value: 'inactive', label: 'Inactiva' },
        ],
      },
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
    void this.modal.open(EntityFormDialog, { title: 'Nueva entidad', size: 'lg' });
  }

  /** Opens the edit form in a modal, prefilled from the in-memory entity. */
  private openEdit(row: TableRow): void {
    // Compare as string: backend ids may serialize as number OR string.
    const entity = this.entityService
      .entities()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(EntityFormDialog, {
      title: 'Editar entidad',
      size: 'lg',
      inputs: { entity: entity ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar entidad',
      size: 'sm',
      inputs: {
        message: `¿Eliminar “${String(row['name'])}”? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.entityService.deleteById(Number(row['id']));
    }
  }
}
