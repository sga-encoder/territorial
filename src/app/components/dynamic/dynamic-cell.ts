import { Component, computed, input } from '@angular/core';
import { Badge, Chip, Text } from '../ui';
import type { DynamicCellType, DynamicCellTypeConfig } from './types';

const DEFAULT_LOCALE = 'es-CO';
const FALLBACK = '—';

/**
 * Renders a single value according to a DynamicColumn's `type`. Lives inside a
 * <ui-table> cell slot; composes the kit's Badge/Chip/Text and formats
 * number/date with Intl (SSR-safe — no template globals). Empty/nullish → "—".
 */
@Component({
  selector: 'ui-dynamic-cell',
  imports: [Badge, Chip, Text],
  template: `
    @switch (type()) {
      @case ('images') {
        <div class="flex items-center gap-2">
          @if (imageUrls().length === 0) {
            {{ display() }}
          } @else {
            @for (url of imageUrls().slice(0, 3); track url) {
              <img [src]="url" alt="" class="h-8 w-8 rounded-md object-cover" />
            }
            @if (imageUrls().length > 3) {
              <span class="text-xs text-muted">+{{ imageUrls().length - 3 }}</span>
            }
          }
        </div>
      }
      @case ('badge') {
        <ui-badge [variant]="badgeVariant()" size="sm">{{ display() }}</ui-badge>
      }
      @case ('chip') {
        <ui-chip [variant]="chipVariant()">{{ display() }}</ui-chip>
      }
      @case ('boolean') {
        <ui-text [color]="isTruthy() ? 'success' : 'muted'">{{ display() }}</ui-text>
      }
      @default {
        {{ display() }}
      }
    }
  `,
  host: { class: 'inline-flex items-center' },
})
export class DynamicCell {
  readonly value = input.required<unknown>();
  readonly type = input<DynamicCellType>('text');
  readonly typeConfig = input<DynamicCellTypeConfig>();

  protected readonly imageUrls = computed(() => {
    const v = this.value();
    if (v === null || v === undefined || v === '') return [] as string[];
    if (Array.isArray(v)) return v.map((x) => String(x));
    return [String(v)];
  });

  protected readonly isTruthy = computed(
    () => this.value() === true || this.value() === 'true',
  );

  protected readonly display = computed<string>(() => {
    const value = this.value();
    if (value === null || value === undefined || value === '') {
      return FALLBACK;
    }
    switch (this.type()) {
      case 'number':
        return this.formatNumber(value);
      case 'date':
        return this.formatDate(value);
      case 'boolean': {
        const labels = this.typeConfig()?.booleanLabels;
        return this.isTruthy() ? (labels?.truthy ?? 'Sí') : (labels?.falsy ?? 'No');
      }
      default:
        return this.typeConfig()?.labels?.[String(value)] ?? String(value);
    }
  });

  protected readonly badgeVariant = computed(
    () => this.typeConfig()?.badgeVariants?.[String(this.value())] ?? 'neutral',
  );
  protected readonly chipVariant = computed(
    () => this.typeConfig()?.chipVariants?.[String(this.value())] ?? 'neutral',
  );

  private formatNumber(value: unknown): string {
    const numeric = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numeric)) {
      return String(value);
    }
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      minimumFractionDigits: this.typeConfig()?.minimumFractionDigits,
    }).format(numeric);
  }

  private formatDate(value: unknown): string {
    const date = value instanceof Date ? value : new Date(value as string | number);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }
    return new Intl.DateTimeFormat(DEFAULT_LOCALE, {
      dateStyle: this.typeConfig()?.dateStyle ?? 'medium',
    }).format(date);
  }
}
