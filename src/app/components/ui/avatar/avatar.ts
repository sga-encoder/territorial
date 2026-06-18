import { Component, computed, input, signal } from '@angular/core';
import type { AvatarSize } from '../types';

const SIZE_CLASSES: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

// DiceBear "dylan" style via the HTTP API (no bundle cost). The background is
// baked into the URL from our brand blues (stable across both themes, so the
// avatar stays theme-blind — UI Kit principle). Hex go WITHOUT '#', comma-sep.
const DICEBEAR_URL = 'https://api.dicebear.com/9.x/dylan/svg';
const DICEBEAR_BACKGROUND = ['4a8fe7', '2d6ec7', '7aaff0'].join(',');

function buildDicebearUrl(seed: string): string {
  return `${DICEBEAR_URL}?seed=${encodeURIComponent(seed)}&backgroundColor=${DICEBEAR_BACKGROUND}`;
}

/**
 * Identity atom: shows the image when `src` is given (or generates a DiceBear
 * "dylan" avatar from `seed`), and falls back to the initials (primary tint
 * surface) when there is no usable image or it fails to load.
 */
@Component({
  selector: 'ui-avatar',
  template: `
    @if (showImage()) {
      <img
        [src]="resolvedSrc()"
        [alt]="alt()"
        class="h-full w-full rounded-full object-cover"
        (error)="onImageError()"
      />
    } @else {
      <span aria-hidden="true">{{ initials() }}</span>
    }
  `,
  host: {
    '[class]': 'hostClasses()',
    '[attr.aria-label]': 'imageLabel()',
  },
})
export class Avatar {
  readonly src = input<string | null>(null);
  /** Seed for a generated DiceBear "dylan" avatar (used when `src` is null). */
  readonly seed = input('');
  /** Fallback when there is no usable image (e.g. "SG"). */
  readonly initials = input('');
  readonly size = input<AvatarSize>('md');
  /** Accessible name; empty means decorative (a visible name sits next to it). */
  readonly alt = input('');

  // TODO: reset when `src` changes to a new value after a failed load.
  private readonly imageFailed = signal(false);

  /** Explicit photo wins; otherwise build a DiceBear URL from the seed. */
  protected readonly resolvedSrc = computed(
    () => this.src() ?? (this.seed() !== '' ? buildDicebearUrl(this.seed()) : null),
  );
  protected readonly showImage = computed(() => this.resolvedSrc() !== null && !this.imageFailed());
  protected readonly imageLabel = computed(() =>
    !this.showImage() && this.alt() !== '' ? this.alt() : null,
  );
  protected readonly hostClasses = computed(() =>
    [
      'inline-flex select-none items-center justify-center overflow-hidden rounded-full',
      'bg-primary-tint font-medium uppercase text-primary-soft',
      SIZE_CLASSES[this.size()],
    ].join(' '),
  );

  protected onImageError(): void {
    this.imageFailed.set(true);
  }
}
