import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { CitizenService } from '../../citizens/citizen.service';
import { AnnotationService } from '../../annotations/annotation.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { toLabelMap } from '../../shared/reference-options';
import { VoteService } from '../vote.service';
import { VoteFormDialog } from '../vote-form-dialog';

/** Render a 1–5 rating as filled/empty stars (★/☆) for the table cell. */
function starsLabel(stars: number): string {
  const safe = Math.max(0, Math.min(5, Math.round(stars)));
  return '★'.repeat(safe) + '☆'.repeat(5 - safe);
}

/** Page listing votes, resolving citizen + annotation and drawing the stars. */
@Component({
  selector: 'app-vote-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './vote-list.html',
})
export class VoteList {
  protected readonly voteService = inject(VoteService);
  protected readonly citizenService = inject(CitizenService);
  protected readonly annotationService = inject(AnnotationService);
  private readonly modal = inject(ModalService);

  private readonly citizenNames = computed(() =>
    toLabelMap(this.citizenService.citizens(), (citizen) => citizen.name),
  );
  private readonly annotationLabels = computed(() =>
    toLabelMap(this.annotationService.annotations(), (annotation) => annotation.description),
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.voteService.votes().map((vote) => ({
      id: vote.id,
      citizen: this.citizenNames().get(String(vote.idCitizen)) ?? '—',
      annotation: this.annotationLabels().get(String(vote.idAnnotation)) ?? `#${vote.idAnnotation}`,
      stars: starsLabel(vote.stars),
      comment: vote.comment,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  protected readonly subtitle = computed(
    () => `Valoraciones ciudadanas de anotaciones (${this.voteService.totalVotes()}).`,
  );

  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nuevo voto', icon: 'plus', run: () => void this.openCreate() },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.voteService.loadAll();
      void this.citizenService.loadAll();
      void this.annotationService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'citizen', header: 'Ciudadano' },
    { key: 'annotation', header: 'Anotación' },
    { key: 'stars', header: 'Estrellas', align: 'center' },
    { key: 'comment', header: 'Comentario' },
  ];

  protected readonly filterConfig = computed<FilterConfig>(() => ({
    fields: [
      {
        key: 'citizen',
        label: 'Ciudadano',
        type: 'select',
        matchMode: 'equals',
        options: this.citizenService.citizens().map((citizen) => ({ value: citizen.name, label: citizen.name })),
      },
      { key: 'comment', label: 'Buscar en comentario', type: 'text', placeholder: 'Texto del comentario', matchMode: 'contains' },
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
    void this.modal.open(VoteFormDialog, { title: 'Nuevo voto', size: 'lg' });
  }

  private async openEdit(row: TableRow): Promise<void> {
    await this.ensureRefsLoaded();
    const vote = this.voteService.votes().find((current) => String(current.id) === String(row['id']));
    void this.modal.open(VoteFormDialog, {
      title: 'Editar voto',
      size: 'lg',
      inputs: { vote: vote ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar voto',
      size: 'sm',
      inputs: {
        message: '¿Eliminar este voto? Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.voteService.deleteById(Number(row['id']));
    }
  }

  private async ensureRefsLoaded(): Promise<void> {
    const pending: Promise<void>[] = [];
    if (!this.citizenService.hasCitizens()) pending.push(this.citizenService.loadAll());
    if (!this.annotationService.hasAnnotations()) pending.push(this.annotationService.loadAll());
    await Promise.all(pending);
  }
}
