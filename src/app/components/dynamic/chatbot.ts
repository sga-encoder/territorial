import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  PLATFORM_ID,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Avatar, Button, Text } from '../ui';
import type { ChatMessage } from './types';

/**
 * Presentational chat surface: a glass panel with glass bubbles for the
 * assistant (floating) and solid for the user (read), avatars, a typing
 * indicator and SSR-safe auto-scroll. Bubbles carry NO backdrop-filter
 * (repeated content) — the tint already reads as glass. It owns no conversation
 * logic: it renders `messages` and emits `messageSent`; the consumer wires the
 * responder (AI, backend or a mock).
 */
@Component({
  selector: 'ui-chatbot',
  imports: [ReactiveFormsModule, Avatar, Button, Text],
  template: `
    <div
      class="flex h-[32rem] flex-col overflow-hidden rounded-2xl border border-glass-border bg-glass-surface inset-shadow-glass-highlight shadow-lg backdrop-blur-glass"
    >
      <header class="flex items-center gap-3 border-b border-glass-border px-4 py-3">
        <ui-avatar
                [initials]="assistantInitials()"
                [src]="assistantAvatar()"
                [seed]="assistantSeed()"
                size="sm"
              />
        <div class="flex flex-col">
          <ui-text weight="semibold">{{ title() }}</ui-text>
          <ui-text variant="caption" [color]="typing() ? 'primary' : 'muted'">
            {{ typing() ? 'Escribiendo…' : subtitle() }}
          </ui-text>
        </div>
      </header>

      <div
        #scroll
        class="min-h-0 flex-1 overflow-y-auto px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="Conversación"
      >
        <div class="flex flex-col gap-4">
          @for (message of messages(); track message.id) {
            <div [class]="rowClass(message)">
              @if (message.role === 'assistant') {
                <ui-avatar
                [initials]="assistantInitials()"
                [src]="assistantAvatar()"
                [seed]="assistantSeed()"
                size="sm"
              />
              }
              <div [class]="bubbleClass(message)">
                <span class="whitespace-pre-wrap break-words">{{ message.content }}</span>
                @if (message.timestamp; as timestamp) {
                  <span class="mt-1 block text-end text-[0.65rem] opacity-60">{{ timestamp }}</span>
                }
              </div>
              @if (message.role === 'user') {
                <ui-avatar
                  [initials]="userInitials()"
                  [src]="userAvatar()"
                  [seed]="userSeed()"
                  size="sm"
                />
              }
            </div>
          }

          @if (typing()) {
            <div class="flex items-end gap-2">
              <ui-avatar
                [initials]="assistantInitials()"
                [src]="assistantAvatar()"
                [seed]="assistantSeed()"
                size="sm"
              />
              <div
                class="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-glass-border bg-glass-surface px-4 py-3 text-muted"
                aria-label="El asistente está escribiendo"
              >
                <span class="h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:0ms]"></span>
                <span
                  class="h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:150ms]"
                ></span>
                <span
                  class="h-2 w-2 animate-pulse rounded-full bg-current [animation-delay:300ms]"
                ></span>
              </div>
            </div>
          }
        </div>
      </div>

      <form
        [formGroup]="composer"
        (ngSubmit)="send()"
        class="flex items-center gap-2 border-t border-glass-border p-3"
      >
        <input
          formControlName="draft"
          type="text"
          [placeholder]="placeholder()"
          aria-label="Mensaje"
          class="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted placeholder:italic focus:border-primary focus:outline-none"
        />
        <ui-button type="submit" [disabled]="!canSend()">Enviar</ui-button>
      </form>
    </div>
  `,
  host: { class: 'block' },
})
export class Chatbot {
  readonly messages = input<readonly ChatMessage[]>([]);
  readonly typing = input(false);
  readonly title = input('Asistente');
  readonly subtitle = input('En línea');
  readonly placeholder = input('Escribe un mensaje…');
  readonly assistantInitials = input('IA');
  readonly userInitials = input('Tú');
  readonly assistantAvatar = input<string | null>(null);
  readonly userAvatar = input<string | null>(null);
  /** DiceBear seeds (used when no explicit avatar URL is given). */
  readonly assistantSeed = input('asistente-territorial');
  readonly userSeed = input('usuario-territorial');
  readonly disabled = input(false);

  readonly messageSent = output<string>();

  protected readonly composer = new FormGroup({
    draft: new FormControl('', { nonNullable: true }),
  });

  private readonly platformId = inject(PLATFORM_ID);
  private readonly scrollPane = viewChild<ElementRef<HTMLElement>>('scroll');
  private readonly draftValue = toSignal(this.composer.controls.draft.valueChanges, {
    initialValue: '',
  });
  protected readonly canSend = computed(
    () => !this.disabled() && this.draftValue().trim() !== '',
  );

  constructor() {
    // Keep the latest message in view after each render (browser only). rAF runs
    // after layout, so scrollHeight already includes the new bubble.
    effect(() => {
      this.messages();
      this.typing();
      if (!isPlatformBrowser(this.platformId)) {
        return;
      }
      const pane = this.scrollPane()?.nativeElement;
      if (pane === undefined) {
        return;
      }
      requestAnimationFrame(() => {
        pane.scrollTop = pane.scrollHeight;
      });
    });

    // Mirror the `disabled` input onto the draft control (avoids the reactive
    // forms "disabled attribute" warning a template binding would trigger).
    effect(() => {
      const control = this.composer.controls.draft;
      if (this.disabled() && control.enabled) {
        control.disable();
      } else if (!this.disabled() && control.disabled) {
        control.enable();
      }
    });
  }

  protected rowClass(message: ChatMessage): string {
    const base = 'flex items-end gap-2';
    return message.role === 'user' ? `${base} flex-row-reverse` : base;
  }

  protected bubbleClass(message: ChatMessage): string {
    const base = 'max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm';
    return message.role === 'user'
      ? `${base} rounded-br-sm bg-primary-strong text-on-primary`
      : `${base} rounded-bl-sm border border-glass-border bg-glass-surface text-foreground`;
  }

  protected send(): void {
    const text = this.composer.controls.draft.value.trim();
    if (text === '') {
      return;
    }
    this.messageSent.emit(text);
    this.composer.reset();
  }
}
