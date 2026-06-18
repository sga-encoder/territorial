import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { CommuneService } from '../../communes/commune.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { toLabelMap } from '../../shared/reference-options';
import { ACTIVE_STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../../shared/status';
import { NeighborhoodService } from '../neighborhood.service';
import { NeighborhoodFormDialog } from '../neighborhood-form-dialog';

/** Page listing neighborhoods, resolving the parent commune name. */
@Component({
  selector: 'app-neighborhood-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './neighborhood-list.html',
})
export class NeighborhoodList {
  protected readonly neighborhoodService = inject(NeighborhoodService);
  protected readonly communeService = inject(CommuneService);
  private readonly modal = inject(ModalService);

  private readonly communeNames = computed(() =>
    toLabelMap(this.communeService.communes(), (commune) => commune.name),
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.neighborhoodService.neighborhoods().map((neighborhood) => ({
      id: neighborhood.id,
      name: neighborhood.name,
      commune: this.communeNames().get(String(neighborhood.idCommune)) ?? '—',
      status: neighborhood.status,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  protected readonly subtitle = computed(
    () => `Barrios por comuna (${this.neighborhoodService.totalNeighborhoods()} registrados).`,
  );

  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nuevo barrio', icon: 'plus', run: () => void this.openCreate() },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.neighborhoodService.loadAll();
      void this.communeService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'commune', header: 'Comuna' },
    { key: 'status', header: 'Estado', align: 'center', type: 'badge', typeConfig: STATUS_BADGE_CONFIG },
  ];

  protected readonly filterConfig = computed<FilterConfig>(() => ({
    fields: [
      { key: 'name', label: 'Buscar por nombre', type: 'text', placeholder: 'Nombre del barrio', matchMode: 'contains' },
      {
        key: 'commune',
        label: 'Comuna',
        type: 'select',
        matchMode: 'equals',
        options: this.communeService.communes().map((commune) => ({ value: commune.name, label: commune.name })),
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
    await this.ensureCommunesLoaded();
    void this.modal.open(NeighborhoodFormDialog, { title: 'Nuevo barrio', size: 'lg' });
  }

  private async openEdit(row: TableRow): Promise<void> {
    await this.ensureCommunesLoaded();
    const neighborhood = this.neighborhoodService
      .neighborhoods()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(NeighborhoodFormDialog, {
      title: 'Editar barrio',
      size: 'lg',
      inputs: { neighborhood: neighborhood ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar barrio',
      size: 'sm',
      inputs: {
        message: `¿Eliminar “${String(row['name'])}”? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.neighborhoodService.deleteById(Number(row['id']));
    }
  }

  private async ensureCommunesLoaded(): Promise<void> {
    if (!this.communeService.hasCommunes()) {
      await this.communeService.loadAll();
    }
  }
}
