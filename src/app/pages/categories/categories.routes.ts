import { Routes } from '@angular/router';

/** Lazy routes for the Category CRUD. Create/Edit happen in a modal. */
export const CATEGORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./category-list/category-list').then((m) => m.CategoryList),
    title: 'Categorías · Territorial',
  },
];
