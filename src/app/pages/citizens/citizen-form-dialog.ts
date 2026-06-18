import { Component, computed, inject, input } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { Citizen } from '../../models/citizen.model';
import type { ActiveStatus } from '../shared/status';
import { ACTIVE_STATUS_OPTIONS } from '../shared/status';
import { CitizenService } from './citizen.service';

/**
 * Create/Edit Citizen form (modal), as a two-step wizard: step 1 the citizen
 * details, step 2 the location. The address is a geolocated pin (spec.md RN-10):
 * the `location` field renders the map point picker and emits a `"lat,lng"`
 * string, parsed back into latitude/longitude on submit. Splitting the map into
 * its own page also defers MapLibre until the user reaches step 2.
 */
@Component({
  selector: 'app-citizen-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (citizenService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear ciudadano'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class CitizenFormDialog {
  readonly citizen = input<Citizen | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly citizenService = inject(CitizenService);

  protected readonly isEdit = computed(() => this.citizen() !== null);

  protected readonly schema = computed<FormSchema>(() => {
    const citizen = this.citizen();
    return [
      {
        title: 'Datos del ciudadano',
        sections: [
          {
            title: 'Identificación',
            fields: [
              { key: 'name', label: 'Nombre completo', type: 'text', span: 12,
                initialValue: citizen?.name ?? '', validators: [{ type: 'required' }] },
              { key: 'email', label: 'Correo electrónico', type: 'email', span: 6,
                initialValue: citizen?.email ?? '', validators: [{ type: 'required' }, { type: 'email' }] },
              { key: 'phone', label: 'Teléfono', type: 'text', span: 6,
                initialValue: citizen?.phone ?? '', validators: [{ type: 'required' }] },
              { key: 'address', label: 'Dirección', type: 'text', span: 6,
                initialValue: citizen?.address ?? '', validators: [{ type: 'required' }] },
              { key: 'status', label: 'Estado', type: 'select', span: 6,
                options: [...ACTIVE_STATUS_OPTIONS],
                initialValue: citizen?.status ?? 'active', validators: [{ type: 'required' }] },
            ],
          },
        ],
      },
      {
        title: 'Ubicación',
        description: 'Busca la dirección o haz clic en el mapa para fijar el punto.',
        sections: [
          {
            fields: [
              { key: 'location', label: 'Ubicación en el mapa', type: 'location', span: 12,
                initialValue: citizen ? `${citizen.latitude},${citizen.longitude}` : '',
                validators: [{ type: 'required' }],
                messages: { required: 'Selecciona la ubicación en el mapa.' } },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    const citizen = this.citizen();
    const [latitude, longitude] = String(value['location']).split(',').map(Number);
    const draft: CreateModel<Citizen> = {
      name: value['name'] as string,
      email: value['email'] as string,
      phone: value['phone'] as string,
      address: value['address'] as string,
      latitude,
      longitude,
      status: value['status'] as ActiveStatus,
    };

    const success = citizen
      ? await this.citizenService.update({ id: citizen.id, ...draft })
      : await this.citizenService.create(draft);

    if (success) {
      this.modal.close(true);
    }
  }
}
