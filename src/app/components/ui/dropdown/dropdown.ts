import { isPlatformBrowser } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';
import type { DropdownAlign, DropdownItem } from '../types';

// `fixed` so the panel escapes any clipping ancestor (table overflow, scroll
// containers). Its coordinates are computed from the trigger in positionMenu().
const MENU_BASE_CLASSES =
  'inset-shadow-glass-highlight fixed z-50 min-w-[12rem] overflow-hidden rounded-xl ' +
  'border border-glass-border bg-[var(--color-glass-strong)] p-1 shadow-lg backdrop-blur-glass ' +
  '[border-top-color:var(--color-border-h)]';
const ITEM_BASE_CLASSES =
  'flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors';

/**
 * Floating action menu, reusable anywhere (table row actions, forms, modals,
 * navbar). The trigger is whatever you project into the component; the panel is
 * GLASS and `position: fixed`, so it is never clipped by a table/scroll
 * container and flips above the trigger when there's no room below. Opens on
 * click/arrows, closes on outside click, Escape, scroll or selection; `selected`
 * emits the chosen item value. Items with `separator: true` render a divider.
 */
@Component({
  selector: 'ui-dropdown',
  imports: [Icon],
  host: {
    class: 'relative inline-block',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'close()',
  },
  template: `
    <button
      #trigger
      type="button"
      [class]="triggerClasses()"
      [disabled]="disabled()"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="menuId"
      (click)="toggle()"
      (keydown.arrowdown)="onTriggerArrow($event)"
    >
      <ng-content />
    </button>

    @if (open()) {
      <div
        #menu
        role="menu"
        [id]="menuId"
        animate.enter="animate-modal-pop"
        [class]="menuClasses"
        [style]="menuStyle()"
        (keydown.arrowdown)="moveFocus($event, 1)"
        (keydown.arrowup)="moveFocus($event, -1)"
      >
        <!-- Optional rich header (e.g. user info); styles itself. -->
        <ng-content select="[uiDropdownHeader]" />
        @for (item of items(); track $index) {
          @if (item.separator) {
            <div role="separator" class="my-1 h-px bg-glass-border"></div>
          } @else {
            <button
              type="button"
              role="menuitem"
              [class]="itemClasses(item)"
              [disabled]="item.disabled === true"
              (click)="select(item)"
            >
              @if (item.icon; as icon) {
                <ui-icon [name]="icon" size="sm" color="inherit" class="shrink-0" />
              }
              <span class="flex-1 truncate text-start">{{ item.label }}</span>
            </button>
          }
        }
      </div>
    }
  `,
})
export class Dropdown {
  readonly items = input.required<readonly DropdownItem[]>();
  readonly align = input<DropdownAlign>('start');
  readonly disabled = input(false);

  readonly selected = output<string>();

  protected readonly open = signal(false);
  protected readonly menuId = `ui-dropdown-${nextDropdownId++}`;
  protected readonly menuClasses = MENU_BASE_CLASSES;
  /** Inline fixed-position coordinates, recomputed on open / scroll / resize. */
  protected readonly menuStyle = signal<Record<string, string>>({});

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly triggerButton = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuElement = viewChild<ElementRef<HTMLElement>>('menu');
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** Where the panel lived before being portaled to <body> (to restore on close). */
  private originalParent: Node | null = null;

  constructor() {
    // Once the panel has rendered, PORTAL it to <body> and position it. A `fixed`
    // panel re-anchors to (and is clipped by) any ancestor with backdrop-filter /
    // transform / overflow (navbar glass, glass table) — moving it to <body>
    // escapes all of them so it truly floats over the page.
    afterRenderEffect(() => {
      const menu = this.menuElement()?.nativeElement;
      if (!this.open() || menu === undefined || !this.isBrowser) {
        return;
      }
      if (menu.parentNode !== document.body) {
        this.originalParent = menu.parentNode;
        document.body.appendChild(menu);
      }
      this.positionMenu();
      if (!menu.contains(document.activeElement)) {
        this.menuButtons()[0]?.focus();
      }
    });

    if (this.isBrowser) {
      // Reposition while open so the panel stays glued to the trigger; capture
      // catches scrolls from inner containers (e.g. the main scroll area).
      const reposition = (): void => {
        if (this.open()) {
          this.positionMenu();
        }
      };
      document.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
      inject(DestroyRef).onDestroy(() => {
        document.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
        this.menuElement()?.nativeElement.remove(); // drop a stray portaled node
      });
    }
  }

