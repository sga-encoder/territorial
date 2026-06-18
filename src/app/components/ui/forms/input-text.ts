import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../icon/icon';
import type { IconName, InputTextType } from '../types';
import { FieldShell } from './field-shell';
import {
  CONTROL_BASE_CLASSES,
  controlStateClasses,
  createFieldId,
  FormFieldControl,
  placeholderClasses,
} from './form-field-control';

/** Single-line text field (text, email, password, number). Value: string. */
@Component({
  selector: 'ui-input',
  imports: [FieldShell, Icon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => InputText), multi: true },
  ],
  template: `
    <ui-field-shell
      [label]="label()"
      [error]="error()"
      [controlId]="fieldId"
      [errorId]="errorId"
      [filled]="value() !== ''"
      [indent]="iconStart() !== null"
    >
      <div class="relative">
        @if (iconStart(); as icon) {
          <ui-icon
            [name]="icon"
            size="sm"
            color="muted"
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
          />
        }
        <input
          [id]="fieldId"
          [type]="effectiveType()"
          [class]="controlClasses()"
          [placeholder]="placeholder()"
          [disabled]="disabled()"
          [value]="value()"
          [attr.aria-invalid]="error() !== null ? true : null"
          [attr.aria-describedby]="error() !== null ? errorId : null"
          (input)="onInput($event)"
          (blur)="markTouched()"
        />
        @if (isPassword()) {
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            [attr.aria-label]="revealed() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            [attr.aria-pressed]="revealed()"
            (click)="toggleReveal()"
          >
            <ui-icon [name]="revealed() ? 'eye-off' : 'eye'" size="sm" color="inherit" />
          </button>
        } @else if (iconEnd(); as icon) {
          <ui-icon
            [name]="icon"
            size="sm"
            color="muted"
            class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          />
        }
      </div>
    </ui-field-shell>
  `,
})
export class InputText extends FormFieldControl<string> {
  readonly label = input('');
  readonly placeholder = input('');
  readonly type = input<InputTextType>('text');
  /** Optional decorative icons inside the field (left / right). */
  readonly iconStart = input<IconName | null>(null);
  readonly iconEnd = input<IconName | null>(null);
  /** Message from fieldErrorMessage (RN-UI-07); null keeps the field quiet. */
  readonly error = input<string | null>(null);

  protected readonly fieldId = createFieldId();
  protected readonly errorId = `${this.fieldId}-error`;

  /** Password reveal toggle: flips the rendered input type while typing. */
  protected readonly revealed = signal(false);
  protected readonly isPassword = computed(() => this.type() === 'password');
  protected readonly effectiveType = computed<InputTextType>(() =>
    this.isPassword() && this.revealed() ? 'text' : this.type(),
  );

  constructor() {
    super('');
  }

  // Extra inline padding so text never sits under an icon/toggle (pl/pr win over px-3).
  protected readonly controlClasses = computed(() => {
    const hasEnd = this.iconEnd() !== null || this.isPassword();
    const padding = `${this.iconStart() !== null ? 'pl-9' : ''} ${hasEnd ? 'pr-9' : ''}`;
    return `h-10 ${CONTROL_BASE_CLASSES} ${controlStateClasses(this.error() !== null, this.value() !== '')} ${padding} ${placeholderClasses(this.label() !== '')}`;
  });

  protected toggleReveal(): void {
    this.revealed.update((revealed) => !revealed);
  }

  protected onInput(event: Event): void {
    this.commitValue((event.target as HTMLInputElement).value);
  }
}
