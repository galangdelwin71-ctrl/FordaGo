import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

/**
 * Attaches `Authorization: Bearer <token>` to every outgoing request when a
 * token is present. Every backend route except /auth/* requires
 * auth:sanctum (bearer-token auth, not session cookies — see
 * User::HasApiTokens), so without this every authenticated request would
 * fail with 401 Unauthenticated.
 *
 * (Was previously a class implementing HttpInterceptor, but that class was
 * never registered via HTTP_INTERCEPTORS and had no effect — converted to
 * a functional interceptor so it can be registered the same way as
 * ngrokInterceptor in main.ts's withInterceptors([...]).)
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token;

  if (!token) {
    return next(req);
  }

  return next(req.clone({
    setHeaders: { Authorization: `Bearer ${token}` },
  }));
};
