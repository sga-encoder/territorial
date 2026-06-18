import { signal, WritableSignal } from '@angular/core';
import type { ControlValueAccessor } from '@angular/forms';

let nextFieldIdNumber = 0;

/** Unique DOM id so label/control/error wiring works with many instances per page. */
export function createFieldId(): string {
  return `ui-field-${nextFieldIdNumber++}`;
}

// Glass + Solid 3D redesign. RESTING (empty): the control blends into the page —
// fully transparent, defined ONLY by its border (no fill, no blur, no shadow).
// HOVER: it reacts like a Button — lifts slightly with a colored glow. ACTIVE
// (focus): it lifts to the glass cavity look (translucent bg + blur + sunken
// inset + focus ring). FILLED: once it holds data it becomes a SOLID 3D surface.
// Layout/sizing stays in CONTROL_BASE_CLASSES; surface + state come from
// controlStateClasses().
export const CONTROL_BASE_CLASSES =
  'w-full rounded-lg border px-3 text-sm text-foreground ' +
  'transition-[background-color,border-color,box-shadow,translate] duration-200 ease-out ' +
  'placeholder:italic focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

/**
 * Placeholder visibility for a control with a FLOATING label: hidden at rest
 * (the floating label IS the placeholder) and shown on focus once the label has
 * floated up. Without a label the placeholder is always visible.
 */
export function placeholderClasses(hasLabel: boolean): string {
  return hasLabel
    ? 'placeholder:text-transparent focus:placeholder:text-muted'
    : 'placeholder:text-muted';
}

// Empty = transparent, blends with the background; only the border shows at rest.
// Hover mirrors the Button interaction: a small lift + a soft colored glow.
// On focus it switches to the glass cavity (translucent bg + blur), with the
// lift reset so the sunken/ring look reads correctly.
const EMPTY_SURFACE =
  'bg-transparent ' +
  'hover:-translate-y-px hover:bg-[var(--color-input-bg-h)] ' +
  'hover:shadow-[0_6px_18px_rgba(74,143,231,0.20)] ' +
  'focus:translate-y-0 focus:bg-[var(--color-input-bg-f)] focus:backdrop-blur-glass';

// Filled = solid 3D: gradient body, lifted off the cavity, medium weight text.
const FILLED_SURFACE =
  'bg-[linear-gradient(175deg,var(--color-3d-hi)_0%,var(--color-glass-surface)_45%,var(--color-3d-dk)_100%)] ' +
  'font-medium shadow-sm';

/**
 * Surface + state classes for a control. Exactly one border-color utility and
 * one focus box-shadow are emitted per branch, so nothing collides on
 * Tailwind's source-order cascade. `filled` flips transparent ⇄ solid-3D.
 */
export function controlStateClasses(hasError: boolean, filled = false): string {
  if (filled) {
    const border = hasError
      ? 'border-[var(--color-danger)]'
      : 'border-[var(--color-border-h)] focus:border-[var(--color-input-bdr-bf)]';
    const focusShadow = hasError
      ? 'focus:[box-shadow:0_0_0_3px_rgba(217,85,85,0.32),var(--shadow-sm)]'
      : 'focus:[box-shadow:0_0_0_3px_var(--color-focus-ring),var(--shadow-sm)]';
    return `${FILLED_SURFACE} ${border} ${focusShadow}`;
  }
  const border = hasError
    ? 'border-[var(--color-danger)]'
    : 'border-[var(--color-border)] hover:border-[var(--color-border-h)] focus:border-[var(--color-input-bdr-bf)]';
  const focusShadow = hasError
    ? 'focus:[box-shadow:inset_0_2px_6px_rgba(0,0,0,0.38),0_0_0_3px_rgba(217,85,85,0.32)]'
    : 'focus:[box-shadow:inset_0_2px_6px_rgba(0,0,0,0.38),0_0_0_3px_var(--color-focus-ring)]';
  return `${EMPTY_SURFACE} ${border} ${focusShadow}`;
}

/**
 * Shared ControlValueAccessor plumbing for the kit's form controls (Capa 4):
 * value and disabled live as signals; `emptyValue` replaces null/undefined
 * writes (e.g. form.reset()) so templates never deal with nullish state.
 *
 * Subclasses call `commitValue` for user-originated changes and `markTouched`
 * on blur. Error DISPLAY timing is not decided here — see field-error.ts
 * (RN-UI-07: errors appear only after a submit attempt).
 */
export abstract class FormFieldControl<T> implements ControlValueAccessor {
  protected readonly value: WritableSignal<T>;
  protected readonly disabled = signal(false);

  private onChange: (value: T) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  protected constructor(private readonly emptyValue: T) {
    this.value = signal(this.emptyValue);
  }

  writeValue(value: T | null | undefined): void {
    this.value.set(value ?? this.emptyValue);
  }

  registerOnChange(fn: (value: T) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  /** Push a user-originated change to the bound form control. */
  protected commitValue(value: T): void {
    this.value.set(value);
    this.onChange(value);
  }

  protected markTouched(): void {
    this.onTouched();
  }
}
