import { Component, computed, effect, input, output, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidatorFn,
  Validators,
} from '@angular/forms';
import { Button, Container, Text, Title } from '../ui';
import { DynamicInput } from './dynamic-input';
import type { FormFieldConfig, FormFieldSpan, FormFieldValidator, FormSchema, FormValue } from './types';

// Full literal class names per span so Tailwind's scanner emits them; mobile
// stacks (col-span-12) and the configured span applies from `sm` up.
const SPAN_CLASSES: Record<FormFieldSpan, string> = {
  1: 'col-span-12 sm:col-span-1',
  2: 'col-span-12 sm:col-span-2',
  3: 'col-span-12 sm:col-span-3',
  4: 'col-span-12 sm:col-span-4',
  6: 'col-span-12 sm:col-span-6',
  12: 'col-span-12',
};

function toValidatorFn(validator: FormFieldValidator): ValidatorFn {
  switch (validator.type) {
    case 'required':
      return Validators.required;
    case 'requiredTrue':
      return Validators.requiredTrue;
    case 'email':
      return Validators.email;
    case 'min':
      return Validators.min(validator.value);
    case 'max':
      return Validators.max(validator.value);
    case 'minLength':
      return Validators.minLength(validator.value);
    case 'maxLength':
      return Validators.maxLength(validator.value);
    case 'pattern':
      return Validators.pattern(validator.value);
  }
}

function initialValueFor(field: FormFieldConfig): unknown {
  if (field.initialValue !== undefined) {
    return field.initialValue;
  }
  switch (field.type) {
    case 'checkbox':
      return false;
    case 'range':
      return field.min ?? 0;
    case 'select':
    case 'radio':
      return null;
    case 'multiselect':
      return typeof field.initialValue !== 'undefined' ? field.initialValue : [];
    case 'file':
      // File controls hold a File[]; empty array so Validators.required works.
      return [];
    default:
      return '';
  }
}

/**
 * Builds a Reactive Form from a metadata schema: a flat FormGroup keyed by field
 * key, rendered page by page (wizard) with a 12-col grid per section. Composes
 * the kit through <ui-dynamic-input>; the only raw utilities are grid glue
 * (capa `dynamic`). Conditional fields disable their control while hidden so
 * they never block validity. Errors follow RN-UI-07 (quiet until a submit/next
 * attempt). Emits `formChanged` on every change and `formSubmitted` only when
 * the whole form is valid. Pass a STABLE `schema` reference (a new array each CD
 * rebuilds the group and resets the wizard).
 */
@Component({
  selector: 'ui-form-generator',
  imports: [ReactiveFormsModule, DynamicInput, Button, Container, Title, Text],
  template: `
    <form [formGroup]="form()" (ngSubmit)="onSubmit()" class="flex flex-col gap-6">
      @if (currentPage(); as page) {
        @if (pages().length > 1) {
          <ui-text variant="caption" color="primary">
            Paso {{ currentPageIndex() + 1 }} de {{ pages().length }}
          </ui-text>
        }

        <header class="flex flex-col gap-1">
          <ui-title [level]="3">{{ page.title }}</ui-title>
          @if (page.description; as description) {
            <ui-text variant="caption">{{ description }}</ui-text>
          }
        </header>

        @for (section of page.sections; track $index) {
          <section class="flex flex-col gap-3">
            @if (section.title; as title) {
              <ui-title [level]="5">{{ title }}</ui-title>
            }
            @if (section.description; as description) {
              <ui-text variant="caption">{{ description }}</ui-text>
            }
            <div class="grid grid-cols-12 gap-4">
              @for (field of section.fields; track field.key) {
                @if (field.type !== 'hidden' && isVisible(field)) {
                  <div [class]="spanClass(field)">
                    <ui-dynamic-input
                      [field]="field"
                      [control]="controlFor(field.key)"
                      [submitted]="submitted()"
                    />
                  </div>
                }
              }
            </div>
          </section>
        }

        <ui-container direction="row" justify="between" align="center" [gap]="3">
          <div>
            @if (pages().length > 1) {
              <ui-button variant="secondary" [disabled]="isFirstPage()" (clicked)="previous()">
                Anterior
              </ui-button>
            }
          </div>
          <div>
            @if (isLastPage()) {
              <ui-button type="submit">{{ submitLabel() }}</ui-button>
            } @else {
              <ui-button (clicked)="next()">Siguiente</ui-button>
            }
          </div>
        </ui-container>
      }
    </form>
  `,
  host: { class: 'block' },
})
export class FormGenerator {
  readonly schema = input.required<FormSchema>();
  readonly submitLabel = input('Enviar');

