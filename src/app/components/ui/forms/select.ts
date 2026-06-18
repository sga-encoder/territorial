import { isPlatformBrowser } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../icon/icon';
import type { FieldOption, IconName } from '../types';
import { FieldShell } from './field-shell';
import {
  CONTROL_BASE_CLASSES,
  controlStateClasses,
  createFieldId,
  FormFieldControl,
} from './form-field-control';

const OPTION_BASE_CLASSES =
  'flex cursor-pointer items-center gap-2 rounded-sm px-3 py-2 text-sm text-foreground';
// `fixed` + portaled to <body> so the panel escapes clipping ancestors (cards,
// filters, scroll/overflow containers) — same approach as ui-dropdown.
const PANEL_CLASSES =
  'inset-shadow-glass-highlight fixed z-50 max-h-60 overflow-auto rounded-lg border ' +
  'border-glass-border bg-[var(--color-glass-strong)] p-1 shadow-lg backdrop-blur-glass ' +
  '[border-top-color:var(--color-border-h)]';

/**
 * Custom select (combobox + listbox pattern). The trigger behaves like every
 * input; the dropdown panel is glass and **portaled to <body>** (`position:
 * fixed`), so it is never clipped by a card/filter/scroll container. Value:
 * string | null.
 *
 * Options are picked with mousedown (it fires before the trigger's blur, so
 * the panel never closes early) and the keyboard: arrows move the active
 * option, Enter selects it, Escape closes.
 *
 * `searchable` — shows a text input at the top of the panel for filtering.
 * `sort` — sorts options alphabetically using localeCompare 'es'.
 */
@Component({
  selector: 'ui-select',
  imports: [FieldShell, Icon],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
  host: { '(document:click)': 'onDocumentClick($event)' },
  template: `
    <ui-field-shell
      [label]="label()"
      [error]="error()"
      [controlId]="fieldId"
      [errorId]="errorId"
      [filled]="selectedOption() !== null"
      [indent]="iconStart() !== null"
    >
      <div class="relative">
        <button
          #trigger
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          [id]="fieldId"
          [class]="triggerClasses()"
          [disabled]="disabled()"
          [attr.aria-expanded]="open()"
          [attr.aria-controls]="listboxId"
          [attr.aria-invalid]="error() !== null ? true : null"
          [attr.aria-describedby]="error() !== null ? errorId : null"
          (click)="toggle()"
          (keydown.arrowdown)="onArrowKey($event, 1)"
          (keydown.arrowup)="onArrowKey($event, -1)"
          (keydown.enter)="onEnterKey($event)"
          (keydown.escape)="close()"
          (focus)="focused.set(true)"
          (blur)="onTriggerBlur()"
        >
          <span class="flex min-w-0 items-center gap-2">
            @if (iconStart(); as icon) {
              <ui-icon [name]="icon" size="sm" color="muted" class="shrink-0" />
            }
            <span class="truncate" [class.text-muted]="selectedOption() === null">
              {{ displayLabel() }}
            </span>
          </span>
          <ui-icon name="chevron-down" size="sm" color="muted" class="shrink-0" />
        </button>

        @if (open()) {
          <div #panelContainer [class]="PANEL_CLASSES" [style]="panelStyle()">
            @if (searchable()) {
              <input
                #searchInput
                type="text"
                placeholder="Buscar…"
                class="w-full rounded-md border border-border bg-transparent px-2 py-1 mb-2 text-sm text-foreground placeholder:text-muted focus:outline-none focus:[box-shadow:0_0_0_2px_var(--color-focus-ring)]"
                (keydown.arrowdown)="onArrowKey($event, 1)"
                (keydown.arrowup)="onArrowKey($event, -1)"
                (keydown.enter)="onEnterKey($event)"
                (keydown.escape)="close()"
                (input)="query.set(asInputElement($event).value)"
              />
            }
            <ul [id]="listboxId" role="listbox" class="flex flex-col gap-0.5">
              @for (option of filteredOptions(); track option.value; let index = $index) {
                <li
                  role="option"
                  [class]="optionClasses(option, index)"
                  [attr.aria-selected]="option.value === value()"
                  [attr.aria-disabled]="option.disabled === true ? true : null"
                  (mousedown)="selectOption(option, $event)"
                  (mouseenter)="activeIndex.set(index)"
                >
                  <span class="flex-1 truncate">{{ option.label }}</span>
                  @if (option.value === value()) {
                    <ui-icon name="check" size="sm" color="primary" />
                  }
                </li>
              }
            </ul>
          </div>
        }
      </div>
    </ui-field-shell>
  `,
})
export class Select extends FormFieldControl<string | null> {
  readonly label = input('');
  readonly placeholder = input('Seleccionar…');
  readonly options = input.required<readonly FieldOption[]>();
  /** Optional decorative icon on the left of the trigger. */
  readonly iconStart = input<IconName | null>(null);
  readonly error = input<string | null>(null);
  /** When true, shows a search input at the top of the panel. */
  readonly searchable = input(false);
  /** When true, sorts options alphabetically using localeCompare 'es'. */
  readonly sort = input(false);

