import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { InterestedParty } from '../../models/interested-party.model';
import { EntityService } from '../entities/entity.service';
import { AnnotationService } from '../annotations/annotation.service';
import { toFieldOptions } from '../shared/reference-options';
import { InterestedPartyService } from './interested-party.service';

/** Create/Edit InterestedParty form (modal) — pure relational (entity + annotation). */
@Component({
  selector: 'app-interested-party-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (partyService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear interesado'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class InterestedPartyFormDialog {
  readonly party = input<InterestedParty | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly partyService = inject(InterestedPartyService);
  private readonly entityService = inject(EntityService);
  private readonly annotationService = inject(AnnotationService);

  protected readonly isEdit = computed(() => this.party() !== null);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      if (!this.entityService.hasEntities()) void this.entityService.loadAll();
      if (!this.annotationService.hasAnnotations()) void this.annotationService.loadAll();
    }
  }

  protected readonly schema = computed<FormSchema>(() => {
    const party = this.party();
    const entityOptions = toFieldOptions(this.entityService.entities(), (entity) => entity.name);
    const annotationOptions = toFieldOptions(
      this.annotationService.annotations(),
      (annotation) => annotation.description,
    );
    return [
      {
        title: 'Interesado',
        sections: [
          {
            fields: [
              { key: 'idEntity', label: 'Entidad', type: 'select', span: 6,
                options: entityOptions,
                initialValue: party ? String(party.idEntity) : '',
                validators: [{ type: 'required' }] },
              { key: 'idAnnotation', label: 'Anotación', type: 'select', span: 6,
                options: annotationOptions,
                initialValue: party ? String(party.idAnnotation) : '',
                validators: [{ type: 'required' }] },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    const party = this.party();
    const draft: CreateModel<InterestedParty> = {
      idEntity: Number(value['idEntity']),
      idAnnotation: Number(value['idAnnotation']),
    };

    const success = party
      ? await this.partyService.update({ id: party.id, ...draft })
      : await this.partyService.create(draft);

    if (success) {
      this.modal.close(true);
    }
  }
}
