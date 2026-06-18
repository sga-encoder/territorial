import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { Commune } from '../../models/commune.model';
import type { ActiveStatus } from '../shared/status';
import { ACTIVE_STATUS_OPTIONS } from '../shared/status';
import { CityService } from '../cities/city.service';
import { toFieldOptions } from '../shared/reference-options';
import { CommuneService } from './commune.service';

/** Create/Edit Commune form (modal) — relational select `id_city` + status. */
@Component({
  selector: 'app-commune-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (communeService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear comuna'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class CommuneFormDialog {
  readonly commune = input<Commune | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly communeService = inject(CommuneService);
  private readonly cityService = inject(CityService);

  protected readonly isEdit = computed(() => this.commune() !== null);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID)) && !this.cityService.hasCities()) {
      void this.cityService.loadAll();
    }
  }

  protected readonly schema = computed<FormSchema>(() => {
    const commune = this.commune();
    const cityOptions = toFieldOptions(this.cityService.cities(), (city) => city.name);
    return [
      {
        title: 'Comuna',
        sections: [
          {
            fields: [
              { key: 'idCity', label: 'Ciudad', type: 'select', span: 6,
                options: cityOptions,
                initialValue: commune ? String(commune.idCity) : '',
                validators: [{ type: 'required' }] },
              { key: 'status', label: 'Estado', type: 'select', span: 6,
                options: [...ACTIVE_STATUS_OPTIONS],
                initialValue: commune?.status ?? 'active',
                validators: [{ type: 'required' }] },
              { key: 'name', label: 'Nombre de la comuna', type: 'text', span: 12,
                initialValue: commune?.name ?? '', validators: [{ type: 'required' }] },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    const commune = this.commune();
    const draft: CreateModel<Commune> = {
      idCity: Number(value['idCity']),
      name: value['name'] as string,
      status: value['status'] as ActiveStatus,
    };

    const success = commune
      ? await this.communeService.update({ id: commune.id, ...draft })
      : await this.communeService.create(draft);

    if (success) {
      this.modal.close(true);
    }
  }
}
