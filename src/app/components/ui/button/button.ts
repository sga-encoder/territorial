import { Component, computed, DOCUMENT, inject, input, output } from '@angular/core';
import { Spinner } from '../spinner/spinner';
import type { ButtonSize, ButtonType, ButtonVariant } from '../types';

// Each variant owns its colour at EVERY state with explicit rgba values: the
// fill grows tint (rest) → partial (hover) → solid (active) within the SAME
// hue, so a blue button never bleeds into another colour on transition. This is
// why BASE_CLASSES transitions only named properties — never `transition`/all,
// which would cross-fade colours between variants.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'border-[rgba(74,143,231,0.42)] bg-[rgba(74,143,231,0.13)] text-primary-soft shadow-blue ' +
    'enabled:hover:bg-[rgba(74,143,231,0.72)] enabled:hover:border-primary enabled:hover:text-white ' +
    'enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_8px_28px_rgba(74,143,231,0.42)] ' +
    'enabled:active:bg-primary-strong enabled:active:border-primary-strong enabled:active:text-white ' +
    'enabled:active:translate-y-px enabled:active:scale-[0.97]',
  secondary:
    'border-glass-border bg-glass-surface text-muted backdrop-blur-glass inset-shadow-glass-highlight shadow-sm ' +
    'enabled:hover:bg-surface-muted enabled:hover:border-border-h enabled:hover:text-foreground ' +
    'enabled:hover:-translate-y-0.5 enabled:hover:shadow-md ' +
    'enabled:active:bg-surface-muted enabled:active:translate-y-px enabled:active:scale-[0.97]',
  ghost:
    'border-transparent bg-transparent text-muted ' +
    'enabled:hover:bg-glass-surface enabled:hover:border-glass-border enabled:hover:text-foreground ' +
    'enabled:hover:-translate-y-0.5 ' +
    'enabled:active:bg-surface-muted enabled:active:translate-y-px enabled:active:scale-[0.97]',
  danger:
    'border-[rgba(217,85,85,0.42)] bg-[rgba(217,85,85,0.13)] text-danger shadow-red ' +
    'enabled:hover:bg-[rgba(217,85,85,0.72)] enabled:hover:border-danger enabled:hover:text-white ' +
    'enabled:hover:-translate-y-0.5 enabled:hover:shadow-[0_8px_28px_rgba(217,85,85,0.42)] ' +
    'enabled:active:bg-danger-strong enabled:active:border-danger-strong enabled:active:text-white ' +
    'enabled:active:translate-y-px enabled:active:scale-[0.97]',
};
// Radius lives here so sm gets the tighter corner (rounded-md) while md/lg use
// rounded-lg (system scale). Gap is applied to the content wrapper, not here.
const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm rounded-md',
  md: 'h-10 px-4 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-lg',
};
const SIZE_GAP: Record<ButtonSize, string> = {
  sm: 'gap-1.5',
  md: 'gap-2',
  lg: 'gap-2',
};
const BASE_CLASSES =
  'relative inline-flex cursor-pointer select-none items-center justify-center overflow-hidden ' +
  'border font-semibold tracking-wide ' +
  'transition-[background-color,border-color,color,translate,scale,box-shadow] duration-200 ease-out ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none';

// Ripple colour per variant (matches the fill hue). Declared once, read on click.
const RIPPLE_COLORS: Record<ButtonVariant, string> = {
  primary: 'rgba(74,143,231,0.65)',
  secondary: 'rgba(160,180,255,0.18)',
  ghost: 'rgba(160,180,255,0.14)',
  danger: 'rgba(217,85,85,0.65)',
};
// Coloured variants get a glow on the ripple: because `transform: scale` scales
// the box-shadow too, the glow EXPANDS together with the fill as the wave grows.
const RIPPLE_GLOW: Partial<Record<ButtonVariant, string>> = {
  primary: '0 0 26px 2px rgba(74,143,231,0.5)',
  danger: '0 0 26px 2px rgba(217,85,85,0.5)',
};

/**
 * Action atom. `loading` shows an inline spinner and blocks interaction
 * (aria-busy); `clicked` only fires when the button is operable, so consumers
 * never need their own disabled/loading guards. A circular ripple is born at
 * the exact click point (`@keyframes ripple-expand` lives in styles.scss).
 */
@Component({
  selector: 'ui-button',
  imports: [Spinner],
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      [attr.aria-busy]="loading() ? true : null"
      (pointerdown)="onPointerDown($event)"
      (click)="clicked.emit()"
    >
      <span [class]="contentClasses()">
        @if (loading()) {
          <ui-spinner size="sm" color="inherit" />
        }
        <ng-content />
      </span>
    </button>
  `,
  host: { class: 'inline-block' },
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false);
  readonly disabled = input(false);
  /** `submit` participates in the surrounding form (Capa 4). */
  readonly type = input<ButtonType>('button');

  readonly clicked = output<void>();

  private readonly document = inject(DOCUMENT);

  protected readonly buttonClasses = computed(() =>
    [BASE_CLASSES, VARIANT_CLASSES[this.variant()], SIZE_CLASSES[this.size()]].join(' '),
  );
  // Content sits above the ripple (z-[1]); the ripple span is appended last with
  // z-0, so labels/spinner stay readable while the wave expands underneath.
  protected readonly contentClasses = computed(
    () => `relative z-[1] inline-flex items-center justify-center ${SIZE_GAP[this.size()]}`,
  );

  /** Spawns the click-point ripple. Pointer events only fire in the browser, so
   *  no SSR guard is needed (same pattern as Tooltip/ModalOutlet). */
  protected onPointerDown(event: PointerEvent): void {
    const button = event.currentTarget as HTMLButtonElement;
    if (button.disabled) {
      return;
    }
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    // Diameter that covers the button from the click point (+ small margin).
    const size = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y)) * 2.2;

    const glow = RIPPLE_GLOW[this.variant()];
    const ripple = this.document.createElement('span');
    ripple.style.cssText = [
      'position:absolute',
      'border-radius:50%',
      `width:${size}px`,
      `height:${size}px`,
      `left:${x - size / 2}px`,
      `top:${y - size / 2}px`,
      `background:${RIPPLE_COLORS[this.variant()]}`,
      ...(glow !== undefined ? [`box-shadow:${glow}`] : []),
      'transform:scale(0)',
      'animation:ripple-expand .55s cubic-bezier(.2,.6,.3,1) forwards',
      'pointer-events:none',
      'z-index:0',
    ].join(';');
    button.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }
}
