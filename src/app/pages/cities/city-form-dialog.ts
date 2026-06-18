import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, input, PLATFORM_ID } from '@angular/core';
import { Container, ModalService, Text } from '../../components/ui';
import { FormGenerator } from '../../components/dynamic';
import type { FormSchema, FormValue } from '../../components/dynamic';
import { CreateModel } from '../../core/http/create-model';
import type { City } from '../../models/city.model';
import { DepartmentService } from '../departments/department.service';
import { toFieldOptions } from '../shared/reference-options';
import { CityService } from './city.service';

/**
 * Create/Edit City form (modal). The `id_department` field is a relational
 * select whose options come from DepartmentService; values are stringified ids
 * (the kit compares with ===), parsed back to a number on submit.
 */
@Component({
  selector: 'app-city-form-dialog',
  imports: [FormGenerator, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      @if (cityService.error(); as errorMessage) {
        <ui-text color="danger">{{ errorMessage }}</ui-text>
      }
      <ui-form-generator
        [schema]="schema()"
        [submitLabel]="isEdit() ? 'Guardar cambios' : 'Crear ciudad'"
        (formSubmitted)="onSubmit($event)"
      />
    </ui-container>
  `,
})
export class CityFormDialog {
  readonly city = input<City | null>(null);

  protected readonly modal = inject(ModalService);
  protected readonly cityService = inject(CityService);
  private readonly departmentService = inject(DepartmentService);

  protected readonly isEdit = computed(() => this.city() !== null);

  constructor() {
    // Fallback: guarantee options even if the list didn't preload them.
    if (isPlatformBrowser(inject(PLATFORM_ID)) && !this.departmentService.hasDepartments()) {
      void this.departmentService.loadAll();
    }
  }

  protected readonly schema = computed<FormSchema>(() => {
    const city = this.city();
    const departmentOptions = toFieldOptions(
      this.departmentService.departments(),
      (department) => department.name,
    );
    return [
      {
        title: 'Ubicación',
        sections: [
          {
            fields: [
              { key: 'idDepartment', label: 'Departamento', type: 'select', span: 12,
                options: departmentOptions,
                initialValue: city ? String(city.idDepartment) : '',
                validators: [{ type: 'required' }] },
              { key: 'name', label: 'Nombre de la ciudad', type: 'text', span: 6,
                initialValue: city?.name ?? '', validators: [{ type: 'required' }] },
              { key: 'daneCode', label: 'Código DANE', type: 'text', span: 6,
                initialValue: city?.daneCode ?? '',
                hint: 'Código DANE del municipio (5 dígitos, ej. 17001).',
                validators: [{ type: 'required' }] },
            ],
          },
        ],
      },
    ];
  });

  protected async onSubmit(value: FormValue): Promise<void> {
    const city = this.city();
    const draft: CreateModel<City> = {
      idDepartment: Number(value['idDepartment']),
      name: value['name'] as string,
      daneCode: value['daneCode'] as string,
    };

    const success = city
      ? await this.cityService.update({ id: city.id, ...draft })
      : await this.cityService.create(draft);

    if (success) {
      this.modal.close(true);
    }
  }
}
