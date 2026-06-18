import { booleanAttribute, Component, computed, input, output, signal } from '@angular/core';
import { Icon } from '../icon/icon';
import type { ChipVariant } from '../types';

// Tinted fill + same-hue border + same-hue text per variant (no cross-variant
// fallback). No backdrop-blur: chips are repeated content (perf rule) — the tint
// already reads as glass.
const VARIANT_CLASSES: Record<ChipVariant, string> = {
  neutral: 'border-glass-border bg-glass-surface text-muted',
  primary: 'border-[rgba(74,143,231,0.40)] bg-primary-tint text-primary-soft',
  success: 'border-[rgba(58,173,122,0.40)] bg-success-tint text-success',
  warning: 'border-[rgba(251,191,36,0.40)] bg-warning-tint text-warning',
  danger: 'border-[rgba(217,85,85,0.40)] bg-danger-tint text-danger',
  info: 'border-[rgba(74,143,231,0.40)] bg-info-tint text-info',
};
// Glow on hover: a soft colored halo of the same family that "lights up".
const GLOW_CLASSES: Record<ChipVariant, string> = {
  neutral: 'hover:shadow-[0_0_18px_rgba(160,180,255,0.30)]',
  primary: 'hover:shadow-[0_0_18px_rgba(74,143,231,0.45)]',
  success: 'hover:shadow-[0_0_18px_rgba(58,173,122,0.45)]',
  warning: 'hover:shadow-[0_0_18px_rgba(251,191,36,0.45)]',
  danger: 'hover:shadow-[0_0_18px_rgba(217,85,85,0.45)]',
  info: 'hover:shadow-[0_0_18px_rgba(74,143,231,0.45)]',
};

/**
 * Tag for categories/filters (CU: categorías múltiples). Square-ish corners
 * distinguish it from the Badge status pill. Lights up and grows on hover and
 * bounces from the center on click; `removable` adds an accessible remove button
 * that emits `removed` (the consumer owns the collection).
 */
@Component({
  selector: 'ui-chip',
  imports: [Icon],
  template: `
    <ng-content />
    @if (removable()) {
      <button
        type="button"
        class="-me-0.5 cursor-pointer rounded-sm p-0.5 transition-colors hover:bg-backdrop/20"
        [attr.aria-label]="removeLabel()"
        (click)="removed.emit()"
      >
        <ui-icon name="close" size="xs" />
      </button>
    }
  `,
  host: {
    '[class]': 'hostClasses()',
    '(pointerdown)': 'triggerBounce()',
    '(animationend)': 'bouncing.set(false)',
  },
})
export class Chip {
  readonly variant = input<ChipVariant>('neutral');
  readonly removable = input(false, { transform: booleanAttribute });
  /** Accessible name of the remove button; include the chip's own label. */
  readonly removeLabel = input('Quitar');

  readonly removed = output<void>();

  protected readonly bouncing = signal(false);

  protected readonly hostClasses = computed(() =>
    [
      'inline-flex items-center gap-1 rounded-xl border px-2 py-0.5 text-sm font-medium ' +
        'transition-[transform,box-shadow] duration-200 hover:scale-105',
      VARIANT_CLASSES[this.variant()],
      GLOW_CLASSES[this.variant()],
      this.bouncing() ? 'animate-pop-center' : '',
    ]
      .filter((cssClass) => cssClass !== '')
      .join(' '),
  );

  /** Retrigger the bounce on every press (toggle off→on across a frame). */
  protected triggerBounce(): void {
    this.bouncing.set(false);
    requestAnimationFrame(() => this.bouncing.set(true));
  }
}
