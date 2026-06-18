import type { Routes } from '@angular/router';

export const PENDING_USER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pending-user-list/pending-user-list').then((m) => m.PendingUserList),
  },
];
