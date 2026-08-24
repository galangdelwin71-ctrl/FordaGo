import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../config/api.config';

/**
 * Normalizes "the request never reached the server" failures (status 0 --
 * DNS failure, connection refused, request timed out, blocked by the
 * device/network, or a TLS handshake error) into ONE consistent, accurate
 * message before any service-level catchError sees it.
 *
 * Centralized here so every service's `err.status === 0` branch can just
 * read `err.error?.message` instead of duplicating (and drifting out of
 * sync with) this string -- see auth.service.ts, inventory.service.ts,
 * profile.service.ts, schedule.service.ts, which each used to hardcode
 * their own copy.
 *
 * IMPORTANT: this message deliberately does NOT mention `adb reverse`.
 * adb reverse only matters when the frontend points at
 * `127.0.0.1`/`localhost` and relies on USB port forwarding from a
 * connected device. API_BASE_URL is currently a public HTTPS tunnel (see
 * api.config.ts) that any device with internet access can reach directly
 * -- so telling the user to check adb reverse here was actively
 * misleading and sent debugging in the wrong direction.
 */
export const networkErrorInterceptor: HttpInterceptorFn = (req, next) => {
  // Only rewrite failures for calls to our own API -- leave errors from
  // any other host (e.g. a future third-party integration) untouched.
  if (!req.url.startsWith(API_BASE_URL)) {
    return next(req);
  }

  return next(req).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 0) {
        return throwError(() => new HttpErrorResponse({
          error: {
            message:
              `Cannot connect to server. Please check your connection and ensure the backend server is running.`,
          },
          status: 0,
          statusText: err.statusText,
          url: err.url ?? undefined,
        }));
      }
      return throwError(() => err);
    }),
  );
};
