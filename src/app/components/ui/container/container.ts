import { booleanAttribute, Component, computed, input } from '@angular/core';
import type {
  ContainerAlign,
  ContainerCenter,
  ContainerCols,
  ContainerDirection,
  ContainerGap,
  ContainerJustify,
  ContainerLayout,
} from '../types';

// Full literal class names so Tailwind's scanner picks them up — dynamic
// strings like `gap-${n}` would be invisible to it and never generated.
const ALIGN_CLASSES: Record<ContainerAlign, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
};
const JUSTIFY_CLASSES: Record<ContainerJustify, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
  evenly: 'justify-evenly',
};
const GAP_CLASSES: Record<ContainerGap, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  6: 'gap-6',
  8: 'gap-8',
  12: 'gap-12',
};
const COLS_CLASSES: Record<ContainerCols, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

/**
 * Layout atom of the UI Kit: the ONLY way features arrange content (atomic
 * principle — no loose flex/grid utilities outside components/ui).
 *
 * `center` is a preset speaking in PHYSICAL axes (screen horizontal/vertical),
 * while `align`/`justify` are LOGICAL (cross/main axis), so the preset's
 * meaning depends on `direction`. Precedence: the preset seeds defaults and
 * an explicit granular input wins on its own axis (API decision, Capa 1).
 */
@Component({
  selector: 'ui-container',
  template: `<ng-content />`,
  host: { '[class]': 'hostClasses()' },
})
export class Container {
  readonly layout = input<ContainerLayout>('flex');
  readonly direction = input<ContainerDirection>('row');
  readonly center = input<ContainerCenter | null>(null);
  readonly align = input<ContainerAlign | null>(null);
  readonly justify = input<ContainerJustify | null>(null);
  readonly wrap = input(false, { transform: booleanAttribute });
  readonly gap = input<ContainerGap>(0);
  /** Column count — only applies when `layout` is `grid`. */
  readonly cols = input<ContainerCols>(1);

  protected readonly hostClasses = computed(() => {
    const isGrid = this.layout() === 'grid';
    const isColumn = this.direction() === 'column';
    const classes: string[] = [isGrid ? 'grid' : 'flex'];

    if (isGrid) {
      classes.push(COLS_CLASSES[this.cols()]);
    } else {
      classes.push(isColumn ? 'flex-col' : 'flex-row');
      if (this.wrap()) {
        classes.push('flex-wrap');
      }
    }
    classes.push(GAP_CLASSES[this.gap()]);

    const center = this.center();
    const centerHorizontal = center === 'both' || center === 'horizontal';
    const centerVertical = center === 'both' || center === 'vertical';

    // Physical → logical translation. In a row the main axis is horizontal;
    // in a column it is vertical. Grid vertical centering targets the cells.
    const presetAlign: ContainerAlign | null = isGrid
      ? centerVertical
        ? 'center'
        : null
      : (isColumn ? centerHorizontal : centerVertical)
        ? 'center'
        : null;
    const presetJustify: ContainerJustify | null =
      !isGrid && (isColumn ? centerVertical : centerHorizontal) ? 'center' : null;

    // Granular wins on its own axis; absent values fall back to CSS defaults.
    const align = this.align() ?? presetAlign;
    const justify = this.justify() ?? presetJustify;
    if (align !== null) {
      classes.push(ALIGN_CLASSES[align]);
    }
    if (justify !== null) {
      classes.push(JUSTIFY_CLASSES[justify]);
    }
    // Grid horizontal centering acts on cells (justify-items), a different
    // CSS property than the `justify` input (justify-content) — no conflict.
    if (isGrid && centerHorizontal) {
      classes.push('justify-items-center');
    }

    return classes.join(' ');
  });
}
