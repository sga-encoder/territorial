import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  computed,
  contentChildren,
  Directive,
  inject,
  input,
  linkedSignal,
  output,
  TemplateRef,
} from '@angular/core';
import { Icon } from '../icon/icon';
import type { TabItem } from '../types';

/**
 * Marks the panel content of one tab inside <ui-tabs>; the value is the
 * TabItem id it belongs to:
 *
 *   <ng-template uiTabPanel="general">…</ng-template>
 */
@Directive({ selector: 'ng-template[uiTabPanel]' })
export class TabPanelDef {
  readonly uiTabPanel = input.required<string>();
  readonly templateRef = inject(TemplateRef<unknown>);
}

// Active tab is solid 3D (filled, lifted); idle tabs are glass-on-hover. The
// transparent border on the base reserves the active border space (no shift).
const TAB_BASE =
  'inline-flex cursor-pointer items-center gap-2 rounded-t-xl border border-transparent px-4 py-2 ' +
  'text-sm font-medium transition-[background-color,border-color,color] duration-200 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';
const TAB_ACTIVE =
  'text-primary-soft font-semibold shadow-sm ' +
  'bg-[linear-gradient(175deg,var(--color-3d-hi)_0%,var(--color-glass-surface)_50%,var(--color-3d-dk)_100%)] ' +
  '[border-top:1.5px_solid_var(--color-border-h)] [border-left:1px_solid_var(--color-border-h)] ' +
  '[border-right:1px_solid_var(--color-3d-dk)]';
const TAB_IDLE = 'text-muted enabled:hover:bg-glass-surface enabled:hover:text-foreground';

// Unique prefix per instance so several <ui-tabs> can coexist on one page
// with valid aria-controls/labelledby ids.
let nextTabsInstanceId = 0;

/**
 * Tab group with the WAI-ARIA tabs pattern: roving tabindex, automatic
 * activation, arrow-key navigation. The active panel is the projected
 * template whose uiTabPanel id matches the selected TabItem.
 */
@Component({
  selector: 'ui-tabs',
  imports: [Icon, NgTemplateOutlet],
  template: `
    <div
      role="tablist"
      class="flex flex-wrap gap-1 border-b border-border"
      (keydown.arrowright)="moveSelection(1)"
      (keydown.arrowleft)="moveSelection(-1)"
    >
      @for (tab of tabs(); track tab.id) {
        <button
          type="button"
          role="tab"
          [id]="instanceId + '-tab-' + tab.id"
          [class]="tabClasses(tab)"
          [disabled]="tab.disabled === true"
          [tabindex]="tab.id === activeId() ? 0 : -1"
          [attr.aria-selected]="tab.id === activeId()"
          [attr.aria-controls]="instanceId + '-panel-' + tab.id"
          (click)="select(tab)"
        >
          @if (tab.icon; as iconName) {
            <ui-icon [name]="iconName" size="sm" />
          }
          {{ tab.label }}
        </button>
      }
    </div>

    <div
      role="tabpanel"
      class="pt-4"
      tabindex="0"
      [id]="instanceId + '-panel-' + activeId()"
      [attr.aria-labelledby]="instanceId + '-tab-' + activeId()"
    >
      @if (activePanel(); as panelTemplate) {
        <ng-container *ngTemplateOutlet="panelTemplate" />
      }
    </div>
  `,
  host: { class: 'block' },
})
export class Tabs {
  readonly tabs = input.required<readonly TabItem[]>();

  readonly tabChanged = output<string>();

  protected readonly instanceId = `ui-tabs-${nextTabsInstanceId++}`;

  // Follows the tabs input (first enabled tab) until the user picks one.
  protected readonly activeId = linkedSignal(
    () => this.tabs().find((tab) => tab.disabled !== true)?.id ?? '',
  );

  private readonly panelDefs = contentChildren(TabPanelDef);
  private readonly panelTemplates = computed(
    () => new Map(this.panelDefs().map((panelDef) => [panelDef.uiTabPanel(), panelDef.templateRef])),
  );
  protected readonly activePanel = computed(
    () => this.panelTemplates().get(this.activeId()) ?? null,
  );

  protected tabClasses(tab: TabItem): string {
    return `${TAB_BASE} ${tab.id === this.activeId() ? TAB_ACTIVE : TAB_IDLE}`;
  }

  protected select(tab: TabItem): void {
    if (tab.disabled === true || tab.id === this.activeId()) {
      return;
    }
    this.activeId.set(tab.id);
    this.tabChanged.emit(tab.id);
  }

  /** Arrow keys cycle through enabled tabs (automatic activation). */
  protected moveSelection(offset: number): void {
    const enabledTabs = this.tabs().filter((tab) => tab.disabled !== true);
    if (enabledTabs.length === 0) {
      return;
    }
    const currentIndex = enabledTabs.findIndex((tab) => tab.id === this.activeId());
    const nextIndex = (currentIndex + offset + enabledTabs.length) % enabledTabs.length;
    this.select(enabledTabs[nextIndex]);
    // TODO: a11y — move DOM focus to the newly selected tab button as well.
  }
}
