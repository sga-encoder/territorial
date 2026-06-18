import { Routes } from '@angular/router';

/** Lazy routes for the Reports module (visual query + Groq chat). */
export const REPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./reports-page').then((m) => m.ReportsPage),
    title: 'Reportes · Territorial',
  },
  {
    path: 'chat',
    loadComponent: () => import('./reports-chat').then((m) => m.ReportsChatPage),
    title: 'Chat de reportes · Territorial',
  },
];
