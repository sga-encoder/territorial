import { Component, computed, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldShell } from './field-shell';
import {
  CONTROL_BASE_CLASSES,
  controlStateClasses,
  createFieldId,
  FormFieldControl,
  placeholderClasses,
} from './form-field-control';

/** Multi-line text field. Value: string. */
@Component({
  selector: 'ui-textarea',
  imports: [FieldShell],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => TextArea), multi: true },
  ],
  template: `
    <ui-field-shell
      [label]="label()"
      [error]="error()"
      [controlId]="fieldId"
      [errorId]="errorId"
      [filled]="value() !== ''"
      floatTop
    >
      <textarea
        [id]="fieldId"
        [class]="controlClasses()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="value()"
        [attr.rows]="rows()"
        [attr.aria-invalid]="error() !== null ? true : null"
        [attr.aria-describedby]="error() !== null ? errorId : null"
        (input)="onInput($event)"
        (blur)="markTouched()"
      ></textarea>
    </ui-field-shell>
  `,
})
export class TextArea extends FormFieldControl<string> {
  readonly label = input('');
  readonly placeholder = input('');
  readonly rows = input(3);
  readonly error = input<string | null>(null);

  protected readonly fieldId = createFieldId();
  protected readonly errorId = `${this.fieldId}-error`;

  constructor() {
    super('');
  }

  protected readonly controlClasses = computed(
    () =>
      `py-2 ${CONTROL_BASE_CLASSES} ${controlStateClasses(this.error() !== null, this.value() !== '')} ${placeholderClasses(this.label() !== '')}`,
  );

  protected onInput(event: Event): void {
    this.commitValue((event.target as HTMLTextAreaElement).value);
  }
}
