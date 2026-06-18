import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { EntityService } from '../../entities/entity.service';
import { AnnotationService } from '../../annotations/annotation.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { toLabelMap } from '../../shared/reference-options';
import { InterestedPartyService } from '../interested-party.service';
import { InterestedPartyFormDialog } from '../interested-party-form-dialog';

/** Page listing interested parties, resolving the entity and annotation labels. */
@Component({
  selector: 'app-interested-party-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './interested-party-list.html',
})
export class InterestedPartyList {
  protected readonly partyService = inject(InterestedPartyService);
  protected readonly entityService = inject(EntityService);
  protected readonly annotationService = inject(AnnotationService);
  private readonly modal = inject(ModalService);

  private readonly entityNames = computed(() =>
    toLabelMap(this.entityService.entities(), (entity) => entity.name),
  );
  private readonly annotationLabels = computed(() =>
    toLabelMap(this.annotationService.annotations(), (annotation) => annotation.description),
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.partyService.parties().map((party) => ({
      id: party.id,
      entity: this.entityNames().get(String(party.idEntity)) ?? '—',
      annotation: this.annotationLabels().get(String(party.idAnnotation)) ?? `#${party.idAnnotation}`,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  protected readonly subtitle = computed(
    () => `Entidades interesadas en anotaciones (${this.partyService.totalParties()}).`,
  );

  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nuevo interesado', icon: 'plus', run: () => void this.openCreate() },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.partyService.loadAll();
      void this.entityService.loadAll();
      void this.annotationService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'entity', header: 'Entidad' },
    { key: 'annotation', header: 'Anotación' },
  ];

  protected readonly filterConfig = computed<FilterConfig>(() => ({
    fields: [
      {
        key: 'entity',
        label: 'Entidad',
        type: 'select',
        matchMode: 'equals',
        options: this.entityService.entities().map((entity) => ({ value: entity.name, label: entity.name })),
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
    await this.ensureRefsLoaded();
    void this.modal.open(InterestedPartyFormDialog, { title: 'Nuevo interesado', size: 'lg' });
  }

  private async openEdit(row: TableRow): Promise<void> {
    await this.ensureRefsLoaded();
    const party = this.partyService
      .parties()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(InterestedPartyFormDialog, {
      title: 'Editar interesado',
      size: 'lg',
      inputs: { party: party ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar interesado',
      size: 'sm',
      inputs: {
        message: '¿Eliminar este interesado? Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.partyService.deleteById(Number(row['id']));
    }
  }

  private async ensureRefsLoaded(): Promise<void> {
    const pending: Promise<void>[] = [];
    if (!this.entityService.hasEntities()) pending.push(this.entityService.loadAll());
    if (!this.annotationService.hasAnnotations()) pending.push(this.annotationService.loadAll());
    await Promise.all(pending);
  }
}
