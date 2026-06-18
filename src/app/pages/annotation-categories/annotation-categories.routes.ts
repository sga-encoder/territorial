import { Routes } from '@angular/router';

/** Lazy routes for the AnnotationCategory CRUD. Create/Edit happen in a modal. */
export const ANNOTATION_CATEGORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./annotation-category-list/annotation-category-list').then(
        (m) => m.AnnotationCategoryList,
      ),
    title: 'Categorías de anotación · Territorial',
  },
];
