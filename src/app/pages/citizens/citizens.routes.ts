import { Routes } from '@angular/router';

/** Lazy routes for the Citizen CRUD. Create/Edit happen in a modal. */
export const CITIZEN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./citizen-list/citizen-list').then((m) => m.CitizenList),
    title: 'Ciudadanos · Territorial',
  },
];
