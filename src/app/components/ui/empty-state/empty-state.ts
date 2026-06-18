import { Component, input } from '@angular/core';
import { Icon } from '../icon/icon';
import type { IconName } from '../types';

/**
 * Friendly "nothing here" message with optional icon and an action slot
 * (project a <ui-button> for the suggested next step). Transparent: it takes
 * the surface of whatever contains it (Card, page…).
 */
@Component({
  selector: 'ui-empty-state',
  imports: [Icon],
  template: `
    <div class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      @if (icon(); as iconName) {
        <ui-icon [name]="iconName" size="lg" color="muted" />
      }
      <span class="text-base font-semibold text-foreground">{{ title() }}</span>
      @if (message() !== '') {
        <p class="max-w-sm text-sm text-muted">{{ message() }}</p>
      }
      <ng-content />
    </div>
  `,
  host: { class: 'block' },
})
export class EmptyState {
  readonly icon = input<IconName | null>(null);
  readonly title = input.required<string>();
  readonly message = input('');
}
