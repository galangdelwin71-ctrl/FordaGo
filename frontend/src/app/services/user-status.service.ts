import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserStatusService {
  private readonly storageKey = 'fordago_active_status';
  private activeStatusSubject: BehaviorSubject<boolean>;
  public activeStatus$: Observable<boolean>;

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
  }

  /** Toggle between active and offline */
  public toggleActiveStatus(): boolean {
    const next = !this.isActive;
    this.setActiveStatus(next);
    return next;
  }
}