  protected readonly fieldId = createFieldId();
  protected readonly errorId = `${this.fieldId}-error`;
  protected readonly listboxId = `${this.fieldId}-listbox`;
  protected readonly PANEL_CLASSES = PANEL_CLASSES;

  protected readonly open = signal(false);
  protected readonly focused = signal(false);
  protected readonly activeIndex = signal(0);
  protected readonly panelStyle = signal<Record<string, string>>({});
  protected readonly query = signal('');

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly triggerButton = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelContainer = viewChild<ElementRef<HTMLElement>>('panelContainer');
  private readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private originalParent: Node | null = null;

  constructor() {
    super(null);

    // Portal the panel to <body> and position it (fixed) once it has rendered.
    afterRenderEffect(() => {
      const panel = this.panelContainer()?.nativeElement;
      if (!this.open() || panel === undefined || !this.isBrowser) {
        return;
      }
      if (panel.parentNode !== document.body) {
        this.originalParent = panel.parentNode;
        document.body.appendChild(panel);
      }
      this.positionPanel();

      // Focus the search input after portaling when searchable.
      if (this.searchable()) {
        this.searchInputRef()?.nativeElement.focus();
      }
    });

    if (this.isBrowser) {
      const reposition = (): void => {
        if (this.open()) {
          this.positionPanel();
        }
      };
      document.addEventListener('scroll', reposition, true);
      window.addEventListener('resize', reposition);
      inject(DestroyRef).onDestroy(() => {
        document.removeEventListener('scroll', reposition, true);
        window.removeEventListener('resize', reposition);
        this.panelContainer()?.nativeElement.remove();
      });
    }

    // Reset activeIndex to 0 whenever the query changes.
    effect(() => {
      this.query();
      this.activeIndex.set(0);
    });
  }

  /** Options after optional sort and search filter. */
  protected readonly filteredOptions = computed(() => {
    let opts = [...this.options()];

    if (this.sort()) {
      opts = opts.sort((a, b) => a.label.localeCompare(b.label, 'es'));
    }

    const q = this.query().trim().toLowerCase();
    if (this.searchable() && q !== '') {
      opts = opts.filter((o) => o.label.toLowerCase().includes(q));
    }

    return opts;
  });

  protected readonly selectedOption = computed(
    () => this.options().find((option) => option.value === this.value()) ?? null,
  );
  protected readonly displayLabel = computed(() => {
    const selected = this.selectedOption();
    if (selected !== null) {
      return selected.label;
    }
    // Empty: the floating label IS the placeholder while inactive. Show the real
    // placeholder only once FOCUSED (same trigger as the label floating up, so
    // they never overlap), or always when there's no label.
    return this.label() === '' || this.focused() ? this.placeholder() : '';
  });
  protected readonly triggerClasses = computed(
    () =>
      `inline-flex h-10 items-center justify-between gap-2 text-start ${CONTROL_BASE_CLASSES} ` +
      controlStateClasses(this.error() !== null, this.selectedOption() !== null),
  );

