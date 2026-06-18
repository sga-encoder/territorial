import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { EntityService } from '../../entities/entity.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { toLabelMap } from '../../shared/reference-options';
import { ACTIVE_STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../../shared/status';
import { OfficialService } from '../official.service';
import { OfficialFormDialog } from '../official-form-dialog';
import { OfficialTrackingDialog } from '../official-tracking-dialog';

/** Page listing officials, with live-tracking start/stop actions in the header. */
@Component({
  selector: 'app-official-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './official-list.html',
})
export class OfficialList {
  protected readonly officialService = inject(OfficialService);
  protected readonly entityService = inject(EntityService);
  private readonly modal = inject(ModalService);

  private readonly entityNames = computed(() =>
    toLabelMap(this.entityService.entities(), (entity) => entity.name),
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.officialService.officials().map((official) => ({
      id: official.id,
      name: official.name,
      entity: this.entityNames().get(String(official.idEntity)) ?? '—',
      email: official.email,
      role: official.role,
      status: official.status,
      gpsActive: official.gpsActive,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  protected readonly subtitle = computed(
    () => `Funcionarios de entidades (${this.officialService.totalOfficials()}).`,
  );

  protected readonly headerActions = computed<readonly PageHeaderAction[]>(() => [
    { id: 'new', label: 'Nuevo funcionario', icon: 'plus', run: () => void this.openCreate() },
    {
      id: 'track',
      label: 'Iniciar seguimiento',
      icon: 'eye',
      variant: 'secondary',
      disabled: !this.officialService.hasOfficials(),
      loading: this.officialService.isTracking(),
      run: () => void this.startTracking(),
    },
    {
      id: 'stop',
      label: 'Detener seguimiento',
      icon: 'eye-off',
      variant: 'secondary',
      loading: this.officialService.isTracking(),
      run: () => void this.stopTracking(),
    },
  ]);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.officialService.loadAll();
      void this.entityService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'entity', header: 'Entidad' },
    { key: 'email', header: 'Correo' },
    { key: 'role', header: 'Cargo' },
    { key: 'status', header: 'Estado', align: 'center', type: 'badge', typeConfig: STATUS_BADGE_CONFIG },
    {
      key: 'gpsActive',
      header: 'GPS',
      align: 'center',
      type: 'boolean',
      typeConfig: { booleanLabels: { truthy: 'Activo', falsy: 'Inactivo' } },
    },
  ];

  protected readonly filterConfig = computed<FilterConfig>(() => ({
    fields: [
      { key: 'name', label: 'Buscar por nombre', type: 'text', placeholder: 'Nombre del funcionario', matchMode: 'contains' },
      {
        key: 'entity',
        label: 'Entidad',
        type: 'select',
        matchMode: 'equals',
        options: this.entityService.entities().map((entity) => ({ value: entity.name, label: entity.name })),
      },
      { key: 'status', label: 'Estado', type: 'select', matchMode: 'equals', options: [...ACTIVE_STATUS_OPTIONS] },
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
    await this.ensureEntitiesLoaded();
    void this.modal.open(OfficialFormDialog, { title: 'Nuevo funcionario', size: 'lg' });
  }

  private async openEdit(row: TableRow): Promise<void> {
    await this.ensureEntitiesLoaded();
    const official = this.officialService
      .officials()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(OfficialFormDialog, {
      title: 'Editar funcionario',
      size: 'lg',
      inputs: { official: official ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar funcionario',
      size: 'sm',
      inputs: {
        message: `¿Eliminar “${String(row['name'])}”? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.officialService.deleteById(Number(row['id']));
    }
  }

  /** Opens the multi-select dialog and starts tracking for the chosen officials. */
  private async startTracking(): Promise<void> {
    const selectedIds = await this.modal.open(OfficialTrackingDialog, {
      title: 'Iniciar seguimiento',
      size: 'lg',
      inputs: { officials: this.officialService.officials() },
    });
    if (Array.isArray(selectedIds) && selectedIds.length > 0) {
      await this.officialService.startTracking(selectedIds as number[]);
    }
  }

  private async stopTracking(): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Detener seguimiento',
      size: 'sm',
      inputs: {
        message: '¿Detener el seguimiento en tiempo real de todos los funcionarios?',
        confirmLabel: 'Detener',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.officialService.stopTracking();
    }
  }

  private async ensureEntitiesLoaded(): Promise<void> {
    if (!this.entityService.hasEntities()) {
      await this.entityService.loadAll();
    }
  }
}
