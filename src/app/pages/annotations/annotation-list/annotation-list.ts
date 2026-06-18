import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { NeighborhoodService } from '../../neighborhoods/neighborhood.service';
import { CitizenService } from '../../citizens/citizen.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { toLabelMap } from '../../shared/reference-options';
import { ACTIVE_STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../../shared/status';
import { AnnotationService } from '../annotation.service';
import { AnnotationFormDialog } from '../annotation-form-dialog';

/** Page listing annotations, resolving the neighborhood and citizen names. */
@Component({
  selector: 'app-annotation-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './annotation-list.html',
})
export class AnnotationList {
  protected readonly annotationService = inject(AnnotationService);
  protected readonly neighborhoodService = inject(NeighborhoodService);
  protected readonly citizenService = inject(CitizenService);
  private readonly modal = inject(ModalService);

  private readonly neighborhoodNames = computed(() =>
    toLabelMap(this.neighborhoodService.neighborhoods(), (neighborhood) => neighborhood.name),
  );
  private readonly citizenNames = computed(() =>
    toLabelMap(this.citizenService.citizens(), (citizen) => citizen.name),
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.annotationService.annotations().map((annotation) => ({
      id: annotation.id,
      description: annotation.description,
      neighborhood: this.neighborhoodNames().get(String(annotation.idNeighborhood)) ?? '—',
      citizen: this.citizenNames().get(String(annotation.idCitizen)) ?? '—',
      status: annotation.status,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  protected readonly subtitle = computed(
    () => `Anotaciones ciudadanas (${this.annotationService.totalAnnotations()}).`,
  );

  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nueva anotación', icon: 'plus', run: () => void this.openCreate() },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.annotationService.loadAll();
      void this.neighborhoodService.loadAll();
      void this.citizenService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'description', header: 'Descripción' },
    { key: 'neighborhood', header: 'Barrio' },
    { key: 'citizen', header: 'Ciudadano' },
    { key: 'status', header: 'Estado', align: 'center', type: 'badge', typeConfig: STATUS_BADGE_CONFIG },
  ];

  protected readonly filterConfig = computed<FilterConfig>(() => ({
    fields: [
      { key: 'description', label: 'Buscar en descripción', type: 'text', placeholder: 'Texto de la anotación', matchMode: 'contains' },
      {
        key: 'neighborhood',
        label: 'Barrio',
        type: 'select',
        matchMode: 'equals',
        options: this.neighborhoodService
          .neighborhoods()
          .map((neighborhood) => ({ value: neighborhood.name, label: neighborhood.name })),
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
    await this.ensureRefsLoaded();
    void this.modal.open(AnnotationFormDialog, { title: 'Nueva anotación', size: 'lg' });
  }

  private async openEdit(row: TableRow): Promise<void> {
    await this.ensureRefsLoaded();
    const annotation = this.annotationService
      .annotations()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(AnnotationFormDialog, {
      title: 'Editar anotación',
      size: 'lg',
      inputs: { annotation: annotation ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar anotación',
      size: 'sm',
      inputs: {
        message: '¿Eliminar esta anotación? Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.annotationService.deleteById(Number(row['id']));
    }
  }

  private async ensureRefsLoaded(): Promise<void> {
    const pending: Promise<void>[] = [];
    if (!this.neighborhoodService.hasNeighborhoods()) pending.push(this.neighborhoodService.loadAll());
    if (!this.citizenService.hasCitizens()) pending.push(this.citizenService.loadAll());
    await Promise.all(pending);
  }
}
