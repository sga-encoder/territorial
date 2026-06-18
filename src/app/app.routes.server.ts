import { RenderMode, ServerRoute } from '@angular/ssr';

// SSR for everything: the app serves live backend data and has parameterized
// routes (e.g. /entities/:id/edit), so prerendering does not apply.
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
