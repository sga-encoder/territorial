import { Component, computed, input } from '@angular/core';
import type { SplitAsidePosition, SplitAsideSize } from '../types';

// Literal class strings so Tailwind's scanner emits them (dynamic templates like
// `lg:grid-cols-[...${w}]` would be invisible to it). One column on mobile; from
// `lg` a main track (`minmax(0,1fr)`) plus a fixed-width aside track.
const GRID_COLUMNS: Record<SplitAsidePosition, Record<SplitAsideSize, string>> = {
  end: {
    sm: 'lg:grid-cols-[minmax(0,1fr)_18rem]',
    md: 'lg:grid-cols-[minmax(0,1fr)_22rem]',
    lg: 'lg:grid-cols-[minmax(0,1fr)_26rem]',
  },
  start: {
    sm: 'lg:grid-cols-[18rem_minmax(0,1fr)]',
    md: 'lg:grid-cols-[22rem_minmax(0,1fr)]',
    lg: 'lg:grid-cols-[26rem_minmax(0,1fr)]',
  },
};

/**
 * Responsive two-pane layout: a flexible MAIN region (e.g. a map) beside a
 * fixed-width ASIDE panel (actions/status). One stacked column on mobile, split
 * from `lg`. A layout atom (Capa 1) — it only arranges projected content, never
 * styles it; both slots are filled with kit components by the consumer.
 *
 * ```html
 * <ui-split aside="md">
 *   <div ui-split-main><!-- map --></div>
 *   <div ui-split-aside><!-- panel --></div>
 * </ui-split>
 * ```
 */
@Component({
  selector: 'ui-split',
  template: `
    <div [class]="rootClasses()">
      <div class="min-w-0" [class]="mainOrder()"><ng-content select="[ui-split-main]" /></div>
      <aside class="min-w-0" [class]="asideOrder()"><ng-content select="[ui-split-aside]" /></aside>
    </div>
  `,
  host: { class: 'block' },
})
export class Split {
  /** Aside track width from the `lg` breakpoint up. Default `md` (22rem). */
  readonly aside = input<SplitAsideSize>('md');
  /** Which side the aside sits on from `lg` up. Default `end` (right). */
  readonly position = input<SplitAsidePosition>('end');

  protected readonly rootClasses = computed(
    () => `grid grid-cols-1 gap-4 lg:gap-6 ${GRID_COLUMNS[this.position()][this.aside()]}`,
  );
  protected readonly mainOrder = computed(() =>
    this.position() === 'start' ? 'lg:order-2' : 'lg:order-1',
  );
  protected readonly asideOrder = computed(() =>
    this.position() === 'start' ? 'lg:order-1' : 'lg:order-2',
  );
}
