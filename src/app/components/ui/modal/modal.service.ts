import { Injectable, signal, Type } from '@angular/core';
import type { ModalConfig } from '../types';

/** Internal: what ModalOutlet renders. */
export interface ActiveModal {
  readonly component: Type<unknown>;
  readonly config: ModalConfig;
}

/**
 * Imperative modal API: `open()` renders the given standalone component
 * inside the glass dialog (ModalOutlet, mounted once in the Shell) and
 * resolves when the dialog closes — the opened component injects this
 * service and calls `close(result)`.
 *
 * One modal at a time (RN-UI-05 minimal kit): opening a second one closes
 * the first, resolving it with undefined.
 */
@Injectable({ providedIn: 'root' })
export class ModalService {
  private readonly activeModalSignal = signal<ActiveModal | null>(null);
  readonly activeModal = this.activeModalSignal.asReadonly();

  private resolveResult: ((result: unknown) => void) | null = null;

  open(component: Type<unknown>, config: ModalConfig = {}): Promise<unknown> {
    this.close();
    this.activeModalSignal.set({ component, config });
    return new Promise((resolve) => (this.resolveResult = resolve));
  }

  /** Closes the dialog; `result` reaches the Promise returned by open(). */
  close(result?: unknown): void {
    if (this.activeModalSignal() === null) {
      return;
    }
    this.activeModalSignal.set(null);
    this.resolveResult?.(result);
    this.resolveResult = null;
  }
}
