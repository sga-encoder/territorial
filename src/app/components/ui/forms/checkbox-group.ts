import { Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { FieldOption } from '../types';
import { createFieldId, FormFieldControl } from './form-field-control';

/**
 * Multi-select checkbox GROUP: one CVA that holds a `readonly string[]` of the
 * selected option values. Visual treatment mirrors `Checkbox` (hidden native
 * input + peer-driven custom box) and `Radio` (fieldset + legend as group label).
 * Options wrap horizontally so short lists are compact; taller lists scroll.
 */
@Component({
  selector: 'ui-checkbox-group',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CheckboxGroup), multi: true },
  ],
  template: `
    <fieldset class="flex flex-col gap-1.5" [disabled]="disabled()">
      @if (label() !== '') {
        <legend class="mb-1.5 text-sm font-medium text-foreground">{{ label() }}</legend>
      }
      @if (options().length === 0) {
        <p class="text-sm italic text-[var(--color-text-muted)]">Sin opciones disponibles.</p>
      } @else {
        <div class="flex flex-wrap gap-x-5 gap-y-2">
          @for (option of options(); track option.value) {
            <label
              class="inline-flex cursor-pointer items-center gap-2.5 text-sm text-foreground has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50"
            >
              <span class="relative inline-grid h-5 w-5 shrink-0 place-items-center">
                <input
                  type="checkbox"
                  class="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                  [id]="fieldId + '-' + option.value"
                  [checked]="isSelected(option.value)"
                  [disabled]="disabled() || option.disabled === true"
                  [attr.aria-describedby]="error() !== null ? errorId : null"
                  (change)="onToggle(option.value, $event)"
                  (blur)="markTouched()"
                />
                <!-- Custom box: matches Checkbox visual -->
                <span
                  class="pointer-events-none h-5 w-5 rounded-md border border-[var(--color-input-bdr-b)] bg-[var(--color-input-bg)] transition-[background-color,border-color,box-shadow,scale] duration-200 ease-out peer-hover:scale-105 peer-hover:border-primary peer-hover:shadow-[0_0_12px_rgba(74,143,231,0.35)] peer-checked:border-primary-strong peer-checked:bg-primary-strong peer-focus-visible:[box-shadow:0_0_0_3px_var(--color-focus-ring)]"
                ></span>
                <!-- Checkmark: pops in on check -->
                <svg
                  class="pointer-events-none absolute h-3 w-3 scale-0 text-on-primary transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] peer-checked:scale-100 motion-reduce:transition-none"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span>{{ option.label }}</span>
            </label>
          }
        </div>
      }
      @if (error(); as message) {
        <p [id]="errorId" class="text-sm text-danger">{{ message }}</p>
      }
    </fieldset>
  `,
})
export class CheckboxGroup extends FormFieldControl<readonly string[]> {
  readonly label = input('');
  readonly options = input.required<readonly FieldOption[]>();
  readonly error = input<string | null>(null);

  protected readonly fieldId = createFieldId();
  protected readonly errorId = `${this.fieldId}-error`;

  constructor() {
    super([]);
  }

  protected isSelected(optionValue: string): boolean {
    return this.value().includes(optionValue);
  }

  protected onToggle(optionValue: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = this.value();
    const next = checked
      ? [...current, optionValue]
      : current.filter((v) => v !== optionValue);
    this.commitValue(next);
  }
}
