import { computed, DOCUMENT, effect, inject, Injectable, signal } from '@angular/core';
import { StorageService } from '../../../core/storage/storage.service';
import type { ThemeScheme } from '../types';

const THEME_STORAGE_KEY = 'territorial-ui-theme';
const THEME_ATTRIBUTE = 'data-theme';

/**
 * Owns the active color scheme. Components never branch on it — every themable
 * value is a CSS custom property that flips when this service sets
 * `data-theme` on <html>. Storage delegated to StorageService (spec.md).
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storage = inject(StorageService);

  private readonly schemeSignal = signal<ThemeScheme>(this.readInitialScheme());

  readonly scheme = this.schemeSignal.asReadonly();
  readonly isDark = computed(() => this.scheme() === 'dark');

  constructor() {
    effect(() => {
      this.document.documentElement.setAttribute(THEME_ATTRIBUTE, this.schemeSignal());
    });
  }

  setScheme(scheme: ThemeScheme): void {
    this.schemeSignal.set(scheme);
    this.storage.setLocal(THEME_STORAGE_KEY, scheme);
  }

  toggle(): void {
    this.setScheme(this.scheme() === 'dark' ? 'light' : 'dark');
  }

  private readInitialScheme(): ThemeScheme {
    return this.document.documentElement.getAttribute(THEME_ATTRIBUTE) === 'light'
      ? 'light'
      : 'dark';
  }
}
