import {
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Icon } from '../icon/icon';
import { FieldShell } from './field-shell';
import { createFieldId } from './form-field-control';

interface FilePreview {
  readonly file: File | null;
  readonly name: string;
  /** Object URL for images (revoked on change/destroy); null for other files or when previewing an external URL. */
  readonly url: string | null;
}

/**
 * File picker with **drag & drop**. Click (or keyboard) opens the native dialog;
 * dropping files works anywhere on the zone. Image files show a thumbnail
 * preview; others a file chip. Set `accept="image/*"` for an image-only picker.
 * Emits `filesChange` with the current `File[]` (not a CVA — files don't
 * serialize into a form value).
 */
@Component({
  selector: 'ui-file-drop',
  imports: [FieldShell, Icon],
  template: `
    <ui-field-shell
      [label]="label()"
      [error]="error()"
      [controlId]="fieldId"
      [errorId]="errorId"
      staticLabel
    >
      <div
        class="flex flex-col gap-3"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
      >
        <input
          #picker
          type="file"
          [id]="fieldId"
          class="peer sr-only"
          [attr.accept]="accept() || null"
          [multiple]="multiple()"
          [disabled]="disabled()"
          [attr.aria-describedby]="error() !== null ? errorId : null"
          (change)="onPicked($event)"
        />
        <label [for]="fieldId" [class]="zoneClasses()">
          <ui-icon [name]="imageOnly() ? 'eye' : 'plus'" size="md" color="primary" />
          <span class="text-sm font-medium text-foreground">
            {{ previews().length > 0 ? 'Añadir más…' : promptText() }}
          </span>
          @if (hint(); as hintText) {
            <span class="text-xs text-muted">{{ hintText }}</span>
          }
        </label>

        @if (previews().length > 0) {
          <ul class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            @for (preview of previews(); track preview.name) {
              <li
                class="inset-shadow-highlight relative flex items-center gap-2 overflow-hidden rounded-lg border border-glass-border bg-surface p-2"
              >
                @if (preview.url; as url) {
                  <img [src]="url" alt="" class="h-10 w-10 shrink-0 rounded-md object-cover" />
                } @else {
                  <span
                    class="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary-tint text-primary-soft"
                  >
                    <ui-icon name="info" size="sm" color="inherit" />
                  </span>
                }
                <span class="min-w-0 flex-1 truncate text-xs text-foreground">
                  {{ preview.name }}
                </span>
                <button
                  type="button"
                  class="shrink-0 cursor-pointer rounded-md p-1 text-muted transition-colors hover:bg-surface-muted hover:text-danger"
                  [attr.aria-label]="'Quitar ' + preview.name"
                  (click)="remove(preview)"
                >
                  <ui-icon name="close" size="xs" color="inherit" />
                </button>
              </li>
            }
          </ul>
        }
      </div>
    </ui-field-shell>
  `,
})
export class FileDrop {
  readonly label = input('');
  /** MIME/extension filter (e.g. 'image/*'); empty allows any file. */
  readonly accept = input('');
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  /** Maximum number of files allowed (optional). */
  readonly maxFiles = input<number | null>(null);
  /** Initial preview URLs to show (e.g. existing uploaded images). */
  readonly initialUrls = input<readonly string[] | null>(null);
  /** Helper line under the prompt (e.g. 'PNG, JPG hasta 5MB'). */
  readonly hint = input('');
  readonly error = input<string | null>(null);

  readonly filesChange = output<readonly File[]>();

  protected readonly fieldId = createFieldId();
  protected readonly errorId = `${this.fieldId}-error`;
  protected readonly previews = signal<readonly FilePreview[]>([]);
  protected readonly dragging = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  protected readonly imageOnly = computed(() => this.accept().startsWith('image/'));
  protected readonly promptText = computed(() =>
    this.imageOnly() ? 'Arrastra imágenes aquí o haz clic' : 'Arrastra archivos aquí o haz clic',
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeUrls(this.previews()));
    effect(() => {
      const urls = (this.initialUrls() ?? []).filter((url) => url.trim().length > 0);
      const externalPreviews = urls.map<FilePreview>((url) => ({
        file: null,
        name: url.split('/').pop() ?? url,
        url,
      }));
      const filePreviews = untracked(() =>
        this.previews().filter((preview) => preview.file !== null),
      );
      const max = this.maxFiles() ?? (this.multiple() ? undefined : 1);
      const combined = [...externalPreviews, ...filePreviews];
      this.previews.set(max === undefined ? combined : combined.slice(0, max));
    });
  }

  protected readonly zoneClasses = computed(() => {
    const base =
      'flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed ' +
      'bg-glass-surface px-4 py-8 text-center transition-[background-color,border-color,scale] duration-200 ' +
      'peer-focus-visible:[box-shadow:0_0_0_3px_var(--color-focus-ring)] peer-disabled:cursor-not-allowed peer-disabled:opacity-50';
    return this.dragging()
      ? `${base} scale-[1.01] border-primary bg-primary-tint`
      : `${base} border-glass-border hover:border-border-h hover:bg-surface-muted`;
  });

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) {
      this.dragging.set(true);
    }
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.disabled()) {
      return;
    }
    this.setFiles(event.dataTransfer?.files ?? null);
  }

  protected onPicked(event: Event): void {
    this.setFiles((event.target as HTMLInputElement).files);
  }

  protected remove(preview: FilePreview): void {
    const next = this.previews().filter((current) => current !== preview);
    this.revokeUrls([preview]);
    this.previews.set(next);
    this.filesChange.emit(next.filter((current) => current.file !== null).map((current) => current.file as File));
  }

  /** Normalize a FileList: filter by accept, honour `multiple`, build previews. */
  private setFiles(list: FileList | null): void {
    if (list === null || list.length === 0) {
      return;
    }
    let files = Array.from(list);
    if (this.imageOnly()) {
      files = files.filter((file) => file.type.startsWith('image/'));
    }
    const max = this.maxFiles() ?? (this.multiple() ? undefined : 1);
    if (max !== undefined) {
      files = files.slice(0, max);
    }
    // Merge existing URL previews (keep those) and new file previews up to max
    const existing = this.previews().filter((p) => p.file === null);
    const filePreviews = files.map<FilePreview>((file) => ({
      file,
      name: file.name,
      url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
    }));
    const combined = [...existing, ...filePreviews];
    const finalMax = this.maxFiles() ?? (this.multiple() ? undefined : 1);
    const final = finalMax ? combined.slice(0, finalMax) : combined;
    // Revoke old object URLs that are not kept
    const toRevoke = this.previews().filter((old) => old.url !== null && !final.some((n) => n.url === old.url));
    this.revokeUrls(toRevoke);
    this.previews.set(final);
    this.filesChange.emit(final.filter((p) => p.file !== null).map((p) => p.file as File));
  }

  private revokeUrls(previews: readonly FilePreview[]): void {
    for (const preview of previews) {
      if (preview.url !== null && preview.file !== null) {
        URL.revokeObjectURL(preview.url);
      }
    }
  }
}
