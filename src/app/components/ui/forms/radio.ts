import { Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { FieldOption } from '../types';
import { createFieldId, FormFieldControl } from './form-field-control';

/**
 * Radio GROUP: one CVA for the whole set. Native inputs (kept for a11y) are
 * visually hidden (`peer`); a custom ring renders the kit look with a primary
 * dot that pops in on selection, a halo on hover and a focus ring — all via
 * `peer-*` variants. The fieldset legend is the group label.
 */
@Component({
  selector: 'ui-radio',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Radio), multi: true }],
  template: `
    <fieldset class="flex flex-col gap-1.5" [disabled]="disabled()">
      @if (label() !== '') {
        <legend class="mb-1.5 text-sm font-medium text-foreground">{{ label() }}</legend>
      }
      <div class="flex flex-col gap-2">
        @for (option of options(); track option.value) {
          <label
            class="inline-flex cursor-pointer items-center gap-2.5 text-sm text-foreground has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50"
          >
            <span class="relative inline-grid h-5 w-5 shrink-0 place-items-center">
              <input
                type="radio"
                class="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
                [name]="fieldId"
                [value]="option.value"
                [checked]="option.value === value()"
                [disabled]="disabled() || option.disabled === true"
                [attr.aria-describedby]="error() !== null ? errorId : null"
                (change)="onSelect(option)"
                (blur)="markTouched()"
              />
              <!-- Custom ring -->
              <span
                class="pointer-events-none h-5 w-5 rounded-full border border-[var(--color-input-bdr-b)] bg-[var(--color-input-bg)] transition-[border-color,box-shadow,scale] duration-200 ease-out peer-hover:scale-105 peer-hover:border-primary peer-hover:shadow-[0_0_12px_rgba(74,143,231,0.35)] peer-checked:border-primary-strong peer-focus-visible:[box-shadow:0_0_0_3px_var(--color-focus-ring)]"
              ></span>
              <!-- Dot: pops in on select -->
              <span
                class="pointer-events-none absolute h-2.5 w-2.5 scale-0 rounded-full bg-primary-strong transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] peer-checked:scale-100 motion-reduce:transition-none"
              ></span>
            </span>
            <span>{{ option.label }}</span>
          </label>
        }
      </div>
      @if (error(); as message) {
        <p [id]="errorId" class="text-sm text-danger">{{ message }}</p>
      }
    </fieldset>
  `,
})
export class Radio extends FormFieldControl<string | null> {
  readonly label = input('');
  readonly options = input.required<readonly FieldOption[]>();
  readonly error = input<string | null>(null);

  protected readonly fieldId = createFieldId();
  protected readonly errorId = `${this.fieldId}-error`;

  constructor() {
    super(null);
  }

  protected onSelect(option: FieldOption): void {
    this.commitValue(option.value);
  }
}
