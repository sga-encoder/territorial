import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import type { PendingUser } from '../../models/pending-user.model';
import type { ActiveStatus } from '../shared/status';
import { ACTIVE_STATUS_OPTIONS } from '../shared/status';
import { toFieldOptions } from '../shared/reference-options';
import { CitizenService } from '../citizens/citizen.service';
import { OfficialService } from '../officials/official.service';
import { EntityService } from '../entities/entity.service';
import { PendingUserService } from './pending-user.service';

/**
 * Batch-assigns a list of pending Firebase users to either citizen or official.
 * Common fields (phone, address or entity) are filled once and applied to all selected users.
 */
@Component({
  selector: 'app-assign-role-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      <ui-text size="sm" color="muted">
        Se {{ role() === 'citizen' ? 'crearán' : 'registrarán' }}
        <strong>{{ users().length }}</strong>
        {{ users().length === 1 ? 'usuario' : 'usuarios' }} como
        {{ role() === 'citizen' ? 'ciudadanos' : 'funcionarios' }}.
        El nombre y correo se tomarán de Firebase.
      </ui-text>

      @if (error(); as msg) {
        <ui-text color="danger">{{ msg }}</ui-text>
      }

      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="role() === 'citizen' ? 'Registrar ciudadanos' : 'Registrar funcionarios'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class AssignRoleDialog {
  readonly users = input.required<readonly PendingUser[]>();
  readonly role = input.required<'citizen' | 'official'>();

  private readonly modal = inject(ModalService);
  private readonly citizenService = inject(CitizenService);
  private readonly officialService = inject(OfficialService);
  private readonly entityService = inject(EntityService);
  private readonly pendingUserService = inject(PendingUserService);

  protected readonly error = computed(() =>
    this.role() === 'citizen' ? this.citizenService.error() : this.officialService.error(),
  );

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID)) && !this.entityService.hasEntities()) {
      void this.entityService.loadAll();
    }
  }

  protected readonly schema = computed<FormSchema>(() => {
    if (this.role() === 'official') {
      const entityOptions = toFieldOptions(this.entityService.entities(), (e) => e.name);
      return [
        {
          title: 'Datos del funcionario',
          sections: [
            {
              fields: [
                {
                  key: 'idEntity',
                  label: 'Entidad',
                  type: 'select',
                  span: 12,
                  options: entityOptions,
                  validators: [{ type: 'required' }],
                },
                {
                  key: 'phone',
                  label: 'Teléfono',
                  type: 'text',
                  span: 6,
                  validators: [{ type: 'required' }],
                },
                {
                  key: 'officialRole',
                  label: 'Cargo',
                  type: 'text',
                  span: 6,
                  initialValue: 'Funcionario',
                  validators: [{ type: 'required' }],
                },
                {
                  key: 'status',
                  label: 'Estado',
                  type: 'select',
                  span: 6,
                  options: [...ACTIVE_STATUS_OPTIONS],
                  initialValue: 'active',
                },
              ],
            },
          ],
        },
      ];
    }

    return [
      {
        title: 'Datos del ciudadano',
        sections: [
          {
            fields: [
              {
                key: 'phone',
                label: 'Teléfono',
                type: 'text',
                span: 6,
                validators: [{ type: 'required' }],
              },
              {
                key: 'address',
                label: 'Dirección',
                type: 'text',
                span: 6,
                validators: [{ type: 'required' }],
              },
              {
                key: 'status',
                label: 'Estado',
                type: 'select',
                span: 6,
                options: [...ACTIVE_STATUS_OPTIONS],
                initialValue: 'active',
              },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(formValue: FormValue): Promise<void> {
    const users = this.users();
    const role = this.role();
    let allOk: boolean;

    if (role === 'citizen') {
      const results = await Promise.all(
        users.map((user) =>
          this.citizenService.create({
            name: user.displayName ?? user.email,
            email: user.email,
            phone: String(formValue['phone'] ?? ''),
            address: String(formValue['address'] ?? ''),
            status: (formValue['status'] ?? 'active') as ActiveStatus,
            latitude: 0,
            longitude: 0,
          }),
        ),
      );
      allOk = results.every(Boolean);
    } else {
      const results = await Promise.all(
        users.map((user) =>
          this.officialService.create({
            idEntity: Number(formValue['idEntity']),
            name: user.displayName ?? user.email,
            email: user.email,
            phone: String(formValue['phone'] ?? ''),
            role: String(formValue['officialRole'] ?? 'Funcionario'),
            status: (formValue['status'] ?? 'active') as ActiveStatus,
            lastLatitude: null,
            lastLongitude: null,
            lastGpsUpdate: null,
            gpsActive: false,
          }),
        ),
      );
      allOk = results.every(Boolean);
    }

    if (allOk) {
      users.forEach((user) => this.pendingUserService.remove(user.uid));
      this.modal.close(true);
    }
  }
}
