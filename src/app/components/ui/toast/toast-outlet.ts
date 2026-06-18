import { Component, inject } from '@angular/core';
import { Icon } from '../icon/icon';
import { ToastService } from './toast.service';
import type { IconColor, IconName, ToastVariant } from '../types';

const VARIANT_ICONS: Record<ToastVariant, IconName> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
};
const VARIANT_COLORS: Record<ToastVariant, IconColor> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

/**
 * Renders the toast stack (glass — toasts float). Mounted ONCE in the Shell;
 * features never use it directly, they talk to ToastService. Bottom-right,
 * newest at the bottom (RN-UI-08).
 */
@Component({
  selector: 'ui-toast-outlet',
  imports: [Icon],
  template: `
    <div
      role="region"
      aria-label="Notificaciones"
      class="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          role="status"
          animate.enter="animate-modal-pop"
          animate.leave="animate-modal-pop-out"
          class="inset-shadow-glass-highlight pointer-events-auto flex items-start gap-3 rounded-xl border border-glass-border bg-glass-surface p-4 shadow-lg backdrop-blur-glass [border-top-color:var(--color-border-h)]"
        >
          <ui-icon [name]="iconFor(toast.variant)" [color]="colorFor(toast.variant)" size="sm" />
          <div class="min-w-0 flex-1">
            @if (toast.title; as title) {
              <p class="text-sm font-semibold text-foreground">{{ title }}</p>
            }
            <p class="text-sm text-foreground">{{ toast.message }}</p>
          </div>
          <button
            type="button"
            class="cursor-pointer rounded-sm p-1 transition-colors hover:bg-surface-muted"
            aria-label="Cerrar notificación"
            (click)="toastService.dismiss(toast.id)"
          >
            <ui-icon name="close" size="xs" color="muted" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastOutlet {
  protected readonly toastService = inject(ToastService);

  protected iconFor(variant: ToastVariant): IconName {
    return VARIANT_ICONS[variant];
  }

  protected colorFor(variant: ToastVariant): IconColor {
    return VARIANT_COLORS[variant];
  }
}
