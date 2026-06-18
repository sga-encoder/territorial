import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { Official } from '../../models/official.model';
import type { ActiveStatus } from '../shared/status';
import { ACTIVE_STATUS_OPTIONS } from '../shared/status';
import { EntityService } from '../entities/entity.service';
import { toFieldOptions } from '../shared/reference-options';
import { OfficialService } from './official.service';

/**
 * Create/Edit Official form (modal). Edits the core fields (entity, name,
 * contact, role, status). The GPS fields are managed by the tracking feature, so
 * they keep their current values on edit and default to "off" on create.
 */
@Component({
  selector: 'app-official-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (officialService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear funcionario'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class OfficialFormDialog {
  readonly official = input<Official | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly officialService = inject(OfficialService);
  private readonly entityService = inject(EntityService);

  protected readonly isEdit = computed(() => this.official() !== null);

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID)) && !this.entityService.hasEntities()) {
      void this.entityService.loadAll();
    }
  }

  protected readonly schema = computed<FormSchema>(() => {
    const official = this.official();
    const entityOptions = toFieldOptions(this.entityService.entities(), (entity) => entity.name);
    return [
      {
        title: 'Funcionario',
        sections: [
          {
            fields: [
              { key: 'idEntity', label: 'Entidad', type: 'select', span: 6,
                options: entityOptions,
                initialValue: official ? String(official.idEntity) : '',
                validators: [{ type: 'required' }] },
              { key: 'status', label: 'Estado', type: 'select', span: 6,
                options: [...ACTIVE_STATUS_OPTIONS],
                initialValue: official?.status ?? 'active', validators: [{ type: 'required' }] },
              { key: 'name', label: 'Nombre completo', type: 'text', span: 6,
                initialValue: official?.name ?? '', validators: [{ type: 'required' }] },
              { key: 'role', label: 'Cargo', type: 'text', span: 6,
                initialValue: official?.role ?? '', validators: [{ type: 'required' }] },
              { key: 'email', label: 'Correo electrónico', type: 'email', span: 6,
                initialValue: official?.email ?? '', validators: [{ type: 'required' }, { type: 'email' }] },
              { key: 'phone', label: 'Teléfono', type: 'text', span: 6,
                initialValue: official?.phone ?? '', validators: [{ type: 'required' }] },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    const official = this.official();
    const draft: CreateModel<Official> = {
      idEntity: Number(value['idEntity']),
      name: value['name'] as string,
      email: value['email'] as string,
      phone: value['phone'] as string,
      role: value['role'] as string,
      status: value['status'] as ActiveStatus,
      // GPS fields are owned by the tracking feature — preserve on edit, send
      // null on create (last_gps_update is a backend DateTime; '' would 400).
      lastLatitude: official?.lastLatitude ?? null,
      lastLongitude: official?.lastLongitude ?? null,
      lastGpsUpdate: official?.lastGpsUpdate ?? null,
      gpsActive: official?.gpsActive ?? false,
    };

    const success = official
      ? await this.officialService.update({ id: official.id, ...draft })
      : await this.officialService.create(draft);

    if (success) {
      this.modal.close(true);
    }
  }
}
