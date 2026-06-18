import { Component } from '@angular/core';
import { Card, Container, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/dynamic';

@Component({
  selector: 'app-tracking-placeholder',
  imports: [Card, Container, EmptyState, PageHeader],
  template: `
    <ui-container direction="column" [gap]="6">
      <ui-page-header title="Seguimiento en tiempo real" subtitle="Ubicación de funcionarios en campo." />
      <ui-card>
        <ui-empty-state icon="eye" title="Próximamente" message="El módulo de seguimiento en tiempo real está en desarrollo." />
      </ui-card>
    </ui-container>
  `,
})
export class TrackingPlaceholder {}
