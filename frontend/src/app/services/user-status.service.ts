import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { API_URL } from '../config/api.config';

@Injectable({
  providedIn: 'root',
})
export class UserStatusService {
  private readonly storageKey = 'fordago_active_status';
  private activeStatusSubject: BehaviorSubject<boolean>;
  public activeStatus$: Observable<boolean>;
  private http = inject(HttpClient);

  constructor() {
    const saved = localStorage.getItem(this.storageKey);
    const initialStatus = saved === null ? true : saved !== 'false';
    this.activeStatusSubject = new BehaviorSubject<boolean>(initialStatus);
    this.activeStatus$ = this.activeStatusSubject.asObservable();
  }

  /** Current active/online status boolean */
  public get isActive(): boolean {
    return this.activeStatusSubject.value;
  }

  /** Set active/online status (true = active, false = offline) */
  public setActiveStatus(isActive: boolean): void {
    localStorage.setItem(this.storageKey, String(isActive));
    this.activeStatusSubject.next(isActive);

    // Sync with backend profile asynchronously
    try {
      this.http.put(`${API_URL}/users/profile`, { active_status: isActive }).subscribe({
        error: () => {
          // Non-fatal if backend profile sync is offline
        }
      });
    } catch {
      // ignore
    }
  }

  /** Toggle between active and offline */
  public toggleActiveStatus(): boolean {
    const next = !this.isActive;
    this.setActiveStatus(next);
    return next;
  }
}
