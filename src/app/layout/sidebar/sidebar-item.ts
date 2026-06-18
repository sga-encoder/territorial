import { NgTemplateOutlet } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Icon } from '../../components/ui';
import type { SidebarEntry } from './sidebar.model';
import { SidebarService } from './sidebar.service';

/**
 * Renders ONE sidebar entry, deciding from the data shape whether it is a single
 * link or a collapsible group of subcategory links — the caller just passes the
 * `SidebarEntry` and this component branches on `kind`. Reads visual/expansion
 * state from SidebarService and emits `navigated` when a link is activated so the
 * mobile drawer can auto-close.
 */
@Component({
  selector: 'app-sidebar-item',
  imports: [RouterLink, RouterLinkActive, Icon, NgTemplateOutlet],
  templateUrl: './sidebar-item.html',
  host: { class: 'block' },
})
export class SidebarItem {
  readonly item = input.required<SidebarEntry>();
  /** Emitted when a link inside is activated (group child or top-level). */
  readonly navigated = output<void>();

  protected readonly sidebar = inject(SidebarService);
}
