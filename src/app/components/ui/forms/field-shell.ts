import { booleanAttribute, Component, computed, input } from '@angular/core';

const BASE =
  'pointer-events-none absolute z-10 origin-left text-muted transition-all duration-200 ease-out';
// Resting = acts as the placeholder INSIDE the control (centered for single-line,
// near the top for the textarea).
const RESTING_CENTER = 'top-1/2 -translate-y-1/2 text-sm';
const RESTING_TOP = 'top-3 text-sm';
// Floated = ABOVE the control (outside). Only animatable properties change
// (numeric `top` + `translate` + font-size), so the transition stays fluid — NO
// `top: auto`/`bottom` (those jump instead of animating).
const FLOATED = '-top-5 left-3 translate-y-0 text-xs font-medium text-primary-soft';
// Same float driven by focus (CSS only) — works for native inputs and the custom
// Select/Date triggers, since the focusable element lives inside the `group`.
const FOCUS_FLOAT =
  'group-focus-within:-top-5 group-focus-within:left-3 group-focus-within:translate-y-0 ' +
  'group-focus-within:text-xs group-focus-within:font-medium group-focus-within:text-primary-soft';

/**
 * Internal chrome for the single-control fields. Two label modes:
 *  - **floating** (default — InputText, TextArea, Select, Date): the label sits
 *    inside the control as a placeholder when empty/inactive and floats ABOVE it
 *    on focus or when filled (reacts via `:focus-within` + the `filled` input).
 *  - **static** (`staticLabel` — FileDrop, Range): a normal label above the
 *    control (no float). Not exported — features never use it directly.
 */
@Component({
  selector: 'ui-field-shell',
  template: `
    <div class="flex w-full flex-col gap-1.5" [class.pt-5]="floatingWithLabel()">
      @if (staticLabel() && label() !== '') {
        <label [for]="controlId()" class="text-sm font-medium text-foreground">{{ label() }}</label>
      }
      <div class="group relative">
        <ng-content />
        @if (floatingWithLabel()) {
          <label [for]="controlId()" [class]="labelClasses()">{{ label() }}</label>
        }
      </div>
      @if (error(); as message) {
        <p [id]="errorId()" class="text-sm text-danger">{{ message }}</p>
      }
    </div>
  `,
})
export class FieldShell {
  readonly label = input('');
  readonly error = input<string | null>(null);
  readonly controlId = input.required<string>();
  readonly errorId = input.required<string>();
  /** Has content → keep the label floated. */
  readonly filled = input(false, { transform: booleanAttribute });
  /** Multi-line control → the resting label sits near the top, not centered. */
  readonly floatTop = input(false, { transform: booleanAttribute });
  /** Leave room for a leading icon → indent the resting label. */
  readonly indent = input(false, { transform: booleanAttribute });
  /** Render a normal label above the control instead of a floating one. */
  readonly staticLabel = input(false, { transform: booleanAttribute });

  protected readonly floatingWithLabel = computed(() => !this.staticLabel() && this.label() !== '');

  protected readonly labelClasses = computed(() => {
    const left = this.indent() ? 'left-9' : 'left-3';
    const resting = this.filled() ? FLOATED : this.floatTop() ? RESTING_TOP : RESTING_CENTER;
    return `${BASE} ${left} ${resting} ${FOCUS_FLOAT}`;
  });
}
