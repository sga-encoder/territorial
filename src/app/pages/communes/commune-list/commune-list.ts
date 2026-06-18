import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { CityService } from '../../cities/city.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { toLabelMap } from '../../shared/reference-options';
import { ACTIVE_STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../../shared/status';
import { CommuneService } from '../commune.service';
import { CommuneFormDialog } from '../commune-form-dialog';

/** Page listing communes, resolving the parent city name. */
@Component({
  selector: 'app-commune-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './commune-list.html',
})
export class CommuneList {
  protected readonly communeService = inject(CommuneService);
  protected readonly cityService = inject(CityService);
  private readonly modal = inject(ModalService);

  private readonly cityNames = computed(() =>
    toLabelMap(this.cityService.cities(), (city) => city.name),
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.communeService.communes().map((commune) => ({
      id: commune.id,
      name: commune.name,
      city: this.cityNames().get(String(commune.idCity)) ?? '—',
      status: commune.status,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  protected readonly subtitle = computed(
    () => `Comunas por ciudad (${this.communeService.totalCommunes()} registradas).`,
  );

  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nueva comuna', icon: 'plus', run: () => void this.openCreate() },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.communeService.loadAll();
      void this.cityService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'city', header: 'Ciudad' },
    { key: 'status', header: 'Estado', align: 'center', type: 'badge', typeConfig: STATUS_BADGE_CONFIG },
  ];

  protected readonly filterConfig = computed<FilterConfig>(() => ({
    fields: [
      { key: 'name', label: 'Buscar por nombre', type: 'text', placeholder: 'Nombre de la comuna', matchMode: 'contains' },
      {
        key: 'city',
        label: 'Ciudad',
        type: 'select',
        matchMode: 'equals',
        options: this.cityService.cities().map((city) => ({ value: city.name, label: city.name })),
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
    await this.ensureCitiesLoaded();
    void this.modal.open(CommuneFormDialog, { title: 'Nueva comuna', size: 'lg' });
  }

  private async openEdit(row: TableRow): Promise<void> {
    await this.ensureCitiesLoaded();
    const commune = this.communeService
      .communes()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(CommuneFormDialog, {
      title: 'Editar comuna',
      size: 'lg',
      inputs: { commune: commune ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar comuna',
      size: 'sm',
      inputs: {
        message: `¿Eliminar “${String(row['name'])}”? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.communeService.deleteById(Number(row['id']));
    }
  }

  private async ensureCitiesLoaded(): Promise<void> {
    if (!this.cityService.hasCities()) {
      await this.cityService.loadAll();
    }
  }
}
