import { Routes } from '@angular/router';

/** Lazy routes for the Official CRUD + tracking. Create/Edit happen in a modal. */
export const OFFICIAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./official-list/official-list').then((m) => m.OfficialList),
    title: 'Funcionarios · Territorial',
  },
];
