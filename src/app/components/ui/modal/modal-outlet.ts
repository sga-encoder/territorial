import { isPlatformBrowser, NgComponentOutlet } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  DOCUMENT,
  ElementRef,
  inject,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';
import { ModalService } from './modal.service';
import type { ModalSize } from '../types';

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};
const PANEL_CLASSES =
  'inset-shadow-glass-highlight relative flex max-h-[90dvh] w-full flex-col rounded-2xl ' +
  'border border-glass-border bg-glass-surface shadow-xl backdrop-blur-glass ' +
  '[border-top-color:var(--color-border-h)]';
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Renders the active modal (glass panel over the token backdrop). Mounted
 * ONCE in the Shell; features talk to ModalService. Handles the dialog
 * contract: focus moves into the panel on open and back to the trigger on
 * close, Tab cycles inside (basic trap), Escape and backdrop click close,
 * body scroll locks while open.
 */
@Component({
  selector: 'ui-modal-outlet',
  imports: [Icon, NgComponentOutlet],
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (modal.activeModal(); as active) {
      <div class="fixed inset-0 z-40 flex items-center justify-center p-4">
        <button
          type="button"
          class="absolute inset-0 cursor-default bg-backdrop backdrop-blur-glass"
          aria-label="Cerrar ventana"
          animate.enter="animate-fade-in"
          animate.leave="animate-fade-out"
          (click)="modal.close()"
        ></button>

        <div
          #panel
          role="dialog"
          aria-modal="true"
          tabindex="-1"
          animate.enter="animate-modal-pop"
          animate.leave="animate-modal-pop-out"
          [class]="panelClasses(active.config.size ?? 'md')"
          [attr.aria-labelledby]="active.config.title !== undefined ? titleId : null"
          (keydown)="onPanelKeydown($event)"
        >
          @if (active.config.title; as title) {
            <div class="flex shrink-0 items-center justify-between gap-4 px-5 pb-3 pt-4">
              <h2 [id]="titleId" class="text-lg font-semibold text-foreground">{{ title }}</h2>
              <button
                type="button"
                class="cursor-pointer rounded-md p-1 transition-colors hover:bg-surface-muted"
                aria-label="Cerrar"
                (click)="modal.close()"
              >
                <ui-icon name="close" size="sm" color="muted" />
              </button>
            </div>
          }
          <!-- Content body: solid 3D (modal content is read), nested in the glass panel.
               flex-1 + min-h-0 + overflow-y-auto lets tall content (e.g. a map step)
               scroll inside the 90dvh-capped panel instead of overflowing the screen. -->
          <div
            class="m-4 min-h-0 flex-1 overflow-y-auto rounded-xl bg-[linear-gradient(175deg,var(--color-3d-hi)_0%,var(--color-surface)_45%,var(--color-3d-dk)_100%)] p-5 shadow-sm [border-bottom:1.5px_solid_var(--color-3d-dk)] [border-left:1px_solid_var(--color-border-h)] [border-right:1px_solid_var(--color-3d-dk)] [border-top:1.5px_solid_var(--color-border-h)]"
          >
            <ng-container *ngComponentOutlet="active.component; inputs: active.config.inputs" />
          </div>
        </div>
      </div>
    }
  `,
})
export class ModalOutlet {
  protected readonly modal = inject(ModalService);
  protected readonly titleId = 'ui-modal-title';

  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly panelElement = viewChild<ElementRef<HTMLElement>>('panel');
  private previousFocus: HTMLElement | null = null;

  constructor() {
    // Focus management + scroll lock follow the open/close state. The
    // contains() guard keeps focus inside the panel without re-stealing it
    // from the control the user moved to.
    afterRenderEffect(() => {
      const active = this.modal.activeModal();
      const panel = this.panelElement()?.nativeElement ?? null;
      if (!this.isBrowser) {
        return;
      }
      if (active !== null && panel !== null && !panel.contains(this.document.activeElement)) {
        this.previousFocus = this.document.activeElement as HTMLElement | null;
        this.document.body.classList.add('overflow-hidden');
        panel.focus();
      }
      if (active === null && this.previousFocus !== null) {
        this.document.body.classList.remove('overflow-hidden');
        this.previousFocus.focus();
        this.previousFocus = null;
      }
    });
  }

  protected panelClasses(size: ModalSize): string {
    return `${PANEL_CLASSES} ${SIZE_CLASSES[size]}`;
  }

  protected onEscape(): void {
    if (this.modal.activeModal() !== null) {
      this.modal.close();
    }
  }

  /** Basic focus trap: Tab/Shift+Tab wrap around the panel's focusables. */
  protected onPanelKeydown(event: Event): void {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key !== 'Tab') {
      return;
    }
    const panel = this.panelElement()?.nativeElement;
    if (panel === undefined) {
      return;
    }
    const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    if (focusables.length === 0) {
      keyboardEvent.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const current = this.document.activeElement;
    if (keyboardEvent.shiftKey && (current === first || current === panel)) {
      keyboardEvent.preventDefault();
      last.focus();
    } else if (!keyboardEvent.shiftKey && current === last) {
      keyboardEvent.preventDefault();
      first.focus();
    }
  }
}
