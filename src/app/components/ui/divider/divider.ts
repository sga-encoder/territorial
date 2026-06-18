import { Component, computed, input } from '@angular/core';
import type { DividerOrientation } from '../types';

/**
 * Thin separation line consuming the `border` token. The vertical variant
 * relies on `self-stretch`, so it expects a flex parent (ui-container row).
 */
@Component({
  selector: 'ui-divider',
  template: '',
  host: {
    role: 'separator',
    '[attr.aria-orientation]': 'orientation()',
    '[class]': 'hostClasses()',
  },
})
export class Divider {
  readonly orientation = input<DividerOrientation>('horizontal');

  protected readonly hostClasses = computed(() =>
    this.orientation() === 'horizontal'
      ? 'block h-px w-full bg-border'
      : 'block w-px self-stretch bg-border',
  );
}