  protected optionClasses(option: FieldOption, index: number): string {
    const activeClass = index === this.activeIndex() ? ' bg-primary-tint' : '';
    const disabledClass = option.disabled === true ? ' cursor-not-allowed opacity-50' : '';
    return `${OPTION_BASE_CLASSES}${activeClass}${disabledClass}`;
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
      return;
    }
    const selectedIndex = this.filteredOptions().findIndex((option) => option.value === this.value());
    this.activeIndex.set(Math.max(0, selectedIndex));
    this.open.set(true);
  }

  protected close(): void {
    if (!this.open()) {
      return;
    }
    this.restorePanel(); // move the panel back so Angular removes it cleanly
    this.open.set(false);
    this.query.set('');
  }

  protected selectOption(option: FieldOption, event: Event): void {
    // mousedown would steal focus from the trigger and close the panel first.
    event.preventDefault();
    if (option.disabled === true) {
      return;
    }
    this.commitValue(option.value);
    this.markTouched();
    this.close();
  }

  protected onArrowKey(event: Event, offset: number): void {
    event.preventDefault();
    if (!this.open()) {
      this.toggle();
      return;
    }
    const options = this.filteredOptions();
    let nextIndex = this.activeIndex();
    // Skip disabled options, giving up after a full cycle.
    for (let step = 0; step < options.length; step++) {
      nextIndex = (nextIndex + offset + options.length) % options.length;
      if (options[nextIndex].disabled !== true) {
        break;
      }
    }
    // Clamp to filtered options length.
    this.activeIndex.set(Math.min(nextIndex, Math.max(0, options.length - 1)));
  }

  protected onEnterKey(event: Event): void {
    if (!this.open()) {
      return;
    }
    event.preventDefault();
    const activeOption = this.filteredOptions()[this.activeIndex()];
    if (activeOption !== undefined) {
      this.selectOption(activeOption, event);
    }
  }

  protected onTriggerBlur(): void {
    this.focused.set(false);
    this.markTouched();
  }

  protected onDocumentClick(event: Event): void {
    if (!this.open()) {
      return;
    }
    const target = event.target as Node;
    const panel = this.panelContainer()?.nativeElement;
    // The panel is portaled to <body>, so check it explicitly (not via the host).
    if (this.elementRef.nativeElement.contains(target) || (panel?.contains(target) ?? false)) {
      return;
    }
    this.close();
  }

  protected asInputElement(e: Event): HTMLInputElement {
    return e.target as HTMLInputElement;
  }

  /** Compute fixed coordinates from the trigger; flip up when there's no room below. */
  private positionPanel(): void {
    const panel = this.panelContainer()?.nativeElement;
    if (panel === undefined) {
      return;
    }
    const trigger = this.triggerButton().nativeElement;
    const view = trigger.ownerDocument.defaultView;
    if (view === null) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const spaceBelow = view.innerHeight - rect.bottom;
    const openUp = spaceBelow < panel.offsetHeight + gap && rect.top > spaceBelow;
    const top = openUp ? Math.max(gap, rect.top - panel.offsetHeight - gap) : rect.bottom + gap;
    this.panelStyle.set({ top: `${top}px`, left: `${rect.left}px`, width: `${rect.width}px` });
  }

  /** Move the panel back under the host so Angular's @if can remove it. */
  private restorePanel(): void {
    const panel = this.panelContainer()?.nativeElement;
    if (panel !== undefined && this.originalParent !== null) {
      this.originalParent.appendChild(panel);
    }
    this.originalParent = null;
  }
}
