import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { CategoryService } from '../../categories/category.service';
import { AnnotationService } from '../../annotations/annotation.service';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { toLabelMap } from '../../shared/reference-options';
import { AnnotationCategoryService } from '../annotation-category.service';
import { AnnotationCategoryFormDialog } from '../annotation-category-form-dialog';

/** Page listing annotation-category links, resolving both labels. */
@Component({
  selector: 'app-annotation-category-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './annotation-category-list.html',
})
export class AnnotationCategoryList {
  protected readonly linkService = inject(AnnotationCategoryService);
  protected readonly categoryService = inject(CategoryService);
  protected readonly annotationService = inject(AnnotationService);
  private readonly modal = inject(ModalService);

  private readonly categoryNames = computed(() =>
    toLabelMap(this.categoryService.categories(), (category) => category.name),
  );
  private readonly annotationLabels = computed(() =>
    toLabelMap(this.annotationService.annotations(), (annotation) => annotation.description),
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.linkService.links().map((link) => ({
      id: link.id,
      category: this.categoryNames().get(String(link.idCategory)) ?? '—',
      annotation: this.annotationLabels().get(String(link.idAnnotation)) ?? `#${link.idAnnotation}`,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  protected readonly subtitle = computed(
    () => `Categorías asignadas a anotaciones (${this.linkService.totalLinks()}).`,
  );

  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nuevo vínculo', icon: 'plus', run: () => void this.openCreate() },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.linkService.loadAll();
      void this.categoryService.loadAll();
      void this.annotationService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'category', header: 'Categoría' },
    { key: 'annotation', header: 'Anotación' },
  ];

  protected readonly filterConfig = computed<FilterConfig>(() => ({
    fields: [
      {
        key: 'category',
        label: 'Categoría',
        type: 'select',
        matchMode: 'equals',
        options: this.categoryService.categories().map((category) => ({ value: category.name, label: category.name })),
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
    void this.modal.open(AnnotationCategoryFormDialog, { title: 'Nuevo vínculo', size: 'lg' });
  }

  private async openEdit(row: TableRow): Promise<void> {
    await this.ensureRefsLoaded();
    const link = this.linkService.links().find((current) => String(current.id) === String(row['id']));
    void this.modal.open(AnnotationCategoryFormDialog, {
      title: 'Editar vínculo',
      size: 'lg',
      inputs: { link: link ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar vínculo',
      size: 'sm',
      inputs: {
        message: '¿Eliminar este vínculo? Esta acción no se puede deshacer.',
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.linkService.deleteById(Number(row['id']));
    }
  }

  private async ensureRefsLoaded(): Promise<void> {
    const pending: Promise<void>[] = [];
    if (!this.categoryService.hasCategories()) pending.push(this.categoryService.loadAll());
    if (!this.annotationService.hasAnnotations()) pending.push(this.annotationService.loadAll());
    await Promise.all(pending);
  }
}
