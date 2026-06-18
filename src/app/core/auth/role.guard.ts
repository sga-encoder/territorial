import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../../models/user-role.model';
import { LOGIN_PATH } from './auth.guard';
import { AuthService } from './auth.service';

/**
 * Restricts a route to the given roles (spec.md §4). Compose after `authGuard`:
 * `canActivate: [authGuard, roleGuard(['admin'])]`.
 */
export const roleGuard =
  (allowedRoles: readonly UserRole[]): CanActivateFn =>
  async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    await authService.whenReady();
    if (!authService.isLoggedIn()) {
      return router.createUrlTree([LOGIN_PATH]);
    }
    const currentRole = authService.role();
    // TODO(CU-07 alt 4a): a logged-in user without role must complete their profile.
    if (currentRole !== null && allowedRoles.includes(currentRole)) {
      return true;
    }
    // Logged in but wrong role → send to their own landing instead of looping.
    return router.createUrlTree(['']);
  };
