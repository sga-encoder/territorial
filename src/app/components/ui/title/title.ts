import { Component, computed, input } from '@angular/core';
import type { TitleColor, TitleLevel } from '../types';

const LEVEL_CLASSES: Record<TitleLevel, string> = {
  1: 'text-4xl font-bold tracking-tight',
  2: 'text-3xl font-bold tracking-tight',
  3: 'text-2xl font-semibold',
  4: 'text-xl font-semibold',
  5: 'text-lg font-semibold',
  6: 'text-base font-semibold',
};
const COLOR_CLASSES: Record<TitleColor, string> = {
  default: 'text-foreground',
  muted: 'text-muted',
  primary: 'text-primary-soft',
};

/**
 * Heading atom. Exposed to assistive tech via `role="heading"` +
 * `aria-level` (WCAG-equivalent to native h1–h6): a dynamic native tag would
 * require duplicating <ng-content> across @switch branches, where projection
 * only feeds the first slot. Visual scale follows `level` and can be checked
 * with AXE in the showcase (Capa 6).
 */
@Component({
  selector: 'ui-title',
  template: `<ng-content />`,
  host: {
    role: 'heading',
    '[attr.aria-level]': 'level()',
    '[class]': 'hostClasses()',
  },
})
export class Title {
  readonly level = input<TitleLevel>(2);
  readonly color = input<TitleColor>('default');

  protected readonly hostClasses = computed(() =>
    ['block font-display', LEVEL_CLASSES[this.level()], COLOR_CLASSES[this.color()]].join(' '),
  );
}
