import { Routes } from '@angular/router';

/** Lazy routes for the Commune CRUD. Create/Edit happen in a modal. */
export const COMMUNE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./commune-list/commune-list').then((m) => m.CommuneList),
    title: 'Comunas · Territorial',
  },
];
