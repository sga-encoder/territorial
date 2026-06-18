import { Component, computed, input } from '@angular/core';
import type { SpinnerColor, SpinnerSize } from '../types';

// Wide liquid bar (aspect ≈ 3): the goo needs horizontal room to read. Heights
// leave room for the inner padding (so lines never touch the edge) + blur.
const SIZE_CLASSES: Record<SpinnerSize, string> = {
  sm: 'h-5 w-14',
  md: 'h-7 w-24',
  lg: 'h-10 w-36',
};
// Bars take their colour from `currentColor`; the goo's contrast pushes it to a
// vivid glow. `inherit` lets the host (e.g. a Button) drive the colour.
const COLOR_CLASSES: Record<SpinnerColor, string> = {
  inherit: '',
  default: 'text-foreground',
  muted: 'text-muted',
  primary: 'text-primary-soft',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
};

/**
 * Indeterminate progress indicator: a "gooey" liquid bar that merges three
 * classic CSS bar-loaders (scroll + dual clip-path reveal + segmented mask)
 * into one continuous, fluid loop. The opaque box is hidden with a blend mode
 * so it floats over any surface. Announced to assistive tech via role=status.
 */
@Component({
  selector: 'ui-spinner',
  template: `<span class="goo" aria-hidden="true"></span>`,
  styleUrl: './spinner.scss',
  host: {
    role: 'status',
    '[attr.aria-label]': 'label()',
    '[class]': 'hostClasses()',
  },
})
export class Spinner {
  readonly size = input<SpinnerSize>('md');
  readonly color = input<SpinnerColor>('primary');
  /** Accessible announcement; override when "Cargando" is not accurate. */
  readonly label = input('Cargando');

  protected readonly hostClasses = computed(() =>
    [SIZE_CLASSES[this.size()], COLOR_CLASSES[this.color()]]
      .filter((cssClass) => cssClass !== '')
      .join(' '),
  );
}
