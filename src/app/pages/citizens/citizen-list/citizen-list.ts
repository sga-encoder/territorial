import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { ACTIVE_STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../../shared/status';
import { CitizenService } from '../citizen.service';
import { CitizenFormDialog } from '../citizen-form-dialog';

/** Page listing citizens with their coordinates. No parent relation. */
@Component({
  selector: 'app-citizen-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './citizen-list.html',
})
export class CitizenList {
  protected readonly citizenService = inject(CitizenService);
  private readonly modal = inject(ModalService);

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.citizenService.citizens().map((citizen) => ({
      id: citizen.id,
      name: citizen.name,
      email: citizen.email,
      phone: citizen.phone,
      coordinates: `${citizen.latitude}, ${citizen.longitude}`,
      status: citizen.status,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  protected readonly subtitle = computed(
    () => `Ciudadanos registrados (${this.citizenService.totalCitizens()}).`,
  );

  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nuevo ciudadano', icon: 'plus', run: () => this.openCreate() },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.citizenService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'email', header: 'Correo' },
    { key: 'phone', header: 'Teléfono' },
    { key: 'coordinates', header: 'Coordenadas', align: 'center' },
    { key: 'status', header: 'Estado', align: 'center', type: 'badge', typeConfig: STATUS_BADGE_CONFIG },
  ];

  protected readonly filterConfig: FilterConfig = {
    fields: [
      { key: 'name', label: 'Buscar por nombre', type: 'text', placeholder: 'Nombre del ciudadano', matchMode: 'contains' },
      { key: 'email', label: 'Correo', type: 'text', placeholder: 'Correo electrónico', matchMode: 'contains' },
      { key: 'status', label: 'Estado', type: 'select', matchMode: 'equals', options: [...ACTIVE_STATUS_OPTIONS] },
    ],
  };

  protected readonly actions: readonly DynamicRowAction[] = [
    { id: 'edit', icon: 'edit', label: 'Editar', color: 'info', run: (row) => this.openEdit(row) },
    { id: 'delete', icon: 'trash', label: 'Eliminar', color: 'danger', run: (row) => void this.remove(row) },
  ];

  protected onFiltered(rows: readonly TableRow[]): void {
    this.filteredRows.set(rows);
  }

  protected openCreate(): void {
    void this.modal.open(CitizenFormDialog, { title: 'Nuevo ciudadano', size: 'lg' });
  }

  private openEdit(row: TableRow): void {
    const citizen = this.citizenService
      .citizens()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(CitizenFormDialog, {
      title: 'Editar ciudadano',
      size: 'lg',
      inputs: { citizen: citizen ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar ciudadano',
      size: 'sm',
      inputs: {
        message: `¿Eliminar “${String(row['name'])}”? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.citizenService.deleteById(Number(row['id']));
    }
  }
}
