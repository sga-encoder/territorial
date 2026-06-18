import {
  Component,
  computed,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../icon/icon';
import { FieldShell } from './field-shell';
import {
  CONTROL_BASE_CLASSES,
  controlStateClasses,
  createFieldId,
  FormFieldControl,
} from './form-field-control';

interface DayCell {
  readonly iso: string; // yyyy-MM-dd
  readonly day: number;
  readonly currentMonth: boolean;
  readonly today: boolean;
  readonly selected: boolean;
  readonly disabled: boolean;
}

const WEEKDAYS = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'] as const;
const DAY_BASE =
  'grid h-8 w-8 place-items-center rounded-lg text-sm transition-colors ' +
  'hover:bg-primary-tint focus-visible:outline-none focus-visible:[box-shadow:0_0_0_2px_var(--color-focus-ring)] ' +
  'disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';
const YEAR_BASE =
  'grid h-10 place-items-center rounded-lg text-sm transition-colors ' +
  'hover:bg-primary-tint focus-visible:outline-none focus-visible:[box-shadow:0_0_0_2px_var(--color-focus-ring)] ' +
  'disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent';

interface YearCell {
  readonly year: number;
  readonly selected: boolean;
  readonly today: boolean;
  readonly disabled: boolean;
}

const pad2 = (value: number): string => String(value).padStart(2, '0');
const toIso = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
/** Parse 'yyyy-MM-dd' into a LOCAL Date (avoids the UTC shift of `new Date(iso)`). */
function fromIso(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (match === null) {
    return null;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

/**
 * Date field with a fully CUSTOM glass calendar (the native popup can't be
 * themed). The trigger behaves like the other controls; clicking it opens a
 * glass panel with month navigation and a day grid. Value: ISO 'yyyy-MM-dd'
 * (reset → ''), so the CVA contract is unchanged for consumers.
 */
@Component({
  selector: 'ui-date',
  imports: [FieldShell, Icon],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateField), multi: true },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <ui-field-shell
      [label]="label()"
      [error]="error()"
      [controlId]="fieldId"
      [errorId]="errorId"
      [filled]="value() !== ''"
    >
      <div class="relative">
        <button
          type="button"
          [id]="fieldId"
          [class]="triggerClasses()"
          [disabled]="disabled()"
          aria-haspopup="dialog"
          [attr.aria-expanded]="open()"
          [attr.aria-invalid]="error() !== null ? true : null"
          [attr.aria-describedby]="error() !== null ? errorId : null"
          (click)="toggle()"
          (focus)="focused.set(true)"
          (blur)="onTriggerBlur()"
        >
          <span class="truncate" [class.text-muted]="value() === ''">{{ displayLabel() }}</span>
          <ui-icon name="calendar" size="sm" color="muted" class="shrink-0" />
        </button>

        @if (open()) {
          <div
            #panel
            role="dialog"
            aria-label="Calendario"
            class="inset-shadow-glass-highlight absolute z-30 mt-1 w-72 rounded-xl border border-glass-border bg-[var(--color-glass-strong)] p-3 shadow-lg backdrop-blur-glass [border-top-color:var(--color-border-h)]"
          >
            <div class="mb-2 flex items-center justify-between">
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                aria-label="Anterior"
                (click)="onPrev()"
              >
                <ui-icon name="chevron-left" size="sm" color="inherit" />
              </button>
              <button
                type="button"
                class="rounded-lg px-2 py-1 text-sm font-semibold capitalize text-foreground transition-colors hover:bg-surface-muted"
                [attr.aria-label]="panelView() === 'years' ? 'Volver a los días' : 'Elegir año'"
                (click)="toggleView()"
              >
                {{ panelView() === 'years' ? yearLabel() : monthLabel() }}
              </button>
              <button
                type="button"
                class="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                aria-label="Siguiente"
                (click)="onNext()"
              >
                <ui-icon name="chevron-right" size="sm" color="inherit" />
              </button>
            </div>

            @if (panelView() === 'days') {
              <div class="mb-1 grid grid-cols-7 gap-1">
                @for (weekday of weekdays; track weekday) {
                  <span class="grid h-7 place-items-center text-xs font-medium text-muted">
                    {{ weekday }}
                  </span>
                }
              </div>

              <div #grid class="grid grid-cols-7 gap-1" (keydown)="onGridKeydown($event)">
                @for (cell of daysGrid(); track cell.iso) {
                  <button
                    type="button"
                    [class]="dayClasses(cell)"
                    [disabled]="cell.disabled"
                    [attr.aria-pressed]="cell.selected"
                    [attr.aria-current]="cell.today ? 'date' : null"
                    [attr.aria-label]="cell.iso"
                    (click)="selectDay(cell)"
                  >
                    {{ cell.day }}
                  </button>
                }
              </div>
            } @else {
              <div class="grid grid-cols-3 gap-1">
                @for (item of years(); track item.year) {
                  <button
                    type="button"
                    [class]="yearClasses(item)"
                    [disabled]="item.disabled"
                    [attr.aria-pressed]="item.selected"
                    (click)="selectYear(item.year)"
                  >
                    {{ item.year }}
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>
    </ui-field-shell>
  `,
})
export class DateField extends FormFieldControl<string> {
  readonly label = input('');
  /** ISO date limits ('yyyy-MM-dd'); null leaves the edge open. */
  readonly min = input<string | null>(null);
  readonly max = input<string | null>(null);
  readonly error = input<string | null>(null);

  protected readonly fieldId = createFieldId();
  protected readonly errorId = `${this.fieldId}-error`;
  protected readonly weekdays = WEEKDAYS;
  protected readonly open = signal(false);
  protected readonly focused = signal(false);
  /** Which sub-view the panel shows: the day grid or the year picker. */
  protected readonly panelView = signal<'days' | 'years'>('days');

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly gridElement = viewChild<ElementRef<HTMLElement>>('grid');
  private readonly todayIso = toIso(new Date());
  private readonly todayYear = new Date().getFullYear();
  /** Month shown in the panel (year + 0-based month). */
  private readonly viewDate = signal(this.initialView());
  /** First year of the 12-year block shown in the year picker. */
  private readonly yearRangeStart = signal(this.initialView().year - 5);

  constructor() {
    super('');
  }

  protected readonly triggerClasses = computed(
    () =>
      `inline-flex h-10 items-center justify-between gap-2 text-start ${CONTROL_BASE_CLASSES} ` +
      controlStateClasses(this.error() !== null, this.value() !== ''),
  );

  protected readonly displayLabel = computed(() => {
    const date = fromIso(this.value());
    if (date === null) {
      // The floating label IS the placeholder while inactive; show the prompt
      // only once FOCUSED (matches the label floating up → no overlap), or
      // always when there's no label.
      return this.label() === '' || this.focused() ? 'Seleccionar fecha' : '';
    }
    return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(
      date,
    );
  });

  protected readonly monthLabel = computed(() => {
    const view = this.viewDate();
    return new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(
      new Date(view.year, view.month, 1),
    );
  });

  protected readonly yearLabel = computed(() => {
    const start = this.yearRangeStart();
    return `${start} – ${start + 11}`;
  });

  protected readonly years = computed<readonly YearCell[]>(() => {
    const start = this.yearRangeStart();
    const selectedYear = fromIso(this.value())?.getFullYear() ?? null;
    const minYear = this.min() !== null ? Number(this.min()!.slice(0, 4)) : null;
    const maxYear = this.max() !== null ? Number(this.max()!.slice(0, 4)) : null;
    const cells: YearCell[] = [];
    for (let index = 0; index < 12; index++) {
      const year = start + index;
      cells.push({
        year,
        selected: year === selectedYear,
        today: year === this.todayYear,
        disabled: (minYear !== null && year < minYear) || (maxYear !== null && year > maxYear),
      });
    }
    return cells;
  });

  protected readonly daysGrid = computed<readonly DayCell[]>(() => {
    const { year, month } = this.viewDate();
    const selected = this.value();
    const min = this.min();
    const max = this.max();
    const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Monday
    const cells: DayCell[] = [];
    for (let index = 0; index < 42; index++) {
      const date = new Date(year, month, 1 - startWeekday + index);
      const iso = toIso(date);
      cells.push({
        iso,
        day: date.getDate(),
        currentMonth: date.getMonth() === month,
        today: iso === this.todayIso,
        selected: iso === selected,
        disabled: (min !== null && iso < min) || (max !== null && iso > max),
      });
    }
    return cells;
  });

  protected dayClasses(cell: DayCell): string {
    if (cell.selected) {
      return `${DAY_BASE} bg-primary-strong font-semibold text-on-primary hover:bg-primary-strong`;
    }
    const tone = cell.currentMonth ? 'text-foreground' : 'text-muted/60';
    const today = cell.today ? ' [box-shadow:inset_0_0_0_1px_var(--color-border-h)]' : '';
    return `${DAY_BASE} ${tone}${today}`;
  }

  protected yearClasses(cell: YearCell): string {
    if (cell.selected) {
      return `${YEAR_BASE} bg-primary-strong font-semibold text-on-primary hover:bg-primary-strong`;
    }
    const today = cell.today ? ' [box-shadow:inset_0_0_0_1px_var(--color-border-h)]' : '';
    return `${YEAR_BASE} text-foreground${today}`;
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    this.panelView.set('days');
    this.viewDate.set(this.initialView());
    this.open.set(true);
    queueMicrotask(() => this.focusActiveDay());
  }

  protected close(): void {
    if (this.open()) {
      this.open.set(false);
    }
  }

  /** Header label toggles between the day grid and the year picker. */
  protected toggleView(): void {
    if (this.panelView() === 'days') {
      this.yearRangeStart.set(this.viewDate().year - 5);
      this.panelView.set('years');
    } else {
      this.panelView.set('days');
    }
  }

  // Header chevrons act on the month (day view) or the 12-year block (year view).
  protected onPrev(): void {
    this.panelView() === 'years' ? this.shiftYears(-1) : this.shiftMonth(-1);
  }

  protected onNext(): void {
    this.panelView() === 'years' ? this.shiftYears(1) : this.shiftMonth(1);
  }

  protected shiftMonth(delta: number): void {
    this.viewDate.update(({ year, month }) => {
      const next = new Date(year, month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  protected shiftYears(delta: number): void {
    this.yearRangeStart.update((start) => start + delta * 12);
  }

  protected selectYear(year: number): void {
    this.viewDate.update((view) => ({ ...view, year }));
    this.panelView.set('days');
    queueMicrotask(() => this.focusActiveDay());
  }

  protected selectDay(cell: DayCell): void {
    if (cell.disabled) {
      return;
    }
    this.commitValue(cell.iso);
    this.markTouched();
    this.close();
  }

  /** Arrow-key navigation across the day grid (±1 day / ±1 week, clamped). */
  protected onGridKeydown(event: KeyboardEvent): void {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    const offset = offsets[event.key];
    if (offset === undefined) {
      return;
    }
    event.preventDefault();
    const buttons = this.dayButtons();
    const current = buttons.indexOf(this.elementRef.nativeElement.ownerDocument.activeElement as HTMLButtonElement);
    const next = Math.min(buttons.length - 1, Math.max(0, current + offset));
    buttons[next]?.focus();
  }

  protected onTriggerBlur(): void {
    this.focused.set(false);
    this.markTouched();
  }

  protected onDocumentClick(event: Event): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  /** Panel opens on the selected month, or the current month when empty. */
  private initialView(): { year: number; month: number } {
    const date = fromIso(this.value()) ?? new Date();
    return { year: date.getFullYear(), month: date.getMonth() };
  }

  private dayButtons(): HTMLButtonElement[] {
    const grid = this.gridElement()?.nativeElement;
    return grid === undefined
      ? []
      : Array.from(grid.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
  }

  private focusActiveDay(): void {
    const buttons = this.dayButtons();
    const active =
      buttons.find((button) => button.getAttribute('aria-pressed') === 'true') ??
      buttons.find((button) => button.getAttribute('aria-current') === 'date') ??
      buttons[0];
    active?.focus();
  }
}
