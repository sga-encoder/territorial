import { Component, computed, input, output } from '@angular/core';
import { Icon } from '../icon/icon';
import type { PaginationItem } from '../types';

const PAGE_BUTTON_BASE =
  'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md px-1 text-sm ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const PAGE_BUTTON_IDLE = 'text-foreground enabled:hover:bg-glass-surface enabled:hover:text-foreground';
// Solid primary-strong (not a light-topped gradient) keeps white at AA (≈5:1);
// inset highlight + blue glow carry the 3D/elevated read.
const PAGE_BUTTON_ACTIVE =
  'bg-primary-strong font-semibold text-on-primary inset-shadow-highlight shadow-blue';

/**
 * Controlled paginator: `currentPage` comes in as an input and `pageChanged`
 * asks the consumer to update it (single source of truth stays outside).
 * Long ranges collapse around the current page with ellipsis.
 */
@Component({
  selector: 'ui-pagination',
  imports: [Icon],
  template: `
    <nav class="flex flex-wrap items-center gap-1" aria-label="Paginación">
      <button
        type="button"
        [class]="navButtonClasses"
        [disabled]="currentPage() === 1"
        aria-label="Página anterior"
        (click)="goTo(currentPage() - 1)"
      >
        <ui-icon name="chevron-left" size="sm" />
      </button>

      @for (item of items(); track $index) {
        @if (item === 'ellipsis') {
          <span class="px-1 text-muted" aria-hidden="true">…</span>
        } @else {
          <button
            type="button"
            [class]="pageButtonClasses(item)"
            [attr.aria-current]="item === currentPage() ? 'page' : null"
            [attr.aria-label]="'Página ' + item"
            (click)="goTo(item)"
          >
            {{ item }}
          </button>
        }
      }

      <button
        type="button"
        [class]="navButtonClasses"
        [disabled]="currentPage() === totalPages()"
        aria-label="Página siguiente"
        (click)="goTo(currentPage() + 1)"
      >
        <ui-icon name="chevron-right" size="sm" />
      </button>
    </nav>
  `,
})
export class Pagination {
  readonly total = input.required<number>();
  readonly pageSize = input(10);
  readonly currentPage = input(1);

  readonly pageChanged = output<number>();

  protected readonly navButtonClasses = `${PAGE_BUTTON_BASE} ${PAGE_BUTTON_IDLE}`;

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  /** Window around the current page: 1 … (c-1, c, c+1) … last. */
  protected readonly items = computed<readonly PaginationItem[]>(() => {
    const totalPages = this.totalPages();
    const current = this.currentPage();
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }
    const windowStart = Math.max(2, current - 1);
    const windowEnd = Math.min(totalPages - 1, current + 1);
    const items: PaginationItem[] = [1];
    if (windowStart > 2) {
      items.push('ellipsis');
    }
    for (let page = windowStart; page <= windowEnd; page++) {
      items.push(page);
    }
    if (windowEnd < totalPages - 1) {
      items.push('ellipsis');
    }
    items.push(totalPages);
    return items;
  });

  protected pageButtonClasses(page: number): string {
    const stateClasses = page === this.currentPage() ? PAGE_BUTTON_ACTIVE : PAGE_BUTTON_IDLE;
    return `${PAGE_BUTTON_BASE} ${stateClasses}`;
  }

  protected goTo(page: number): void {
    const clamped = Math.min(Math.max(page, 1), this.totalPages());
    if (clamped !== this.currentPage()) {
      this.pageChanged.emit(clamped);
    }
  }
}
