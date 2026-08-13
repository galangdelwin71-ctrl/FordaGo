import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';

export interface UserProfile {
  id?: number;
  username: string;
  email: string;
  phone?: string;
  gender?: string;
  profile_image?: string;
  role?: string;
  membership_type?: string;
  membership_status?: string;
  membership_expiry?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private apiUrl = `${API_BASE_URL}/users`;
  private profileSubject = new BehaviorSubject<UserProfile | null>(null);
  public profile$ = this.profileSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadProfile();
  }

  loadProfile(): void {
    this.http.get<UserProfile>(`${this.apiUrl}/me`).pipe(
      tap(profile => this.profileSubject.next(profile)),
      catchError(() => {
        this.profileSubject.next(null);
        return throwError(() => new Error('Failed to load profile'));
      })
    ).subscribe();
  }

  getProfile(): UserProfile | null {
    return this.profileSubject.value;
  }

  updateProfile(userId: number, data: Partial<UserProfile>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${userId}`, data).pipe(
      tap(() => {
        const current = this.profileSubject.value;
        if (current) {
          this.profileSubject.next({ ...current, ...data });
        }
      }),
      catchError(err => this.handleError(err))
    );
  }

  private handleError(err: HttpErrorResponse) {
    let message: string;
    if (err.status === 0) {
      message = 'Cannot reach the server.';
    } else if (err.status === 404) {
      message = 'Profile not found.';
    } else {
      message = err.error?.message || 'Error updating profile';
    }
    return throwError(() => ({ error: { message }, status: err.status }));
  }
}