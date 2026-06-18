import { Routes } from '@angular/router';

/** Lazy routes for the Evidence CRUD. Create/Edit happen in a modal. */
export const EVIDENCE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./evidence-list/evidence-list').then((m) => m.EvidenceList),
    title: 'Evidencias · Territorial',
  },
];
