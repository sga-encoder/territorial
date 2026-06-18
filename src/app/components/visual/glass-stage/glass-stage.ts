import { booleanAttribute, Component, computed, input } from '@angular/core';

/**
 * Glass content stage — the companion to `ui-particles-background`. The particle
 * field is painted full-screen at `z-10`; this surface establishes a HIGHER
 * stacking context (`z-20`) with the glass recipe, so the animated dust is felt
 * — blurred — THROUGH the panel while every projected child stays sharp and
 * legible on top of it (a `backdrop-filter` only blurs the backdrop, never the
 * element's own content).
 *
 * Wrap page content that shares the screen with the visual background in one of
 * these. Lives in the `visual` layer because it exists solely to resolve the
 * z-order between content and the canvas background — not a generic kit atom.
 */
@Component({
  selector: 'ui-glass-stage',
  template: `<ng-content />`,
  host: {
    '[class]': 'hostClasses()',
  },
})
export class GlassStage {
  /** Inner padding around the projected content. Set false for a flush surface. */
  readonly padded = input(true, { transform: booleanAttribute });

  protected readonly hostClasses = computed(
    () =>
      'relative z-20 block rounded-2xl border border-glass-border bg-glass-surface ' +
      'backdrop-blur-glass inset-shadow-glass-highlight shadow-lg ' +
      (this.padded() ? 'p-6 md:p-8' : ''),
  );
}
