import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { API_URL } from '../config/api.config';

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  done?: boolean;
}

export interface WorkoutSession {
  id?: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  coach?: string;
  exercises?: Exercise[];
  status?: 'upcoming' | 'completed' | 'cancelled';
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private apiUrl = `${API_URL}/schedule`;
  private sessionsSubject = new BehaviorSubject<WorkoutSession[]>([]);
  public sessions$ = this.sessionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSessions();
  }

  loadSessions(): void {
    this.http.get<WorkoutSession[]>(this.apiUrl).pipe(
      tap(sessions => this.sessionsSubject.next(sessions)),
      catchError(err => {
        console.error('Failed to load sessions:', err);
        return throwError(() => new Error('Failed to load sessions'));
      })
    ).subscribe();
  }

  getSessions(): WorkoutSession[] {
    return this.sessionsSubject.value;
  }

  createSession(data: WorkoutSession): Observable<WorkoutSession> {
    return this.http.post<WorkoutSession>(this.apiUrl, data).pipe(
      tap(session => {
        const current = this.sessionsSubject.value;
        this.sessionsSubject.next([...current, session]);
      }),
      catchError(err => this.handleError(err))
    );
  }

  updateSession(id: string | number, data: Partial<WorkoutSession>): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => {
        const current = this.sessionsSubject.value;
        const updated = current.map(s => s.id === id ? { ...s, ...data } : s);
        this.sessionsSubject.next(updated);
      }),
      catchError(err => this.handleError(err))
    );
  }

  deleteSession(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const current = this.sessionsSubject.value;
        this.sessionsSubject.next(current.filter(s => s.id !== id));
      }),
      catchError(err => this.handleError(err))
    );
  }

  private handleError(err: HttpErrorResponse) {
    let message: string;
    if (err.status === 0) {
      // See network-error.interceptor.ts for the actual message text.
      message = err.error?.message || 'Cannot reach the server.';
    } else {
      message = err.error?.message || 'Error with schedule operation';
    }
    return throwError(() => ({ error: { message }, status: err.status }));
  }
}