import { Routes } from '@angular/router';

/** Lazy routes for the Vote CRUD. Create/Edit happen in a modal. */
export const VOTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./vote-list/vote-list').then((m) => m.VoteList),
    title: 'Votos · Territorial',
  },
];
