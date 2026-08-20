import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { API_BASE_URL, API_URL } from '../config/api.config';
import { clearCachedData } from '../utils/local-cache.util';
import { CACHE_KEYS } from '../utils/cache-keys';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${API_URL}/auth`;
  private userSubject = new BehaviorSubject<any>(null);
  user$ = this.userSubject.asObservable();

  constructor(private http: HttpClient) {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user && user.id) {
          this.userSubject.next(user);
        }
      }
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }

  register(firstName: string, lastName: string, email: string, password: string, phone = '', gender = '', membership_type = 'premium', payment_method = 'cash') {
    return this.http.post<any>(`${this.apiUrl}/register`, {
      firstName, lastName, email, password, phone, gender, membership_type, payment_method
    }).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/login`, { email, password }).pipe(
      tap(res => {
        if (res && res.token && res.user) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('user', JSON.stringify(res.user));
          this.userSubject.next(res.user);
        }
      }),
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.userSubject.next(null);
    // Stage 3 local-first caches (see utils/local-cache.util.ts) are keyed
    // per cache-slot, not per-user -- clear them on logout so a different
    // member logging in on the same device never briefly sees the previous
    // member's last-cached product/equipment list before the real fetch
    // completes. Fire-and-forget; see clearCachedData()'s own doc-comment.
    void clearCachedData(CACHE_KEYS.PRODUCTS);
    void clearCachedData(CACHE_KEYS.EQUIPMENT);
  }

  get token() {
    return localStorage.getItem('token');
  }

  get user() {
    return this.userSubject.value;
  }

  isAdmin() {
    return this.user && this.user.role === 'admin';
  }

  isSuperAdmin() {
    return this.user?.role === 'super_admin';
  }

  isEmployee() {
    return this.user?.role === 'employee';
  }

  hasAdminAccess() {
    return ['admin', 'super_admin', 'employee'].includes(this.user?.role);
  }

  /**
   * True only for accounts with an actual coach_profiles row (see
   * AdminCoachController) — coach accounts deliberately keep role='user',
   * so this can never be derived from `role`. Backed by `has_coach_profile`
   * on the stored user object, set by AuthController::login()/UserController
   * ::me() (see docs/COACH_DASHBOARD_PLAN.md §3.1).
   */
  isCoachAccount(): boolean {
    return !!this.user?.has_coach_profile;
  }

  updateCurrentUser(patch: Record<string, any>) {
    const current = this.userSubject.value;
    if (!current) return;
    const nextUser = { ...current, ...patch };
    localStorage.setItem('user', JSON.stringify(nextUser));
    this.userSubject.next(nextUser);
  }

  forgotPasswordLookup(identifier: string) {
    return this.http.post<any>(`${this.apiUrl}/forgot-password/lookup`, { identifier }).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  forgotPasswordSend(identifier: string, channel: 'email' | 'sms') {
    return this.http.post<any>(`${this.apiUrl}/forgot-password/send`, { identifier, channel }).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  forgotPasswordVerify(identifier: string, code: string) {
    return this.http.post<any>(`${this.apiUrl}/forgot-password/verify`, { identifier, code }).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  forgotPasswordReset(resetToken: string, newPassword: string) {
    return this.http.post<any>(`${this.apiUrl}/forgot-password/reset`, { resetToken, newPassword }).pipe(
      catchError((err: HttpErrorResponse) => this.handleError(err))
    );
  }

  private handleError(err: HttpErrorResponse) {
    let message: string;
    if (err.status === 0) {
      // networkErrorInterceptor (see services/network-error.interceptor.ts)
      // already rewrote err.error.message with an accurate description --
      // this is just a safety-net fallback in case that ever changes.
      message = err.error?.message || `Cannot reach the server at ${API_BASE_URL}.`;
    } else if (err.status === 401) {
      message = err.error?.message || 'Invalid email or password.';
    } else if (err.status === 409) {
      message = err.error?.message || 'Account already exists.';
    } else if (err.status >= 500) {
      message = 'Server error. Please try again later.';
    } else {
      message = err.error?.message || `Error: ${err.statusText || 'Unknown error'}`;
    }
    return throwError(() => ({ error: { message }, status: err.status }));
  }
}