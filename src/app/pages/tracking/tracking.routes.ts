import { Routes } from '@angular/router';

// TODO(CU-08): implement real-time official tracking.
export const TRACKING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./tracking-placeholder').then((m) => m.TrackingPlaceholder),
  },
];
