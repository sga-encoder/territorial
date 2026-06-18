import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CookieOptions {
  /** Days until expiry. Omit for session cookie (cleared when browser closes). */
  readonly expiryDays?: number;
  readonly path?: string;
  readonly sameSite?: 'Strict' | 'Lax' | 'None';
  readonly secure?: boolean;
}

/**
 * Single gateway for all client-side storage (spec.md — no direct localStorage
 * or document.cookie access outside this service).
 *
 * - `local.*`  → localStorage  (UI preferences: theme, sidebar state)
 * - `cookie.*` → document.cookie (auth tokens, anything that must survive a tab close
 *                or be readable by the SSR Express layer)
 *
 * All methods are SSR-safe: they no-op on the server and return null on reads.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // ── localStorage ──────────────────────────────────────────────────────────

  getLocal(key: string): string | null {
    if (!this.isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  setLocal(key: string, value: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Quota exceeded or private browsing — fail silently.
    }
  }

  removeLocal(key: string): void {
    if (!this.isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }

  // ── Cookies ───────────────────────────────────────────────────────────────

  getCookie(name: string): string | null {
    if (!this.isBrowser) return null;
    const match = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${encodeURIComponent(name)}=`));
    if (match === undefined) return null;
    return decodeURIComponent(match.split('=')[1] ?? '');
  }

  setCookie(name: string, value: string, options: CookieOptions = {}): void {
    if (!this.isBrowser) return;
    const { expiryDays, path = '/', sameSite = 'Lax', secure = location.protocol === 'https:' } =
      options;
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=${path}; SameSite=${sameSite}`;
    if (secure) cookie += '; Secure';
    if (expiryDays !== undefined) {
      const expires = new Date();
      expires.setDate(expires.getDate() + expiryDays);
      cookie += `; expires=${expires.toUTCString()}`;
    }
    document.cookie = cookie;
  }

  removeCookie(name: string, path = '/'): void {
    if (!this.isBrowser) return;
    document.cookie = `${encodeURIComponent(name)}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}
