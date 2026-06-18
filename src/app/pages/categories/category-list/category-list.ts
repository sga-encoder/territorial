import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Button, Card, Container, EmptyState, Icon, ModalService, Text } from '../../../components/ui';
import type { TableRow } from '../../../components/ui';
import type { Category } from '../../../models/category.model';
import { DynamicTable, Filter, PageHeader } from '../../../components/dynamic';
import type { DynamicColumn, DynamicRowAction, FilterConfig, PageHeaderAction } from '../../../components/dynamic';
import { ConfirmDialog } from '../../shared/confirm-dialog';
import { toLabelMap } from '../../shared/reference-options';
import { ACTIVE_STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../../shared/status';
import { CategoryService } from '../category.service';
import { CategoryFormDialog } from '../category-form-dialog';

/** Page listing categories, resolving the (self-referential) parent name. */
@Component({
  selector: 'app-category-list',
  imports: [Button, Card, Container, EmptyState, Icon, Text, DynamicTable, Filter, PageHeader],
  templateUrl: './category-list.html',
})
export class CategoryList {
  protected readonly categoryService = inject(CategoryService);
  private readonly modal = inject(ModalService);

  /** All categories keyed by id — used to resolve each row's parent name. */
  private readonly categoryNames = computed(() =>
    toLabelMap(this.categoryService.categories(), (category) => category.name),
  );

  protected readonly rows = computed<readonly TableRow[]>(() =>
    this.categoryService.categories().map((category) => ({
      id: category.id,
      imageUrl: category.imageUrl,
      name: category.name,
      parent:
        category.idParentCategory === null
          ? '—'
          : (this.categoryNames().get(String(category.idParentCategory)) ?? '—'),
      description: category.description,
      status: category.status,
    })),
  );
  protected readonly filteredRows = signal<readonly TableRow[]>([]);

  /**
   * Hierarchical rows fed to the table: root categories with children become
   * collapsible group-header rows; subcategories carry __parentGroup so
   * DynamicTable can show/hide them. Root categories with no visible children
   * are plain rows. Computed from the filter output so search still works.
   */
  protected readonly tableRows = computed<readonly TableRow[]>(() => {
    const allCategories = this.categoryService.categories();
    const filtered = this.filteredRows();
    // filteredRows starts empty until the Filter effect fires its first emission.
    // Fall back to all category IDs so the table is never blank due to that race.
    const filteredIds =
      filtered.length > 0
        ? new Set(filtered.map((r) => Number(r['id'])))
        : new Set(allCategories.map((c) => c.id));

    const childrenByParentId = new Map<number, Category[]>();
    for (const cat of allCategories) {
      if (cat.idParentCategory !== null) {
        const siblings = childrenByParentId.get(cat.idParentCategory) ?? [];
        siblings.push(cat);
        childrenByParentId.set(cat.idParentCategory, siblings);
      }
    }

    const result: TableRow[] = [];
    for (const root of allCategories.filter((c) => c.idParentCategory === null)) {
      const allChildren = childrenByParentId.get(root.id) ?? [];
      const visibleChildren = allChildren.filter((c) => filteredIds.has(c.id));
      const rootVisible = filteredIds.has(root.id);

      if (!rootVisible && visibleChildren.length === 0) continue;

      const isExpandable = visibleChildren.length > 0;
      result.push({
        id: root.id,
        imageUrl: root.imageUrl,
        name: root.name,
        parent: '—',
        description: root.description,
        status: root.status,
        ...(isExpandable
          ? { __isGroupHeader: true, __groupKey: root.name, __groupCount: visibleChildren.length }
          : {}),
      });

      for (const child of visibleChildren) {
        result.push({
          id: child.id,
          imageUrl: child.imageUrl,
          name: child.name,
          parent: root.name,
          description: child.description,
          status: child.status,
          __parentGroup: root.name,
        });
      }
    }
    return result;
  });

  protected readonly subtitle = computed(
    () => `Categorías de anotaciones (${this.categoryService.totalCategories()}).`,
  );

  protected readonly headerActions: readonly PageHeaderAction[] = [
    { id: 'new', label: 'Nueva categoría', icon: 'plus', run: () => this.openCreate() },
  ];

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      void this.categoryService.loadAll();
    }
  }

  protected readonly columns: readonly DynamicColumn[] = [
    { key: 'imageUrl', header: 'Imagen', type: 'images' },
    { key: 'name', header: 'Nombre' },
    { key: 'description', header: 'Descripción' },
    { key: 'status', header: 'Estado', align: 'center', type: 'badge', typeConfig: STATUS_BADGE_CONFIG },
  ];

  protected readonly filterConfig: FilterConfig = {
    fields: [
      { key: 'name', label: 'Buscar por nombre', type: 'text', placeholder: 'Nombre de la categoría', matchMode: 'contains' },
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
    void this.modal.open(CategoryFormDialog, { title: 'Nueva categoría', size: 'lg' });
  }

  private openEdit(row: TableRow): void {
    const category = this.categoryService
      .categories()
      .find((current) => String(current.id) === String(row['id']));
    void this.modal.open(CategoryFormDialog, {
      title: 'Editar categoría',
      size: 'lg',
      inputs: { category: category ?? null },
    });
  }

  private async remove(row: TableRow): Promise<void> {
    const confirmed = await this.modal.open(ConfirmDialog, {
      title: 'Eliminar categoría',
      size: 'sm',
      inputs: {
        message: `¿Eliminar “${String(row['name'])}”? Esta acción no se puede deshacer.`,
        confirmLabel: 'Eliminar',
        confirmVariant: 'danger',
      },
    });
    if (confirmed === true) {
      await this.categoryService.deleteById(Number(row['id']));
    }
  }
}
