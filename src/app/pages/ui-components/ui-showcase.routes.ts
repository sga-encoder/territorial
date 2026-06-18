import { Routes } from '@angular/router';

/** Lazy route for the living UI Kit showcase (documentación viva + sustentación). */
export const UI_SHOWCASE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./ui-showcase').then((m) => m.UiShowcase),
    title: 'UI Kit · Territorial',
  },
];