  readonly formSubmitted = output<FormValue>();
  readonly formChanged = output<FormValue>();

  protected readonly submitted = signal(false);
  protected readonly currentPageIndex = signal(0);
  protected readonly visibility = signal<Record<string, boolean>>({});

  protected readonly pages = computed(() => this.schema());
  protected readonly currentPage = computed(() => this.pages()[this.currentPageIndex()] ?? null);
  protected readonly isFirstPage = computed(() => this.currentPageIndex() === 0);
  protected readonly isLastPage = computed(
    () => this.currentPageIndex() === this.pages().length - 1,
  );

  private readonly allFields = computed<readonly FormFieldConfig[]>(() =>
    this.pages().flatMap((page) => page.sections.flatMap((section) => section.fields)),
  );

  /** The reactive group, rebuilt whenever the schema input changes. */
  protected readonly form = computed(() => this.buildForm());

  constructor() {
    // Bind value-driven concerns (conditional visibility + change output) to the
    // current group; re-runs and re-subscribes if the schema replaces it.
    effect((onCleanup) => {
      const form = this.form();
      this.currentPageIndex.set(0);
      this.submitted.set(false);
      this.applyVisibility(form);
      const subscription = form.valueChanges.subscribe(() => {
        this.applyVisibility(form);
        this.formChanged.emit(form.getRawValue());
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected controlFor(key: string): FormControl {
    return this.form().get(key) as FormControl;
  }

  protected spanClass(field: FormFieldConfig): string {
    return SPAN_CLASSES[field.span ?? 12];
  }

  protected isVisible(field: FormFieldConfig): boolean {
    return this.visibility()[field.key] ?? true;
  }

  protected previous(): void {
    if (!this.isFirstPage()) {
      this.currentPageIndex.update((index) => index - 1);
    }
  }

  protected next(): void {
    if (this.isLastPage()) {
      return;
    }
    if (!this.isCurrentPageValid()) {
      this.submitted.set(true);
      return;
    }
    this.currentPageIndex.update((index) => index + 1);
  }

  protected onSubmit(): void {
    this.submitted.set(true);
    const form = this.form();
    if (form.valid) {
      this.formSubmitted.emit(form.getRawValue());
    }
  }

  private isCurrentPageValid(): boolean {
    const page = this.currentPage();
    if (page === null) {
      return true;
    }
    const form = this.form();
    return page.sections.every((section) =>
      section.fields.every((field) => {
        const control = form.get(field.key);
        return control === null || control.disabled || control.valid;
      }),
    );
  }

  private buildForm(): FormGroup {
    const controls: Record<string, FormControl> = {};
    for (const field of this.allFields()) {
      controls[field.key] = new FormControl(initialValueFor(field), {
        validators: (field.validators ?? []).map(toValidatorFn),
      });
    }
    return new FormGroup(controls);
  }

  /** Toggle conditional fields: hidden ones are disabled (out of validity/value). */
  private applyVisibility(form: FormGroup): void {
    const state: Record<string, boolean> = {};
    for (const field of this.allFields()) {
      const rule = field.conditionalVisibility;
      const visible = rule === undefined ? true : form.get(rule.fieldKey)?.value === rule.equals;
      state[field.key] = visible;
      const control = form.get(field.key);
      if (control !== null) {
        if (visible && control.disabled) {
          control.enable({ emitEvent: false });
        } else if (!visible && control.enabled) {
          control.disable({ emitEvent: false });
        }
      }
    }
    this.visibility.set(state);
  }
}