  protected readonly triggerClasses = computed(
    () =>
      'inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border ' +
      'border-glass-border bg-glass-surface px-3 text-sm text-foreground transition-colors ' +
      'hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50',
  );

  protected itemClasses(item: DropdownItem): string {
    const tone =
      item.danger === true
        ? 'text-danger hover:bg-danger-tint'
        : 'text-foreground hover:bg-primary-tint';
    const disabled = item.disabled === true ? ' cursor-not-allowed opacity-50' : '';
    return `${ITEM_BASE_CLASSES} ${tone}${disabled}`;
  }

  protected toggle(): void {
    this.open() ? this.close() : this.openMenu();
  }

  protected close(): void {
    if (!this.open()) {
      return;
    }
    this.restoreMenu(); // move the panel back so Angular removes it cleanly
    this.open.set(false);
    this.triggerButton().nativeElement.focus();
  }

  protected select(item: DropdownItem): void {
    if (item.disabled === true || item.value === undefined) {
      return;
    }
    this.selected.emit(item.value);
    this.close();
  }

  /** Opening with ArrowDown lands focus on the first item (menu keyboard model). */
  protected onTriggerArrow(event: Event): void {
    event.preventDefault();
    this.openMenu();
  }

  protected moveFocus(event: Event, offset: number): void {
    event.preventDefault();
    const buttons = this.menuButtons();
    if (buttons.length === 0) {
      return;
    }
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    const next = (current + offset + buttons.length) % buttons.length;
    buttons[next].focus();
  }

  protected onDocumentClick(event: Event): void {
    if (!this.open()) {
      return;
    }
    const target = event.target as Node;
    const menu = this.menuElement()?.nativeElement;
    // The panel is portaled to <body>, so check it explicitly (not via the host).
    if (this.elementRef.nativeElement.contains(target) || (menu?.contains(target) ?? false)) {
      return;
    }
    this.close();
  }

  private openMenu(): void {
    // The afterRenderEffect portals + positions the panel once it has rendered.
    this.open.set(true);
  }

  /** Move the panel back under the host so Angular's @if can remove it. */
  private restoreMenu(): void {
    const menu = this.menuElement()?.nativeElement;
    if (menu !== undefined && this.originalParent !== null) {
      this.originalParent.appendChild(menu);
    }
    this.originalParent = null;
  }

  /** Compute fixed coordinates from the trigger; flip up when there's no room below. */
  private positionMenu(): void {
    const menu = this.menuElement()?.nativeElement;
    if (menu === undefined) {
      return;
    }
    const trigger = this.triggerButton().nativeElement;
    const view = trigger.ownerDocument.defaultView;
    if (view === null) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const gap = 8;
    const spaceBelow = view.innerHeight - rect.bottom;
    const openUp = spaceBelow < menu.offsetHeight + gap && rect.top > spaceBelow;
    const top = openUp ? Math.max(gap, rect.top - menu.offsetHeight - gap) : rect.bottom + gap;
    const rawLeft = this.align() === 'end' ? rect.right - menu.offsetWidth : rect.left;
    const left = Math.max(gap, Math.min(rawLeft, view.innerWidth - menu.offsetWidth - gap));
    this.menuStyle.set({ top: `${top}px`, left: `${left}px` });
  }

  private menuButtons(): HTMLButtonElement[] {
    const menu = this.menuElement()?.nativeElement;
    return menu === undefined
      ? []
      : Array.from(menu.querySelectorAll<HTMLButtonElement>('button:not([disabled])'));
  }
}

let nextDropdownId = 0;
