import { computed, inject, Injectable, signal } from '@angular/core';
import { StorageService } from '../../core/storage/storage.service';

const EXPANDED_STORAGE_KEY = 'territorial-sidebar-expanded';
const GROUPS_STORAGE_KEY = 'territorial-sidebar-groups';

/**
 * Persisted UI state of the main sidebar: expansion and open groups.
 * Storage delegated to StorageService (spec.md — no direct localStorage access).
 */
@Injectable({ providedIn: 'root' })
export class SidebarService {
  private readonly storage = inject(StorageService);

  private readonly expandedSignal = signal<boolean>(this.readExpanded());
  private readonly expandedGroupsSignal = signal<ReadonlySet<string>>(this.readGroups());
  private readonly hoveredSignal = signal(false);

  readonly expanded = this.expandedSignal.asReadonly();
  readonly expandedGroups = this.expandedGroupsSignal.asReadonly();
  readonly hovered = this.hoveredSignal.asReadonly();
  readonly visualExpanded = computed(() => this.expanded() || this.hovered());

  setHovered(hovered: boolean): void {
    this.hoveredSignal.set(hovered);
  }

  setExpanded(expanded: boolean): void {
    this.expandedSignal.set(expanded);
    this.storage.setLocal(EXPANDED_STORAGE_KEY, String(expanded));
  }

  toggle(): void {
    this.setExpanded(!this.expanded());
  }

  isGroupExpanded(id: string): boolean {
    return this.expandedGroups().has(id);
  }

  toggleGroup(id: string): void {
    const next = new Set(this.expandedGroups());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.expandedGroupsSignal.set(next);
    this.storage.setLocal(GROUPS_STORAGE_KEY, JSON.stringify([...next]));
  }

  private readExpanded(): boolean {
    return this.storage.getLocal(EXPANDED_STORAGE_KEY) === 'true';
  }

  private readGroups(): ReadonlySet<string> {
    const raw = this.storage.getLocal(GROUPS_STORAGE_KEY);
    if (raw === null) return new Set();
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? new Set(parsed.filter((v): v is string => typeof v === 'string'))
        : new Set();
    } catch {
      return new Set();
    }
  }
}
