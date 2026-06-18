import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import type { ToastItem, ToastOptions, ToastVariant } from '../types';

// RN-UI-08: bottom-right stack, at most 3 visible (oldest dropped first),
// 5 s auto-dismiss; duration 0 keeps the toast until manually closed.
const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_DURATION_MS = 5000;

let nextToastId = 0;

/**
 * Owns the toast stack; ToastOutlet (mounted once in the Shell) renders it.
 * Each toast schedules its own dismiss timer; dropping or dismissing a toast
 * always clears its timer so ids are never resurrected.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly toastsSignal = signal<readonly ToastItem[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  private readonly dismissTimers = new Map<number, ReturnType<typeof setTimeout>>();

  success(message: string, options?: ToastOptions): number {
    return this.show('success', message, options);
  }

  error(message: string, options?: ToastOptions): number {
    return this.show('error', message, options);
  }

  info(message: string, options?: ToastOptions): number {
    return this.show('info', message, options);
  }

  warning(message: string, options?: ToastOptions): number {
    return this.show('warning', message, options);
  }

  show(variant: ToastVariant, message: string, options?: ToastOptions): number {
    const toast: ToastItem = { id: nextToastId++, variant, message, title: options?.title };

    const current = this.toastsSignal();
    const overflow = Math.max(0, current.length + 1 - MAX_VISIBLE_TOASTS);
    for (const dropped of current.slice(0, overflow)) {
      this.clearTimer(dropped.id);
    }
    this.toastsSignal.set([...current.slice(overflow), toast]);

    const duration = options?.duration ?? DEFAULT_DURATION_MS;
    if (this.isBrowser && duration > 0) {
      this.dismissTimers.set(
        toast.id,
        setTimeout(() => this.dismiss(toast.id), duration),
      );
    }
    return toast.id;
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.toastsSignal.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  clear(): void {
    for (const id of this.dismissTimers.keys()) {
      clearTimeout(this.dismissTimers.get(id));
    }
    this.dismissTimers.clear();
    this.toastsSignal.set([]);
  }

  private clearTimer(id: number): void {
    const timer = this.dismissTimers.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      this.dismissTimers.delete(id);
    }
  }
}
