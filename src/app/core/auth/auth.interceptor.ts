import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/** Attaches the Firebase ID token to every backend request (spec.md §4). */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const idToken = inject(AuthService).idToken();
  const isBackendRequest = request.url.startsWith(environment.baseUrl);
  if (idToken === null || !isBackendRequest) {
    return next(request);
  }
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${idToken}` } }));
};
