import { Component, computed, input } from '@angular/core';
import type { TextColor, TextVariant, TextWeight } from '../types';

const VARIANT_CLASSES: Record<TextVariant, string> = {
  body: 'text-base',
  caption: 'text-xs',
  label: 'text-sm tracking-wide',
};
// Each variant carries sensible defaults; explicit `color`/`weight` override.
const VARIANT_DEFAULT_COLOR: Record<TextVariant, TextColor> = {
  body: 'default',
  caption: 'muted',
  label: 'default',
};
const VARIANT_DEFAULT_WEIGHT: Record<TextVariant, TextWeight> = {
  body: 'normal',
  caption: 'normal',
  label: 'medium',
};
// `primary` maps to primary-soft: the AA-readable primary for text on the
// current background (the raw brand primary is reserved for accents).
const COLOR_CLASSES: Record<TextColor, string> = {
  default: 'text-foreground',
  muted: 'text-muted',
  primary: 'text-primary-soft',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};
const WEIGHT_CLASSES: Record<TextWeight, string> = {
  normal: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

/** Typography atom for running text: body copy, captions and form-style labels. */
@Component({
  selector: 'ui-text',
  template: `<ng-content />`,
  host: { '[class]': 'hostClasses()' },
})
export class Text {
  readonly variant = input<TextVariant>('body');
  /** `null` inherits the variant's default color. */
  readonly color = input<TextColor | null>(null);
  /** `null` inherits the variant's default weight. */
  readonly weight = input<TextWeight | null>(null);

  protected readonly hostClasses = computed(() => {
    const variant = this.variant();
    const color = this.color() ?? VARIANT_DEFAULT_COLOR[variant];
    const weight = this.weight() ?? VARIANT_DEFAULT_WEIGHT[variant];
    return ['block', VARIANT_CLASSES[variant], COLOR_CLASSES[color], WEIGHT_CLASSES[weight]].join(
      ' ',
    );
  });
}
