import { Component, forwardRef, input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { createFieldId, FormFieldControl } from './form-field-control';

/**
 * Boolean field. The native checkbox stays for full keyboard/AT support but is
 * visually hidden (`peer`); a custom box renders the kit look: glass cavity →
 * Solid 3D primary when checked, with a checkmark that pops in, a halo on hover
 * and a focus ring driven purely by `peer-*` variants.
 */
@Component({
  selector: 'ui-checkbox',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Checkbox), multi: true },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      <label
        [for]="fieldId"
        class="inline-flex cursor-pointer items-center gap-2.5 text-sm text-foreground has-[input:disabled]:cursor-not-allowed has-[input:disabled]:opacity-50"
      >
        <span class="relative inline-grid h-5 w-5 shrink-0 place-items-center">
          <input
            type="checkbox"
            [id]="fieldId"
            class="peer absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            [checked]="value()"
            [disabled]="disabled()"
            [attr.aria-invalid]="error() !== null ? true : null"
            [attr.aria-describedby]="error() !== null ? errorId : null"
            (change)="onToggle($event)"
            (blur)="markTouched()"
          />
          <!-- Custom box -->
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
        <span>{{ label() }}</span>
      </label>
      @if (error(); as message) {
        <p [id]="errorId" class="text-sm text-danger">{{ message }}</p>
      }
    </div>
  `,
})
export class Checkbox extends FormFieldControl<boolean> {
  readonly label = input('');
  readonly error = input<string | null>(null);

  protected readonly fieldId = createFieldId();
  protected readonly errorId = `${this.fieldId}-error`;

  constructor() {
    super(false);
  }

  protected onToggle(event: Event): void {
    this.commitValue((event.target as HTMLInputElement).checked);
  }
}
