import type { AbstractControl } from '@angular/forms';
import type { FieldErrorMessages } from '../types';

/**
 * Single place that decides WHEN and WHAT a field error shows.
 *
 * RN-UI-07: fields stay silent until the first submit attempt — the consumer
 * keeps a `submitted` flag (set on ngSubmit) and passes it here. After that
 * the message updates live while the user fixes the field.
 *
 * Returns the Spanish message for the control's first error, an override
 * from `overrides` when provided, or null while the field must stay quiet.
 */
export function fieldErrorMessage(
  control: AbstractControl,
  submitted: boolean,
  overrides?: FieldErrorMessages,
): string | null {
  if (!submitted || !control.invalid || control.disabled) {
    return null;
  }
  const errors = control.errors;
  if (errors === null) {
    return null;
  }
  const key = Object.keys(errors)[0];
  if (key === undefined) {
    return null;
  }
  const override = overrides?.[key];
  if (override !== undefined) {
    return override;
  }
  switch (key) {
    case 'required':
      return 'Este campo es obligatorio.';
    case 'email':
      return 'Ingresa un correo electrónico válido.';
    case 'minlength':
      return `Mínimo ${(errors['minlength'] as { requiredLength: number }).requiredLength} caracteres.`;
    case 'maxlength':
      return `Máximo ${(errors['maxlength'] as { requiredLength: number }).requiredLength} caracteres.`;
    case 'min':
      return `El valor mínimo es ${(errors['min'] as { min: number }).min}.`;
    case 'max':
      return `El valor máximo es ${(errors['max'] as { max: number }).max}.`;
    case 'pattern':
      return 'El formato no es válido.';
    default:
      return 'Valor inválido.';
  }
}
