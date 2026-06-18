import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

const ROLE_LANDING: Record<string, string> = {
  admin: '/entities',
  official: '/annotations',
  citizen: '/annotations',
};

/** Redirects immediately to the role-appropriate landing page. */
@Component({
  selector: 'app-home',
  template: '',
})
export class Home {
  constructor() {
    const auth = inject(AuthService);
    const router = inject(Router);
    const role = auth.role();
    void router.navigateByUrl(ROLE_LANDING[role ?? ''] ?? '/annotations', { replaceUrl: true });
  }
}
