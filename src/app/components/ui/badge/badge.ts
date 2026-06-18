import { Component, computed, input, signal } from '@angular/core';
import type { BadgeSize, BadgeVariant } from '../types';

// Tint surface + text-grade color of the same family (see _variables.scss:
// every -tint token is designed to pair with its base color as text).
const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'border-glass-border bg-glass-surface text-muted',
  primary: 'border-[rgba(74,143,231,0.40)] bg-primary-tint text-primary-soft',
  success: 'border-[rgba(58,173,122,0.40)] bg-success-tint text-success',
  warning: 'border-[rgba(251,191,36,0.40)] bg-warning-tint text-warning',
  danger: 'border-[rgba(217,85,85,0.40)] bg-danger-tint text-danger',
  info: 'border-[rgba(74,143,231,0.40)] bg-info-tint text-info',
};
// Glow on hover: a soft colored halo of the same family that "lights up".
const GLOW_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'hover:shadow-[0_0_18px_rgba(160,180,255,0.30)]',
  primary: 'hover:shadow-[0_0_18px_rgba(74,143,231,0.45)]',
  success: 'hover:shadow-[0_0_18px_rgba(58,173,122,0.45)]',
  warning: 'hover:shadow-[0_0_18px_rgba(251,191,36,0.45)]',
  danger: 'hover:shadow-[0_0_18px_rgba(217,85,85,0.45)]',
  info: 'hover:shadow-[0_0_18px_rgba(74,143,231,0.45)]',
};
const SIZE_CLASSES: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
};

/**
 * Status pill: short, color-coded by semantic family. Lights up and grows on
 * hover; a click bounces it from the center (decorative micro-interaction).
 */
@Component({
  selector: 'ui-badge',
  template: `<ng-content />`,
  host: {
    '[class]': 'hostClasses()',
    '(pointerdown)': 'triggerBounce()',
    '(animationend)': 'bouncing.set(false)',
  },
})
export class Badge {
  readonly variant = input<BadgeVariant>('neutral');
  readonly size = input<BadgeSize>('md');

  protected readonly bouncing = signal(false);

  protected readonly hostClasses = computed(() =>
    [
      'inline-flex items-center gap-1 rounded-full border font-medium',
      'transition-[transform,box-shadow] duration-200 hover:scale-105',
      VARIANT_CLASSES[this.variant()],
      GLOW_CLASSES[this.variant()],
      SIZE_CLASSES[this.size()],
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
