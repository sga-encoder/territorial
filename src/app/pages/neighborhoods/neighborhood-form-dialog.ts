import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { Neighborhood } from '../../models/neighborhood.model';
import type { ActiveStatus } from '../shared/status';
import { ACTIVE_STATUS_OPTIONS } from '../shared/status';
import { CommuneService } from '../communes/commune.service';
import { toFieldOptions } from '../shared/reference-options';
import { NeighborhoodService } from './neighborhood.service';

/** Create/Edit Neighborhood form (modal) — relational select `id_commune` + status. */
@Component({
  selector: 'app-neighborhood-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (neighborhoodService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear barrio'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class NeighborhoodFormDialog {
  readonly neighborhood = input<Neighborhood | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly neighborhoodService = inject(NeighborhoodService);
  private readonly communeService = inject(CommuneService);

  protected readonly isEdit = computed(() => this.neighborhood() !== null);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID)) && !this.communeService.hasCommunes()) {
      void this.communeService.loadAll();
    }
  }

  protected readonly schema = computed<FormSchema>(() => {
    const neighborhood = this.neighborhood();
    const communeOptions = toFieldOptions(this.communeService.communes(), (commune) => commune.name);
    return [
      {
        title: 'Barrio',
        sections: [
          {
            fields: [
              { key: 'idCommune', label: 'Comuna', type: 'select', span: 6,
                options: communeOptions,
                initialValue: neighborhood ? String(neighborhood.idCommune) : '',
                validators: [{ type: 'required' }] },
              { key: 'status', label: 'Estado', type: 'select', span: 6,
                options: [...ACTIVE_STATUS_OPTIONS],
                initialValue: neighborhood?.status ?? 'active',
                validators: [{ type: 'required' }] },
              { key: 'name', label: 'Nombre del barrio', type: 'text', span: 12,
                initialValue: neighborhood?.name ?? '', validators: [{ type: 'required' }] },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    const neighborhood = this.neighborhood();
    const draft: CreateModel<Neighborhood> = {
      idCommune: Number(value['idCommune']),
      name: value['name'] as string,
      status: value['status'] as ActiveStatus,
    };

    const success = neighborhood
      ? await this.neighborhoodService.update({ id: neighborhood.id, ...draft })
      : await this.neighborhoodService.create(draft);

    if (success) {
      this.modal.close(true);
    }
  }
}
