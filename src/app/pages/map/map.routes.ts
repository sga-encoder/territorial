import { Routes } from '@angular/router';

export const MAP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./tracking-map').then((m) => m.TrackingMap),
    title: 'Mapa de seguimiento · Territorial',
  },
];
