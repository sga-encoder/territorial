import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { AnnotationCategory } from '../../models/annotation-category.model';
import { CategoryService } from '../categories/category.service';
import { AnnotationService } from '../annotations/annotation.service';
import { toFieldOptions } from '../shared/reference-options';
import { AnnotationCategoryService } from './annotation-category.service';

/** Create/Edit AnnotationCategory form (modal) — pure relational (category + annotation). */
@Component({
  selector: 'app-annotation-category-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (linkService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear vínculo'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class AnnotationCategoryFormDialog {
  readonly link = input<AnnotationCategory | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly linkService = inject(AnnotationCategoryService);
  private readonly categoryService = inject(CategoryService);
  private readonly annotationService = inject(AnnotationService);

  protected readonly isEdit = computed(() => this.link() !== null);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      if (!this.categoryService.hasCategories()) void this.categoryService.loadAll();
      if (!this.annotationService.hasAnnotations()) void this.annotationService.loadAll();
    }
  }

  protected readonly schema = computed<FormSchema>(() => {
    const link = this.link();
    const categoryOptions = toFieldOptions(this.categoryService.categories(), (category) => category.name);
    const annotationOptions = toFieldOptions(
      this.annotationService.annotations(),
      (annotation) => annotation.description,
    );
    return [
      {
        title: 'Vínculo',
        sections: [
          {
            fields: [
              { key: 'idCategory', label: 'Categoría', type: 'select', span: 6,
                options: categoryOptions,
                initialValue: link ? String(link.idCategory) : '',
                validators: [{ type: 'required' }] },
              { key: 'idAnnotation', label: 'Anotación', type: 'select', span: 6,
                options: annotationOptions,
                initialValue: link ? String(link.idAnnotation) : '',
                validators: [{ type: 'required' }] },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    const link = this.link();
    const draft: CreateModel<AnnotationCategory> = {
      idCategory: Number(value['idCategory']),
      idAnnotation: Number(value['idAnnotation']),
    };

    const success = link
      ? await this.linkService.update({ id: link.id, ...draft })
      : await this.linkService.create(draft);

    if (success) {
      this.modal.close(true);
    }
  }
}
