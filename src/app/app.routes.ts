import { Routes } from '@angular/router';
import { Shell } from './layout/shell/shell';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  // ── Public ─────────────────────────────────────────────────────────────
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.routes').then((m) => m.LOGIN_ROUTES),
  },

  // ── Authenticated shell ─────────────────────────────────────────────────
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      // ── Admin-only ──────────────────────────────────────────────────────
      {
        path: 'entities',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/entities/entities.routes').then((m) => m.ENTITY_ROUTES),
      },
      {
        path: 'officials',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/officials/officials.routes').then((m) => m.OFFICIAL_ROUTES),
      },
      {
        path: 'citizens',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/citizens/citizens.routes').then((m) => m.CITIZEN_ROUTES),
      },
      {
        path: 'territory/departments',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/departments/departments.routes').then((m) => m.DEPARTMENT_ROUTES),
      },
      {
        path: 'territory/cities',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/cities/cities.routes').then((m) => m.CITY_ROUTES),
      },
      {
        path: 'territory/communes',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/communes/communes.routes').then((m) => m.COMMUNE_ROUTES),
      },
      {
        path: 'territory/neighborhoods',
        canActivate: [roleGuard(['admin', 'official'])],
        loadChildren: () =>
          import('./pages/neighborhoods/neighborhoods.routes').then((m) => m.NEIGHBORHOOD_ROUTES),
      },
      {
        path: 'territory/demarcation',
        canActivate: [roleGuard(['admin', 'official'])],
        loadChildren: () =>
          import('./pages/neighborhoods/polygon-editor/polygon-editor.routes').then(
            (m) => m.POLYGON_EDITOR_ROUTES,
          ),
      },
      {
        path: 'categories',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/categories/categories.routes').then((m) => m.CATEGORY_ROUTES),
      },
      {
        path: 'annotation-categories',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/annotation-categories/annotation-categories.routes').then(
            (m) => m.ANNOTATION_CATEGORY_ROUTES,
          ),
      },
      {
        path: 'evidences',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/evidences/evidences.routes').then((m) => m.EVIDENCE_ROUTES),
      },
      {
        path: 'interested-parties',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/interested-parties/interested-parties.routes').then(
            (m) => m.INTERESTED_PARTY_ROUTES,
          ),
      },
      {
        path: 'pending-users',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/pending-users/pending-users.routes').then((m) => m.PENDING_USER_ROUTES),
      },
      {
        path: 'reports',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/reports/reports.routes').then((m) => m.REPORT_ROUTES),
      },

      // ── All roles ───────────────────────────────────────────────────────
      {
        path: 'annotations',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/annotations/annotations.routes').then((m) => m.ANNOTATION_ROUTES),
      },
      {
        path: 'map',
        canActivate: [roleGuard(['admin', 'official'])],
        loadChildren: () => import('./pages/map/map.routes').then((m) => m.MAP_ROUTES),
      },

      // ── Citizen only ────────────────────────────────────────────────────
      {
        path: 'votes',
        canActivate: [roleGuard(['citizen'])],
        loadChildren: () => import('./pages/votes/votes.routes').then((m) => m.VOTE_ROUTES),
      },

      // ── Admin + Official ────────────────────────────────────────────────
      {
        path: 'tracking',
        canActivate: [roleGuard(['admin', 'official'])],
        loadChildren: () =>
          import('./pages/tracking/tracking.routes').then((m) => m.TRACKING_ROUTES),
      },

      // ── Dev/Design ──────────────────────────────────────────────────────
      {
        path: 'ui-kit',
        canActivate: [roleGuard(['admin'])],
        loadChildren: () =>
          import('./pages/ui-components/ui-showcase.routes').then((m) => m.UI_SHOWCASE_ROUTES),
      },

      // ── Role-aware default redirect ─────────────────────────────────────
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/home/home').then((m) => m.Home),
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
