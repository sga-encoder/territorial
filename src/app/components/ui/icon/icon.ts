import { Component, computed, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import {
  lucideAlertCircle,
  lucideAlertTriangle,
  lucideBarChart,
  lucideBarChart2,
  lucideCalendar,
  lucideCheck,
  lucideCheckCircle,
  lucideChevronDown,
  lucideChevronLeft,
  lucideChevronRight,
  lucideChevronUp,
  lucideEllipsisVertical,
  lucideEye,
  lucideEyeOff,
  lucideInfo,
  lucideKey,
  lucideLocateFixed,
  lucideMapPin,
  lucideMenu,
  lucideMessageSquare,
  lucideMinus,
  lucideMoon,
  lucideMove,
  lucidePanelRightClose,
  lucidePanelRightOpen,
  lucidePencil,
  lucidePlus,
  lucideSave,
  lucideSearch,
  lucideSun,
  lucideTrash2,
  lucideUndo2,
  lucideUser,
  lucideWaypoints,
  lucideX,
} from '@ng-icons/lucide';
import type { IconColor, IconName, IconSize } from '../types';

// Kit name → lucide svg (RN-UI-06). Only the icons imported here end up in
// the bundle; adding one = import it and extend IconName in types.ts.
const ICON_SVGS: Record<IconName, string> = {
  calendar: lucideCalendar,
  check: lucideCheck,
  'chevron-down': lucideChevronDown,
  'chevron-left': lucideChevronLeft,
  'chevron-right': lucideChevronRight,
  'chevron-up': lucideChevronUp,
  close: lucideX,
  edit: lucidePencil,
  error: lucideAlertCircle,
  eye: lucideEye,
  'eye-off': lucideEyeOff,
  info: lucideInfo,
  locate: lucideLocateFixed,
  'map-pin': lucideMapPin,
  menu: lucideMenu,
  minus: lucideMinus,
  more: lucideEllipsisVertical,
  moon: lucideMoon,
  move: lucideMove,
  plus: lucidePlus,
  save: lucideSave,
  search: lucideSearch,
  success: lucideCheckCircle,
  sun: lucideSun,
  trash: lucideTrash2,
  undo: lucideUndo2,
  user: lucideUser,
  warning: lucideAlertTriangle,
  waypoints: lucideWaypoints,
  'alert-circle': lucideAlertCircle,
  'bar-chart': lucideBarChart,
  'bar-chart-2': lucideBarChart2,
  key: lucideKey,
  'message-square': lucideMessageSquare,
  'panel-right-close': lucidePanelRightClose,
  'panel-right-open': lucidePanelRightOpen,
};

/** Every icon the kit ships, for galleries/documentation (showcase). */
export const ICON_NAMES = Object.keys(ICON_SVGS) as readonly IconName[];

const SIZE_VALUES: Record<IconSize, string> = { xs: '12', sm: '16', md: '20', lg: '24' };
// `inherit` leaves currentColor untouched so the icon follows its context
// (e.g. the text color of the Button that contains it).
const COLOR_CLASSES: Record<IconColor, string> = {
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
 * Icon atom wrapping @ng-icons (RN-UI-06): the kit exposes a typed, curated
 * IconName instead of the library's free strings. Icons are decorative
 * (aria-hidden); the surrounding component carries the accessible label.
 */
@Component({
  selector: 'ui-icon',
  imports: [NgIcon],
  template: `<ng-icon [svg]="svg()" [size]="sizeValue()" aria-hidden="true" />`,
  host: { '[class]': 'hostClasses()' },
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input<IconSize>('md');
  readonly color = input<IconColor>('inherit');

  protected readonly svg = computed(() => ICON_SVGS[this.name()]);
  protected readonly sizeValue = computed(() => SIZE_VALUES[this.size()]);
  protected readonly hostClasses = computed(() => {
    const colorClass = COLOR_CLASSES[this.color()];
    return colorClass === '' ? 'inline-flex' : `inline-flex ${colorClass}`;
  });
}
