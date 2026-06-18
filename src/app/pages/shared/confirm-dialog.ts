import { Component, inject, input } from '@angular/core';
import { Button, Container, ModalService, Text } from '../../components/ui';
import type { ButtonVariant } from '../../components/ui';

/**
 * Generic confirmation dialog opened through ModalService. The opener passes
 * `message`/labels via ModalConfig.inputs and awaits the boolean result of
 * modal.open() (true = confirmed). Accessible alternative to window.confirm.
 * Shared by every CRUD feature (relocated here from pages/entities).
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [Button, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      <ui-text>{{ message() }}</ui-text>
      <ui-container justify="end" [gap]="2">
        <ui-button variant="ghost" (clicked)="modal.close(false)">{{ cancelLabel() }}</ui-button>
        <ui-button [variant]="confirmVariant()" (clicked)="modal.close(true)">
          {{ confirmLabel() }}
        </ui-button>
      </ui-container>
    </ui-container>
  `,
})
export class ConfirmDialog {
  readonly message = input('¿Confirmar esta acción?');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly confirmVariant = input<ButtonVariant>('primary');

  protected readonly modal = inject(ModalService);
}
