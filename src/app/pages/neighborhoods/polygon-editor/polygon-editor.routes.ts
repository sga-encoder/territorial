import { Routes } from '@angular/router';

/**
 * Lazy route for the neighborhood polygon editor (CU-09 / CU-10). The page owns
 * its own neighborhood picker, so a single route is enough.
 * TODO(CU-07): protect with `authGuard` + `roleGuard(['official'])` once login
 * exists — only an Official may demarcate territories (spec.md RN-23).
 */
export const POLYGON_EDITOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./polygon-editor').then((m) => m.PolygonEditor),
    title: 'Demarcación · Territorial',
  },
];
