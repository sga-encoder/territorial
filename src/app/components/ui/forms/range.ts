import { booleanAttribute, Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { FieldShell } from './field-shell';
import { createFieldId, FormFieldControl } from './form-field-control';

/**
 * Numeric slider over the native range input, tinted with accent-color.
 * Value: number. Shows the live value beside the track unless hideValue.
 */
@Component({
  selector: 'ui-range',
  imports: [FieldShell],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Range), multi: true }],
  template: `
    <ui-field-shell
      [label]="label()"
      [error]="error()"
      [controlId]="fieldId"
      [errorId]="errorId"
      staticLabel
    >
      <div class="flex h-10 items-center gap-3">
        <input
          type="range"
          [id]="fieldId"
          class="w-full cursor-pointer disabled:cursor-not-allowed"
          [disabled]="disabled()"
          [value]="value()"
          [attr.min]="min()"
          [attr.max]="max()"
          [attr.step]="step()"
          [attr.aria-describedby]="error() !== null ? errorId : null"
          (input)="onInput($event)"
          (blur)="markTouched()"
        />
        @if (!hideValue()) {
          <span class="w-10 text-end text-sm tabular-nums text-muted">{{ value() }}</span>
        }
      </div>
    </ui-field-shell>
  `,
})
export class Range extends FormFieldControl<number> {
  readonly label = input('');
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly hideValue = input(false, { transform: booleanAttribute });
  readonly error = input<string | null>(null);

  protected readonly fieldId = createFieldId();
  protected readonly errorId = `${this.fieldId}-error`;

  constructor() {
    super(0);
  }

  protected onInput(event: Event): void {
    this.commitValue(Number((event.target as HTMLInputElement).value));
  }
}
