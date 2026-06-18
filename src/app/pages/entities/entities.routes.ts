import { Routes } from '@angular/router';

/**
 * Lazy routes for the Entity CRUD (CU-01). Create/Edit happen in a modal
 * (EntityFormDialog) opened from the list — no dedicated form routes.
 * TODO(CU-07): protect with `authGuard` + `roleGuard(['admin'])` once the login
 * feature exists.
 */
export const ENTITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./entity-list/entity-list').then((m) => m.EntityList),
    title: 'Entidades · Territorial',
  },
];
