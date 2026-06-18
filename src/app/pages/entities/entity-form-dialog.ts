import { Component, computed, inject, input } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import type { FieldOption } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { Entity, EntityStatus } from '../../models/entity.model';
import { EntityService } from './entity.service';

const STATUS_OPTIONS: readonly FieldOption[] = [
  { value: 'active', label: 'Activa' },
  { value: 'inactive', label: 'Inactiva' },
];

/**
 * Create/Edit Entity form rendered inside the glass Modal (CU-01). Built with the
 * <ui-form-generator> from a metadata schema (project rule: every form uses the
 * generator). Opened by the list through ModalService with an optional `entity`
 * input (null = create); edit prefills via each field's `initialValue`. On a valid
 * submit it saves and closes resolving `true`; ESC/backdrop/✕ resolve falsy.
 */
@Component({
  selector: 'app-entity-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (entityService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear entidad'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class EntityFormDialog {
  /** Entity to edit; null/omitted opens the form in create mode. */
  readonly entity = input<Entity | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly entityService = inject(EntityService);

  protected readonly isEdit = computed(() => this.entity() !== null);

  /**
   * Two-page wizard schema; memoized so the generator keeps a stable reference.
   * The logo is a `file` field (image picker). It's required only on create — on
   * edit the existing logo is kept unless the user uploads a new one.
   */
  protected readonly schema = computed<FormSchema>(() => {
    const entity = this.entity();
    return [
      {
        title: 'Identificación',
        sections: [
          {
            fields: [
              { key: 'name', label: 'Nombre de la entidad', type: 'text', span: 12,
                initialValue: entity?.name ?? '', validators: [{ type: 'required' }] },
              { key: 'nit', label: 'NIT', type: 'text', span: 6,
                initialValue: entity?.nit ?? '', validators: [{ type: 'required' }] },
              { key: 'status', label: 'Estado', type: 'select', span: 6,
                options: STATUS_OPTIONS, initialValue: entity?.status ?? 'active',
                validators: [{ type: 'required' }] },
            ],
          },
        ],
      },
      {
        title: 'Contacto',
        sections: [
          {
            fields: [
              { key: 'email', label: 'Correo electrónico', type: 'email', span: 6,
                initialValue: entity?.email ?? '', validators: [{ type: 'required' }, { type: 'email' }] },
              { key: 'phone', label: 'Teléfono', type: 'text', span: 6,
                initialValue: entity?.phone ?? '', validators: [{ type: 'required' }] },
              { key: 'address', label: 'Dirección', type: 'text', span: 12,
                initialValue: entity?.address ?? '', validators: [{ type: 'required' }] },
            ],
          },
        ],
      },
      {
        title: 'Logo',
        sections: [
          {
            description: 'Sube el logo de la entidad (imagen).',
            fields: [
              { key: 'logo', label: 'Logo de la entidad', type: 'file', span: 12,
                accept: 'image/*',
                initialValue: entity?.logoUrl ?? '',
                hint: entity ? `Logo actual: ${entity.logoUrl || '—'}` : 'PNG o JPG',
                validators: entity ? [] : [{ type: 'required' }] },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    const entity = this.entity();
    const logo = (value['logo'] as readonly File[] | undefined)?.[0];
    const draft: CreateModel<Entity> = {
      name: value['name'] as string,
      status: value['status'] as EntityStatus,
      nit: value['nit'] as string,
      phone: value['phone'] as string,
      email: value['email'] as string,
      address: value['address'] as string,
      // The binary goes in `file`; keep the existing URL when not replaced.
      logoUrl: entity?.logoUrl ?? '',
    };

    const success = entity
      ? await this.entityService.update({ id: entity.id, ...draft }, logo)
      : await this.entityService.create(draft, logo);

    if (success) {
      this.modal.close(true);
    }
  }
}
