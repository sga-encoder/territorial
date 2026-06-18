import { Routes } from '@angular/router';

/** Lazy routes for the Annotation CRUD + map view. */
export const ANNOTATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./annotation-list/annotation-list').then((m) => m.AnnotationList),
    title: 'Anotaciones · Territorial',
  },
  {
    path: 'map',
    loadComponent: () => import('./annotation-map/annotation-map').then((m) => m.AnnotationMap),
    title: 'Mapa de anotaciones · Territorial',
  },
];
