import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { Vote } from '../../models/vote.model';
import { CitizenService } from '../citizens/citizen.service';
import { AnnotationService } from '../annotations/annotation.service';
import { toFieldOptions } from '../shared/reference-options';
import { VoteService } from './vote.service';

const DEFAULT_STARS = 3;

/** Create/Edit Vote form (modal) — relational selects + a 1–5 star range. */
@Component({
  selector: 'app-vote-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (voteService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear voto'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class VoteFormDialog {
  readonly vote = input<Vote | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly voteService = inject(VoteService);
  private readonly citizenService = inject(CitizenService);
  private readonly annotationService = inject(AnnotationService);

  protected readonly isEdit = computed(() => this.vote() !== null);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      if (!this.citizenService.hasCitizens()) void this.citizenService.loadAll();
      if (!this.annotationService.hasAnnotations()) void this.annotationService.loadAll();
    }
  }

  protected readonly schema = computed<FormSchema>(() => {
    const vote = this.vote();
    const citizenOptions = toFieldOptions(this.citizenService.citizens(), (citizen) => citizen.name);
    const annotationOptions = toFieldOptions(
      this.annotationService.annotations(),
      (annotation) => annotation.description,
    );
    return [
      {
        title: 'Voto',
        sections: [
          {
            fields: [
              { key: 'idCitizen', label: 'Ciudadano', type: 'select', span: 6,
                options: citizenOptions,
                initialValue: vote ? String(vote.idCitizen) : '',
                validators: [{ type: 'required' }] },
              { key: 'idAnnotation', label: 'Anotación', type: 'select', span: 6,
                options: annotationOptions,
                initialValue: vote ? String(vote.idAnnotation) : '',
                validators: [{ type: 'required' }] },
              { key: 'stars', label: 'Estrellas (1–5)', type: 'range', span: 12,
                min: 1, max: 5, step: 1, initialValue: vote?.stars ?? DEFAULT_STARS },
              { key: 'comment', label: 'Comentario', type: 'textarea', span: 12,
                initialValue: vote?.comment ?? '' },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    const vote = this.vote();
    const draft: CreateModel<Vote> = {
      idCitizen: Number(value['idCitizen']),
      idAnnotation: Number(value['idAnnotation']),
      stars: Number(value['stars']),
      comment: (value['comment'] as string | null) ?? '',
    };

    const success = vote
      ? await this.voteService.update({ id: vote.id, ...draft })
      : await this.voteService.create(draft);

    if (success) {
      this.modal.close(true);
    }
  }
}
