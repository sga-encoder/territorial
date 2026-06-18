import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { AnnotationService } from '../../annotations/annotation.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { toLabelMap } from '../../shared/reference-options';
import { EvidenceService } from '../evidence.service';
import { EvidenceFormDialog } from '../evidence-form-dialog';
import { EVIDENCE_TYPE_LABELS, EVIDENCE_TYPE_OPTIONS } from '../evidence-types';

/** Page listing evidence files, resolving the parent annotation. */
@Component({
  selector: 'app-evidence-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './evidence-list.html',
})
export class EvidenceList {
  protected readonly evidenceService = inject(EvidenceService);
  protected readonly annotationService = inject(AnnotationService);
  private readonly modal = inject(ModalService);

  private readonly annotationLabels = computed(() =>
    toLabelMap(this.annotationService.annotations(), (annotation) => annotation.description),
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.evidenceService.evidences().map((evidence) => ({
      id: evidence.id,
      annotation: this.annotationLabels().get(String(evidence.idAnnotation)) ?? `#${evidence.idAnnotation}`,
      fileType: evidence.fileType,
      fileUrl: evidence.fileUrl,
      fileSize: evidence.fileSize,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  protected readonly subtitle = computed(
    () => `Evidencias adjuntas a anotaciones (${this.evidenceService.totalEvidences()}).`,
  );

  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nueva evidencia', icon: 'plus', run: () => void this.openCreate() },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.evidenceService.loadAll();
      void this.annotationService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'annotation', header: 'Anotación' },
    {
      key: 'fileType',
      header: 'Tipo',
      align: 'center',
      type: 'badge',
      typeConfig: { labels: EVIDENCE_TYPE_LABELS, badgeVariants: { image: 'info', video: 'primary', document: 'neutral', audio: 'warning', other: 'neutral' } },
    },
    { key: 'fileUrl', header: 'Archivo' },
    { key: 'fileSize', header: 'Tamaño (bytes)', align: 'right', type: 'number' },
  ];

  protected readonly filterConfig: FilterConfig = {
    fields: [
      { key: 'fileType', label: 'Tipo de evidencia', type: 'select', matchMode: 'equals', options: [...EVIDENCE_TYPE_OPTIONS] },
      { key: 'fileUrl', label: 'Buscar por archivo', type: 'text', placeholder: 'Nombre del archivo', matchMode: 'contains' },
    ],
  };

  protected readonly actions: readonly DynamicRowAction[] = [
    { id: 'edit', icon: 'edit', label: 'Editar', color: 'info', run: (row) => this.openEdit(row) },
    { id: 'delete', icon: 'trash', label: 'Eliminar', color: 'danger', run: (row) => void this.remove(row) },
  ];

  protected onFiltered(rows: readonly TableRow[]): void {
    this.filteredRows.set(rows);
  }

  protected async openCreate(): Promise<void> {
    await this.ensureAnnotationsLoaded();
    void this.modal.open(EvidenceFormDialog, { title: 'Nueva evidencia', size: 'lg' });
  }

  private async openEdit(row: TableRow): Promise<void> {
    await this.ensureAnnotationsLoaded();
    const evidence = this.evidenceService
      .evidences()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(EvidenceFormDialog, {
      title: 'Editar evidencia',
      size: 'lg',
      inputs: { evidence: evidence ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar evidencia',
      size: 'sm',
      inputs: {
        message: '¿Eliminar esta evidencia? Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.evidenceService.deleteById(Number(row['id']));
    }
  }

  private async ensureAnnotationsLoaded(): Promise<void> {
    if (!this.annotationService.hasAnnotations()) {
      await this.annotationService.loadAll();
    }
  }
}
