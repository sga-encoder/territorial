import { Routes } from '@angular/router';

/**
 * Lazy routes for the Department CRUD. Create/Edit happen in a modal
 * (DepartmentFormDialog) opened from the list — no dedicated form routes
 * (mirrors entities.routes.ts).
 * TODO(CU-07): protect with `authGuard` + `roleGuard(['admin'])` once the login
 * feature exists.
 */
export const DEPARTMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./department-list/department-list').then((m) => m.DepartmentList),
    title: 'Departamentos · Territorial',
  },
];
