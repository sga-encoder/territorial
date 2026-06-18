import { booleanAttribute, Component, computed, input } from '@angular/core';

// Solid 3D mate: opaque surface gradient + border differential (light top/left,
// shadow bottom/right) gives the volume — no inner shadows on top of the object.
const SOLID_CLASSES =
  'inset-shadow-highlight shadow-md ' +
  'bg-[linear-gradient(175deg,var(--color-3d-hi)_0%,var(--color-surface)_42%,var(--color-3d-dk)_100%)] ' +
  '[border-top:1.5px_solid_var(--color-border-h)] [border-left:1px_solid_var(--color-border-h)] ' +
  '[border-right:1px_solid_var(--color-3d-dk)] [border-bottom:1.5px_solid_var(--color-3d-dk)]';
const GLASS_CLASSES =
  'border-glass-border bg-glass-surface backdrop-blur-glass inset-shadow-glass-highlight shadow-lg';

/**
 * Content surface. Solid by default ("solid where it reads"); `elevated`
 * switches to the glass recipe for floating/highlighted contexts — never use
 * elevated cards inside long lists (backdrop-filter cost).
 *
 * Header and footer are optional projection slots that collapse when unused:
 * their wrappers are styled with `empty:hidden` (the template keeps the
 * ng-content tags tight so the wrapper is truly :empty when nothing projects).
 *
 * `padded` (default true) controls the body inset only; set it to false to let
 * edge-to-edge content (a map canvas, media, a flush table) fill the rounded
 * surface — header/footer keep their padding.
 */
@Component({
  selector: 'ui-card',
  template: `
    <div [class]="cardClasses()">
      <div class="border-b border-border px-6 py-4 empty:hidden"><ng-content select="[ui-card-header]" /></div>
      <div [class]="bodyClasses()"><ng-content /></div>
      <div class="border-t border-border px-6 py-4 empty:hidden"><ng-content select="[ui-card-footer]" /></div>
    </div>
  `,
  host: { class: 'block' },
})
export class Card {
  readonly elevated = input(false, { transform: booleanAttribute });
  /** Body padding. False = edge-to-edge body (maps, media). Default true. */
  readonly padded = input(true, { transform: booleanAttribute });

  protected readonly cardClasses = computed(
    () =>
      `overflow-hidden rounded-lg border ${this.elevated() ? GLASS_CLASSES : SOLID_CLASSES}`,
  );

  protected readonly bodyClasses = computed(() => (this.padded() ? 'px-6 py-4' : ''));
}
