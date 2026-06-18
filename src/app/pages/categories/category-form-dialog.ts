import { Component, computed, inject, input, signal } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import type { FieldOption } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { Category } from '../../models/category.model';
import type { ActiveStatus } from '../shared/status';
import { ACTIVE_STATUS_OPTIONS } from '../shared/status';
import { toFieldOptions } from '../shared/reference-options';
import { CategoryService } from './category.service';

/** Empty option that maps the optional parent select back to a root category. */
const NO_PARENT_OPTION: FieldOption = { value: '', label: 'Sin categoría padre (raíz)' };

/**
 * Create/Edit Category form (modal, multipart). The parent select is
 * self-referential and optional: it lists every other category plus a "none"
 * option, and excludes the category being edited (a category can't be its own
 * parent). The image is an optional `file` field.
 */
@Component({
  selector: 'app-category-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (categoryService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      @if (parentRuleError(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear categoría'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class CategoryFormDialog {
  readonly category = input<Category | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly categoryService = inject(CategoryService);

  protected readonly isEdit = computed(() => this.category() !== null);
  protected readonly parentRuleError = signal<string | null>(null);

  protected readonly schema = computed<FormSchema>(() => {
    const category = this.category();
    const parentOptions: FieldOption[] = [
      NO_PARENT_OPTION,
      ...toFieldOptions(
        this.categoryService
          .categories()
          .filter((candidate) => candidate.id !== category?.id && candidate.idParentCategory === null),
        (candidate) => candidate.name,
      ),
    ];
    return [
      {
        title: 'Categoría',
        sections: [
          {
            fields: [
              { key: 'name', label: 'Nombre', type: 'text', span: 6,
                initialValue: category?.name ?? '', validators: [{ type: 'required' }] },
              { key: 'status', label: 'Estado', type: 'select', span: 6,
                options: [...ACTIVE_STATUS_OPTIONS],
                initialValue: category?.status ?? 'active', validators: [{ type: 'required' }] },
              { key: 'idParentCategory', label: 'Categoría padre (opcional)', type: 'select', span: 12,
                options: parentOptions,
                initialValue:
                  category?.idParentCategory != null ? String(category.idParentCategory) : '' },
              { key: 'description', label: 'Descripción', type: 'textarea', span: 12,
                initialValue: category?.description ?? '', validators: [{ type: 'required' }] },
            ],
          },
          {
            description: 'Imagen de la categoría (opcional).',
            fields: [
              { key: 'image', label: 'Imagen', type: 'file', span: 12, accept: 'image/*',
                initialValue: category?.imageUrl ?? '',
                hint: category ? `Imagen actual: ${category.imageUrl || '—'}` : 'PNG o JPG' },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    this.parentRuleError.set(null);
    const category = this.category();
    const image = (value['image'] as readonly File[] | undefined)?.[0];
    const parentRaw = value['idParentCategory'] as string;
    const parentId = parentRaw === '' ? null : Number(parentRaw);
    if (parentId !== null) {
      const selectedParent = this.categoryService
        .categories()
        .find((candidate) => candidate.id === parentId);
      if (selectedParent?.idParentCategory != null) {
        this.parentRuleError.set('Una subcategoría no puede tener subcategorías. Selecciona una categoría raíz como padre.');
        return;
      }
    }
    const draft: CreateModel<Category> = {
      idParentCategory: parentId,
      name: value['name'] as string,
      description: value['description'] as string,
      status: value['status'] as ActiveStatus,
      // The binary goes in `file`; keep the existing URL when not replaced.
      imageUrl: category?.imageUrl ?? '',
    };

    const success = category
      ? await this.categoryService.update({ id: category.id, ...draft }, image)
      : await this.categoryService.create(draft, image);

    if (success) {
      this.modal.close(true);
    }
  }
}
