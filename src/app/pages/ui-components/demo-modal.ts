import { Component, inject } from '@angular/core';
import { Button, Container, ModalService, Text } from '../../components/ui';

/**
 * Example modal content for the showcase: a confirm dialog. It closes itself
 * through ModalService; the result reaches the Promise of modal.open().
 */
@Component({
  selector: 'app-demo-modal',
  imports: [Button, Container, Text],
  template: `
    <ui-container direction="column" [gap]="4">
      <ui-text>
        ¿Deseas archivar la entidad “Alcaldía de Manizales”? La acción se puede revertir desde el
        historial.
      </ui-text>
      <ui-container justify="end" [gap]="2">
        <ui-button variant="ghost" (clicked)="modal.close(false)">Cancelar</ui-button>
        <ui-button variant="danger" (clicked)="modal.close(true)">Archivar</ui-button>
      </ui-container>
    </ui-container>
  `,
})
export class DemoModal {
  protected readonly modal = inject(ModalService);
}
