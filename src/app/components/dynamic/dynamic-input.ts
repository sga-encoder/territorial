import { Component, computed, input } from '@angular/core';
import { type FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  Checkbox,
  CheckboxGroup,
  DateField,
  fieldErrorMessage,
  FileDrop,
  InputText,
  Radio,
  Range,
  Select,
  Text,
  TextArea,
} from '../ui';
import type { InputTextType } from '../ui';
import { MapPointPicker } from '../map';
import type { FormFieldConfig } from './types';

/**
 * Renders one schema field as the matching kit CVA control, bound to the
 * FormControl the generator owns via `[formControl]` (an explicit instance — no
 * ControlContainer DI to cross the component boundary). Error display follows
 * RN-UI-07: quiet until `submitted`, then live via fieldErrorMessage.
 */
@Component({
  selector: 'ui-dynamic-input',
  imports: [ReactiveFormsModule, InputText, TextArea, Select, CheckboxGroup, Checkbox, Radio, DateField, Range, FileDrop, Text, MapPointPicker],
  template: `
    @switch (field().type) {
      @case ('textarea') {
        <ui-textarea
          [formControl]="control()"
          [label]="field().label"
          [placeholder]="field().placeholder ?? ''"
          [error]="errorMessage()"
        />
      }
      @case ('select') {
        <ui-select
          [formControl]="control()"
          [label]="field().label"
          [placeholder]="field().placeholder ?? 'Seleccionar…'"
          [options]="field().options ?? []"
          [error]="errorMessage()"
        />
      }
      @case ('multiselect') {
        <ui-checkbox-group
          [formControl]="control()"
          [label]="field().label"
          [options]="field().options ?? []"
          [error]="errorMessage()"
        />
      }
      @case ('checkbox') {
        <ui-checkbox [formControl]="control()" [label]="field().label" [error]="errorMessage()" />
      }
      @case ('radio') {
        <ui-radio
          [formControl]="control()"
          [label]="field().label"
          [options]="field().options ?? []"
          [error]="errorMessage()"
        />
      }
      @case ('date') {
        <ui-date [formControl]="control()" [label]="field().label" [error]="errorMessage()" />
      }
      @case ('range') {
        <ui-range
          [formControl]="control()"
          [label]="field().label"
          [min]="field().min ?? 0"
          [max]="field().max ?? 100"
          [step]="field().step ?? 1"
          [error]="errorMessage()"
        />
      }
      @case ('file') {
        <!-- FileDrop is not a CVA (emits File[]); mirror the selection into the
             control the generator owns so it joins the form value/validation. -->
        <ui-file-drop
          [label]="field().label"
          [accept]="field().accept ?? ''"
          [multiple]="field().multiple ?? false"
          [maxFiles]="field().maxFiles ?? null"
          [initialUrls]="initialUrlsComputed()"
          [hint]="field().hint ?? ''"
          [disabled]="control().disabled"
          [error]="errorMessage()"
          (filesChange)="onFiles($event)"
        />
      }
      @case ('location') {
        <!-- Heavy (MapLibre): deferred so only forms with a location field load it. -->
        @defer (on immediate) {
          <ui-map-point-picker
            [formControl]="control()"
            [label]="field().label"
            [error]="errorMessage()"
          />
        } @placeholder {
          <ui-text variant="caption" color="muted">Cargando mapa…</ui-text>
        }
      }
      @default {
        <ui-input
          [formControl]="control()"
          [label]="field().label"
          [type]="inputType()"
          [placeholder]="field().placeholder ?? ''"
          [error]="errorMessage()"
        />
      }
    }
  `,
  host: { class: 'block' },
})
export class DynamicInput {
  readonly field = input.required<FormFieldConfig>();
  readonly control = input.required<FormControl>();
  readonly submitted = input(false);

  protected readonly initialUrlsComputed = computed<readonly string[] | null>(() => {
    const v = (this.field().initialValue as unknown) as unknown;
    if (v === undefined || v === null) return null;
    if (Array.isArray(v)) return v.map((x) => String(x));
    return [String(v)];
  });

  protected readonly inputType = computed<InputTextType>(() => {
    const type = this.field().type;
    return type === 'email' || type === 'password' ? type : 'text';
  });

  /** A method (not a computed) so it re-runs each CD and tracks live validity. */
  protected errorMessage(): string | null {
    return fieldErrorMessage(this.control(), this.submitted(), this.field().messages);
  }

  /** Mirror FileDrop's emission into the reactive control (File[] value). */
  protected onFiles(files: readonly File[]): void {
    const control = this.control();
    control.setValue([...files]);
    control.markAsDirty();
    control.markAsTouched();
  }
}
