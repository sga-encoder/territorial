import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { Evidence, EvidenceType } from '../../models/evidence.model';
import { AnnotationService } from '../annotations/annotation.service';
import { toFieldOptions } from '../shared/reference-options';
import { EvidenceService } from './evidence.service';
import { EVIDENCE_TYPE_OPTIONS } from './evidence-types';

/**
 * Create/Edit Evidence form (modal, multipart). The binary goes in the `file`
 * field; the backend derives `file_url`/`file_size`. The file is required on
 * create and optional on edit (keep the existing one unless replaced).
 */
@Component({
  selector: 'app-evidence-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (evidenceService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear evidencia'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class EvidenceFormDialog {
  readonly evidence = input<Evidence | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly evidenceService = inject(EvidenceService);
  private readonly annotationService = inject(AnnotationService);

  protected readonly isEdit = computed(() => this.evidence() !== null);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID)) && !this.annotationService.hasAnnotations()) {
      void this.annotationService.loadAll();
    }
  }

  protected readonly schema = computed<FormSchema>(() => {
    const evidence = this.evidence();
    const annotationOptions = toFieldOptions(
      this.annotationService.annotations(),
      (annotation) => annotation.description,
    );
    return [
      {
        title: 'Evidencia',
        sections: [
          {
            fields: [
              { key: 'idAnnotation', label: 'Anotación', type: 'select', span: 6,
                options: annotationOptions,
                initialValue: evidence ? String(evidence.idAnnotation) : '',
                validators: [{ type: 'required' }] },
              { key: 'fileType', label: 'Tipo de evidencia', type: 'select', span: 6,
                options: [...EVIDENCE_TYPE_OPTIONS],
                initialValue: evidence?.fileType ?? 'image',
                validators: [{ type: 'required' }] },
            ],
          },
          {
            description: 'Archivo de la evidencia.',
            fields: [
              { key: 'file', label: 'Archivo', type: 'file', span: 12,
                initialValue: evidence?.fileUrl ?? '',
                hint: evidence ? `Archivo actual: ${evidence.fileUrl || '—'}` : 'Imagen, video o documento',
                validators: evidence ? [] : [{ type: 'required' }] },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    const evidence = this.evidence();
    const file = (value['file'] as readonly File[] | undefined)?.[0];
    const draft: CreateModel<Evidence> = {
      idAnnotation: Number(value['idAnnotation']),
      fileType: value['fileType'] as EvidenceType,
      // The backend fills these from the uploaded file; keep existing on edit.
      fileUrl: evidence?.fileUrl ?? '',
      fileSize: evidence?.fileSize ?? 0,
    };

    const success = evidence
      ? await this.evidenceService.update({ id: evidence.id, ...draft }, file)
      : await this.evidenceService.create(draft, file);

    if (success) {
      this.modal.close(true);
    }
  }
}
