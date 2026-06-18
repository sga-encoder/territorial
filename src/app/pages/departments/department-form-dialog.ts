import { Component, computed, inject, input } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue, FormFieldConfig } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { Department } from '../../models/department.model';
import { DepartmentService } from './department.service';

/**
 * Create/Edit Department form rendered inside the glass Modal. Built with the
 * <ui-form-generator> from a metadata schema (project rule: every form uses the
 * generator). Opened by the list through ModalService with an optional `department`
 * input (null = create); edit prefills via each field's `initialValue`. On a valid
 * submit it saves and closes resolving `true`; ESC/backdrop/✕ resolve falsy.
 */
@Component({
  selector: 'app-department-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (departmentService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear departamento'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class DepartmentFormDialog {
  /** Department to edit; null/omitted opens the form in create mode. */
  readonly department = input<Department | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly departmentService = inject(DepartmentService);

  protected readonly isEdit = computed(() => this.department() !== null);

  /**
   * Single-page schema; memoized so the generator keeps a stable reference.
   * `daneCode` validation is intentionally a contribution point — see
   * `daneCodeValidators` below.
   */
  protected readonly schema = computed<FormSchema>(() => {
    const department = this.department();
    return [
      {
        title: 'Identificación',
        sections: [
          {
            fields: [
              { key: 'name', label: 'Nombre del departamento', type: 'text', span: 6,
                initialValue: department?.name ?? '', validators: [{ type: 'required' }] },
              { key: 'daneCode', label: 'Código DANE', type: 'text', span: 6,
                initialValue: department?.daneCode ?? '',
                hint: 'Código DANE del departamento (2 dígitos, ej. 17).',
                validators: this.daneCodeValidators },
            ],
          },
        ],
      },
    ];
  });

  /**
   * TODO(contribución): define las reglas de validación del código DANE.
   *
   * Hoy solo exige que esté presente. Los códigos DANE de departamento son
   * EXACTAMENTE 2 dígitos ("17", "05"). Decide qué tan estricta debe ser la
   * validación del front y completa este arreglo. Pistas (todas tipadas, sin `any`):
   *   { type: 'pattern', value: '^\\d{2}$', messages: { pattern: 'Debe ser 2 dígitos' } }
   *   { type: 'minLength', value: 2 } · { type: 'maxLength', value: 2 }
   * Trade-off: un `pattern` estricto da feedback inmediato, pero si el backend
   * algún día admite otro formato habría que relajarlo aquí.
   */
  private readonly daneCodeValidators: FormFieldConfig['validators'] = [
    { type: 'required' },
    // 👉 Añade aquí tu regla de formato del DANE.
  ];

  protected async onSubmit(value: FormValue): Promise<void> {
    const department = this.department();
    const draft: CreateModel<Department> = {
      name: value['name'] as string,
      daneCode: value['daneCode'] as string,
    };

    const success = department
      ? await this.departmentService.update({ id: department.id, ...draft })
      : await this.departmentService.create(draft);

    if (success) {
      this.modal.close(true);
    }
  }
}
