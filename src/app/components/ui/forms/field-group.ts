import { Component } from '@angular/core';

/**
 * Joins several form controls into a single seamless group (no gap, shared
 * borders) — e.g. two inputs or input + select side by side. The actual
 * border/corner collapsing lives in global styles (`.ui-field-group` in
 * styles.scss) because it must reach the `<input>` / trigger nested inside each
 * projected control, across component encapsulation.
 *
 *   <ui-field-group>
 *     <ui-input placeholder="Mínimo" />
 *     <ui-input placeholder="Máximo" />
 *   </ui-field-group>
 */
@Component({
  selector: 'ui-field-group',
  template: `<ng-content />`,
  host: { class: 'ui-field-group', role: 'group' },
})
export class FieldGroup {}
