import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import type { PendingUser } from '../../models/pending-user.model';

const STORAGE_KEY = 'territorial_pending_users';

/**
 * Manages pending Firebase users (logged-in but with no backend role) using
 * localStorage. Data is per-browser; for multi-device persistence, replace
 * the read/write helpers with Firestore equivalents once it is enabled.
 */
@Injectable({ providedIn: 'root' })
export class PendingUserService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly pendingSignal = signal<readonly PendingUser[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly pending = this.pendingSignal.asReadonly();
  readonly isLoading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  // ── localStorage helpers ────────────────────────────────────────────────────

  private readStorage(): PendingUser[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as PendingUser[]) : [];
    } catch {
      return [];
    }
  }

  private writeStorage(users: readonly PendingUser[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /** Adds or updates a pending-user entry. Called by AuthService when role = null. */
  register(
    uid: string,
    email: string,
    displayName: string | null,
    photoUrl: string | null,
  ): void {
    if (!this.isBrowser) return;
    const existing = this.readStorage();
    const alreadyPresent = existing.some((u) => u.uid === uid);
    if (alreadyPresent) return;
    const updated: PendingUser[] = [
      { uid, email, displayName, photoUrl, registeredAt: new Date().toISOString() },
      ...existing,
    ];
    this.writeStorage(updated);
    this.pendingSignal.set(updated);
  }

  loadAll(): void {
    if (!this.isBrowser) return;
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const users = this.readStorage().sort(
        (a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime(),
      );
      this.pendingSignal.set(users);
    } catch (err) {
      this.errorSignal.set(`Error al leer usuarios pendientes: ${String(err)}`);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /** Removes a user after successful backend classification. */
  remove(uid: string): void {
    if (!this.isBrowser) return;
    const updated = this.readStorage().filter((u) => u.uid !== uid);
    this.writeStorage(updated);
    this.pendingSignal.update((users) => users.filter((u) => u.uid !== uid));
  }
}
