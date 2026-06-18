import { Routes } from '@angular/router';

/** Lazy routes for the City CRUD. Create/Edit happen in a modal. */
export const CITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./city-list/city-list').then((m) => m.CityList),
    title: 'Ciudades · Territorial',
  },
];
