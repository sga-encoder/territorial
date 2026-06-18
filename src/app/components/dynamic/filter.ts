import { Component, computed, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { Button, Checkbox, Container, DateField, InputText, Select } from '../ui';
import type { TableRow } from '../ui';
import type { FilterConfig, FilterFieldConfig, FilterMode } from './types';

/**
 * Compact filter bar driven by configuration: builds a small Reactive Form from
 * `config`, runs a local pipeline over `data` and emits the filtered collection
 * (`filteredChange`) — typically wired straight into a <ui-dynamic-table>. In
 * `auto` mode it filters live (debounced); in `manual` mode it waits for the
 * Filtrar button. Composes the kit's form controls; the only raw utilities are
 * grid glue (capa `dynamic`).
 */
@Component({
  selector: 'ui-filter',
  imports: [ReactiveFormsModule, InputText, Select, DateField, Checkbox, Button, Container],
  template: `
    <form [formGroup]="form()" (ngSubmit)="apply()" class="flex flex-col gap-4">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (field of config().fields; track field.key) {
          @switch (field.type) {
            @case ('select') {
              <ui-select
                [formControlName]="field.key"
                [label]="field.label"
                [placeholder]="field.placeholder ?? 'Todos'"
                [options]="field.options ?? []"
              />
            }
            @case ('date') {
              <ui-date [formControlName]="field.key" [label]="field.label" />
            }
            @case ('checkbox') {
              <ui-checkbox [formControlName]="field.key" [label]="field.label" />
            }
            @default {
              <ui-input
                [formControlName]="field.key"
                [label]="field.label"
                [placeholder]="field.placeholder ?? ''"
              />
            }
          }
        }
      </div>

      <ui-container direction="row" justify="end" [gap]="2">
        <ui-button variant="ghost" (clicked)="clear()">Limpiar</ui-button>
        @if (mode() === 'manual') {
          <ui-button type="submit">Filtrar</ui-button>
        }
      </ui-container>
    </form>
  `,
  host: { class: 'block' },
})
export class Filter {
  readonly config = input.required<FilterConfig>();
  readonly data = input.required<readonly TableRow[]>();
  readonly mode = input<FilterMode>('auto');
  readonly debounce = input(250);

  readonly filteredChange = output<readonly TableRow[]>();

  protected readonly form = computed(() => this.buildForm(this.config()));

  constructor() {
    // Emit on first render and whenever the source data (or rebuilt form)
    // changes; in auto mode also subscribe to live, debounced value changes.
    effect((onCleanup) => {
      const form = this.form();
      this.data();
      this.emit();
      if (this.mode() === 'auto') {
        const subscription = form.valueChanges
          .pipe(debounceTime(this.debounce()))
          .subscribe(() => this.emit());
        onCleanup(() => subscription.unsubscribe());
      }
    });
  }

  protected apply(): void {
    this.emit();
  }

  protected clear(): void {
    this.form().reset();
    this.emit();
  }

  private emit(): void {
    const values = this.form().getRawValue();
    const fields = this.config().fields;
    const filtered = this.data().filter((row) =>
      fields.every((field) => this.matches(row, field, values[field.key])),
    );
    this.filteredChange.emit(filtered);
  }

  private buildForm(config: FilterConfig): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const field of config.fields) {
      const initial = field.type === 'checkbox' ? false : field.type === 'select' ? null : '';
      controls[field.key] = new FormControl(initial);
    }
    return new FormGroup(controls);
  }

  /** A null/empty/false value means "no constraint" for that field. */
  private matches(row: TableRow, field: FilterFieldConfig, value: unknown): boolean {
    if (value === null || value === undefined || value === '' || value === false) {
      return true;
    }
    const cellText = String(row[field.key] ?? '');
    switch (field.matchMode) {
      case 'contains':
        return cellText.toLowerCase().includes(String(value).toLowerCase());
      case 'equals':
        return cellText === String(value);
      case 'in':
        return Array.isArray(value)
          ? value.map(String).includes(cellText)
          : cellText === String(value);
      case 'gte':
      case 'lte': {
        const cellNumber = Number(row[field.key]);
        const valueNumber = Number(value);
        if (!Number.isNaN(cellNumber) && !Number.isNaN(valueNumber)) {
          return field.matchMode === 'gte' ? cellNumber >= valueNumber : cellNumber <= valueNumber;
        }
        return field.matchMode === 'gte' ? cellText >= String(value) : cellText <= String(value);
      }
    }
  }
}
