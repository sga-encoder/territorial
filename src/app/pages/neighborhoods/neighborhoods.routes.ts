import { Routes } from '@angular/router';

/** Lazy routes for the Neighborhood CRUD. Create/Edit happen in a modal. */
export const NEIGHBORHOOD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./neighborhood-list/neighborhood-list').then((m) => m.NeighborhoodList),
    title: 'Barrios · Territorial',
  },
];
