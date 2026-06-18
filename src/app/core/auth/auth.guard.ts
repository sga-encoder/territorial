import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

/** TODO(CU-07): point to the real login route once the auth feature is implemented. */
export const LOGIN_PATH = '/login';

/** Blocks navigation for anonymous users (spec.md §4). */
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  await authService.whenReady();
  return authService.isLoggedIn() ? true : router.createUrlTree([LOGIN_PATH]);
};
