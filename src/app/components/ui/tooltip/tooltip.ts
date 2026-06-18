import { isPlatformBrowser } from '@angular/common';
import { Directive, DOCUMENT, ElementRef, inject, input, OnDestroy, PLATFORM_ID } from '@angular/core';
import type { TooltipPosition } from '../types';

// Glass recipe (tooltips float); pointer-events-none so the tooltip never
// traps the cursor and re-triggers itself.
const TOOLTIP_CLASSES =
  'inset-shadow-glass-highlight pointer-events-none fixed z-50 max-w-xs rounded-md border ' +
  'border-glass-border bg-glass-surface px-2 py-1 text-xs text-foreground shadow-md ' +
  'backdrop-blur-glass';
const GAP_PX = 8;

let nextTooltipId = 0;

/**
 * Attaches a glass tooltip to any element (kit components included):
 *
 *   <ui-button uiTooltip="Eliminar entidad" tooltipPosition="bottom">…
 *
 * Shows on hover AND keyboard focus; announced via aria-describedby. The
 * element is appended to <body> with fixed coordinates so no ancestor
 * overflow can clip it (imperative styles are unavoidable here: the position
 * depends on runtime geometry, not on state expressible as a class binding).
 */
@Directive({
  selector: '[uiTooltip]',
  host: {
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
  },
})
export class Tooltip implements OnDestroy {
  readonly uiTooltip = input.required<string>();
  readonly tooltipPosition = input<TooltipPosition>('top');

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly tooltipId = `ui-tooltip-${nextTooltipId++}`;

  private tooltipElement: HTMLElement | null = null;

  protected show(): void {
    if (!this.isBrowser || this.tooltipElement !== null || this.uiTooltip() === '') {
      return;
    }
    const tooltip = this.document.createElement('div');
    tooltip.id = this.tooltipId;
    tooltip.setAttribute('role', 'tooltip');
    tooltip.className = TOOLTIP_CLASSES;
    tooltip.textContent = this.uiTooltip();
    this.document.body.appendChild(tooltip);
    this.positionTooltip(tooltip);
    this.elementRef.nativeElement.setAttribute('aria-describedby', this.tooltipId);
    this.tooltipElement = tooltip;
  }

  protected hide(): void {
    if (this.tooltipElement !== null) {
      this.tooltipElement.remove();
      this.tooltipElement = null;
      this.elementRef.nativeElement.removeAttribute('aria-describedby');
    }
  }

  ngOnDestroy(): void {
    this.hide();
  }

  private positionTooltip(tooltip: HTMLElement): void {
    const hostRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tipRect = tooltip.getBoundingClientRect();
    let top: number;
    let left: number;
    switch (this.tooltipPosition()) {
      case 'bottom':
        top = hostRect.bottom + GAP_PX;
        left = hostRect.left + (hostRect.width - tipRect.width) / 2;
        break;
      case 'left':
        top = hostRect.top + (hostRect.height - tipRect.height) / 2;
        left = hostRect.left - tipRect.width - GAP_PX;
        break;
      case 'right':
        top = hostRect.top + (hostRect.height - tipRect.height) / 2;
        left = hostRect.right + GAP_PX;
        break;
      default:
        top = hostRect.top - tipRect.height - GAP_PX;
        left = hostRect.left + (hostRect.width - tipRect.width) / 2;
    }
    // Keep it on-screen near the viewport edges.
    tooltip.style.top = `${Math.max(GAP_PX, top)}px`;
    tooltip.style.left = `${Math.max(GAP_PX, left)}px`;
  }
}
