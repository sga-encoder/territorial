import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icon } from '../icon/icon';
import type { BreadcrumbItem, IconName } from '../types';

/**
 * Location trail. Items with `path` render as router links; the last item is
 * the current page (aria-current). The separator is any kit icon.
 */
@Component({
  selector: 'ui-breadcrumbs',
  imports: [Icon, RouterLink],
  template: `
    <nav aria-label="Miga de pan">
      <ol class="flex flex-wrap items-center gap-1">
        @for (item of items(); track item.label; let last = $last) {
          <li class="flex items-center gap-1">
            @if (!last && item.path !== undefined) {
              <a
                [routerLink]="item.path"
                class="rounded-sm text-sm text-muted transition-colors hover:text-foreground hover:underline"
              >
                {{ item.label }}
              </a>
            } @else {
              <span class="text-sm text-foreground" [attr.aria-current]="last ? 'page' : null">
                {{ item.label }}
              </span>
            }
            @if (!last) {
              <ui-icon [name]="separator()" size="xs" color="muted" />
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class Breadcrumbs {
  readonly items = input.required<readonly BreadcrumbItem[]>();
  readonly separator = input<IconName>('chevron-right');
}
