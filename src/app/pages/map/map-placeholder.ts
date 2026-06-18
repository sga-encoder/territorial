import { Component } from '@angular/core';
import { Card, Container, EmptyState } from '../../components/ui';
import { PageHeader } from '../../components/dynamic';

@Component({
  selector: 'app-map-placeholder',
  imports: [Card, Container, EmptyState, PageHeader],
  template: `
    <ui-container direction="column" [gap]="6">
      <ui-page-header title="Mapa de anotaciones" subtitle="Visualización geográfica por categorías y subcategorías." />
      <ui-card>
        <ui-empty-state icon="map-pin" title="Próximamente" message="El mapa interactivo está en desarrollo." />
      </ui-card>
    </ui-container>
  `,
})
export class MapPlaceholder {}
