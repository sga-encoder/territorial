import { Component, input } from '@angular/core';
import { Button, Container, Icon, Text, Title } from '../ui';
import type { TitleLevel } from '../ui';
import type { PageHeaderAction } from './types';

/**
 * Page header — a title (+ optional muted subtitle) on one side and a
 * configurable row of action buttons on the other. The buttons are declared as
 * DATA through `actions`: each entry carries its own `run` callback (same pattern
 * as DynamicRowAction), so a page adds buttons by extending the array, never by
 * editing this template.
 *
 * Composes the kit only (RN-UI-02) and lives in the `dynamic` layer because it
 * is a data-driven composition, not a style atom (RN-UI-05).
 */
@Component({
  selector: 'ui-page-header',
  imports: [Button, Container, Icon, Text, Title],
  template: `
    <ui-container justify="between" center="vertical" [gap]="4" wrap>
      <ui-container direction="column" [gap]="1">
        <ui-title [level]="level()">{{ title() }}</ui-title>
        @if (subtitle(); as subtitleText) {
          <ui-text color="muted">{{ subtitleText }}</ui-text>
        }
      </ui-container>

      @if (actions().length > 0) {
        <ui-container center="vertical" [gap]="2" wrap>
          @for (action of actions(); track action.id) {
            <ui-button
              [variant]="action.variant ?? 'primary'"
              [disabled]="action.disabled ?? false"
              [loading]="action.loading ?? false"
              (clicked)="action.run()"
            >
              @if (action.icon; as iconName) {
                <ui-icon [name]="iconName" size="sm" />
              }
              {{ action.label }}
            </ui-button>
          }
        </ui-container>
      }
    </ui-container>
  `,
})
export class PageHeader {
  /** Main heading text. */
  readonly title = input.required<string>();
  /** Optional muted line under the title; hidden when null/empty. */
  readonly subtitle = input<string | null>(null);
  /** Heading level (semantics + scale). Default 1 (page title). */
  readonly level = input<TitleLevel>(1);
  /** Dictionary of buttons appended next to the title. Default none. */
  readonly actions = input<readonly PageHeaderAction[]>([]);
}
