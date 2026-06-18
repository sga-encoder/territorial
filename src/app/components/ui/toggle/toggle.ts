import { booleanAttribute, Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import type { IconName } from '../types';

const TRACK_BASE =
  'relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border ' +
  'transition-colors duration-200 focus-visible:outline-none ' +
  'focus-visible:[box-shadow:0_0_0_3px_var(--color-focus-ring)] ' +
  'disabled:cursor-not-allowed disabled:opacity-50';
const KNOB_BASE =
  'pointer-events-none inline-grid h-5 w-5 place-items-center rounded-full bg-foreground ' +
  'text-background shadow-sm transition-[transform,background-color] duration-200 ' +
  'ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none';

/**
 * Switch (on/off) — a pill track with a sliding knob that can carry an icon for
 * each state. Stateless: reflects `checked` and emits `toggled`; the consumer
 * owns the value (e.g. the theme toggle in the navbar wired to ThemeService).
 */
@Component({
  selector: 'ui-toggle',
  imports: [Icon],
  template: `
    <button
      type="button"
      role="switch"
      [attr.aria-checked]="checked()"
      [attr.aria-label]="label()"
      [disabled]="disabled()"
      [class]="trackClasses()"
      (click)="toggled.emit()"
    >
      <span [class]="knobClasses()">
        @if (icon(); as name) {
          <ui-icon [name]="name" size="xs" color="inherit" />
        }
      </span>
    </button>
  `,
})
export class Toggle {
  readonly checked = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Accessible name (the switch has no visible text). */
  readonly label = input('');
  /** Optional icon shown in the knob for each state. */
  readonly iconOn = input<IconName | null>(null);
  readonly iconOff = input<IconName | null>(null);

  readonly toggled = output<void>();

  protected readonly icon = computed(() => (this.checked() ? this.iconOn() : this.iconOff()));

  protected readonly trackClasses = computed(() =>
    this.checked()
      ? `${TRACK_BASE} border-primary-strong bg-primary-strong`
      : `${TRACK_BASE} border-glass-border bg-surface-muted`,
  );

  protected readonly knobClasses = computed(() =>
    this.checked() ? `${KNOB_BASE} translate-x-6` : `${KNOB_BASE} translate-x-1`,
  );
}
