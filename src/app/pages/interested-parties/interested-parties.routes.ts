import { Routes } from '@angular/router';

/** Lazy routes for the InterestedParty CRUD. Create/Edit happen in a modal. */
export const INTERESTED_PARTY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./interested-party-list/interested-party-list').then((m) => m.InterestedPartyList),
    title: 'Interesados · Territorial',
  },
];
