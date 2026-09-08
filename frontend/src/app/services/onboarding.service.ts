import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface TourStep {
  targetId: string;
  title: string;
  description: string;
  icon?: string;
  position?: 'top' | 'bottom' | 'center' | 'auto';
  scrollIntoView?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  private activeTourSubject = new BehaviorSubject<TourStep[] | null>(null);
  activeTour$ = this.activeTourSubject.asObservable();

  private currentStepIndexSubject = new BehaviorSubject<number>(0);
  currentStepIndex$ = this.currentStepIndexSubject.asObservable();

  private isVisibleSubject = new BehaviorSubject<boolean>(false);
  isVisible$ = this.isVisibleSubject.asObservable();

  private currentTourId: string | null = null;
  private currentTourUserId: string | number | null = null;
  private tourKeyPrefix = 'fordago_tour_completed_';

  private readonly allKnownTours = [
    'dashboard_main',
    'schedule_main',
    'schedule_add_modal',
    'schedule_week_plan_modal',
    'scanner_main',
    'shop_main',
    'equipment_main',
    'profile_main',
    'coach_studio_main',
    'coaching_member_main',
    'chat_main',
  ];

  constructor() {
    this.cleanupLegacyUnscopedKeys();
  }

  get isRunning(): boolean {
    return this.isVisibleSubject.value;
  }

  get currentStepIndex(): number {
    return this.currentStepIndexSubject.value;
  }

  get totalSteps(): number {
    return this.activeTourSubject.value ? this.activeTourSubject.value.length : 0;
  }

  get activeTourId(): string | null {
    return this.currentTourId;
  }

  get currentStep(): TourStep | null {
    const tour = this.activeTourSubject.value;
    if (!tour || this.currentStepIndex < 0 || this.currentStepIndex >= tour.length) {
      return null;
    }
    return tour[this.currentStepIndex];
  }

  /**
   * Checks if user has already seen the tour for a specific tour id.
   * Strictly user-scoped so a new user account is NEVER silenced by another user's activity.
   */
  hasUserSeenTour(tourId: string, userId?: string | number): boolean {
    try {
      const uId = userId || this.currentTourUserId || this.getCurrentUserId();
      if (!uId) {
        // If no user context exists, do not block the tour
        return false;
      }

      // Check if user has explicitly cancelled all guides
      if (localStorage.getItem(`${this.tourKeyPrefix}global_all_${uId}`) === 'true') {
        return true;
      }

      // Check if user has completed this specific tour
      const userKey = `${this.tourKeyPrefix}${tourId}_${uId}`;
      return localStorage.getItem(userKey) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Marks tour as completed strictly for the current user.
   */
  markTourSeen(tourId: string, userId?: string | number): void {
    try {
      const uId = userId || this.currentTourUserId || this.getCurrentUserId();
      if (uId) {
        const key = `${this.tourKeyPrefix}${tourId}_${uId}`;
        localStorage.setItem(key, 'true');
      }
    } catch {
      // Ignore storage write errors
    }
  }

  /**
   * Skips and cancels all guides across all panels permanently for the current user.
   */
  skipAllTours(userId?: string | number): void {
    try {
      const uId = userId || this.currentTourUserId || this.getCurrentUserId();
      if (uId) {
        localStorage.setItem(`${this.tourKeyPrefix}global_all_${uId}`, 'true');

        this.allKnownTours.forEach((tid) => {
          localStorage.setItem(`${this.tourKeyPrefix}${tid}_${uId}`, 'true');
        });
      }
    } catch {
      // Ignore storage write errors
    }
    this.finishTour();
  }

  /**
   * Resets a specific tour progress for the current user so they can replay it.
   */
  resetTour(tourId?: string, userId?: string | number): void {
    try {
      const uId = userId || this.currentTourUserId || this.getCurrentUserId();
      if (uId) {
        localStorage.removeItem(`${this.tourKeyPrefix}global_all_${uId}`);
        if (tourId) {
          localStorage.removeItem(`${this.tourKeyPrefix}${tourId}_${uId}`);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Resets all tours for the user so every guide will replay from the beginning.
   */
  resetAllToursForUser(userId?: string | number): void {
    try {
      const uId = userId || this.currentTourUserId || this.getCurrentUserId();
      if (uId) {
        localStorage.removeItem(`${this.tourKeyPrefix}global_all_${uId}`);
        this.allKnownTours.forEach((tid) => {
          localStorage.removeItem(`${this.tourKeyPrefix}${tid}_${uId}`);
        });
      }
      this.cleanupLegacyUnscopedKeys();
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Removes poisoned legacy un-scoped localStorage keys left by earlier app versions.
   * This ensures newly created accounts aren't falsely flagged as having completed guides.
   */
  cleanupLegacyUnscopedKeys(): void {
    try {
      localStorage.removeItem(`${this.tourKeyPrefix}global_all`);
      this.allKnownTours.forEach((tid) => {
        localStorage.removeItem(`${this.tourKeyPrefix}${tid}`);
      });

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(this.tourKeyPrefix)) continue;
        if (key === `${this.tourKeyPrefix}global_all`) {
          localStorage.removeItem(key);
          continue;
        }
        for (const tid of this.allKnownTours) {
          if (key === `${this.tourKeyPrefix}${tid}`) {
            localStorage.removeItem(key);
            break;
          }
        }
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Starts a tour with provided steps.
   */
  startTour(tourId: string, steps: TourStep[], force = false, userId?: string | number): boolean {
    const resolvedUserId = userId || this.getCurrentUserId();

    if (!force && this.hasUserSeenTour(tourId, resolvedUserId || undefined)) {
      return false;
    }

    if (!steps || steps.length === 0) {
      return false;
    }

    this.currentTourId = tourId;
    this.currentTourUserId = resolvedUserId;
    this.activeTourSubject.next(steps);
    this.currentStepIndexSubject.next(0);
    this.isVisibleSubject.next(true);
    return true;
  }

  nextStep(): void {
    const tour = this.activeTourSubject.value;
    if (!tour) return;

    if (this.currentStepIndex < tour.length - 1) {
      this.currentStepIndexSubject.next(this.currentStepIndex + 1);
    } else {
      this.finishTour();
    }
  }

  prevStep(): void {
    if (this.currentStepIndex > 0) {
      this.currentStepIndexSubject.next(this.currentStepIndex - 1);
    }
  }

  skipTour(): void {
    this.finishTour();
  }

  finishTour(): void {
    if (this.currentTourId) {
      this.markTourSeen(this.currentTourId, this.currentTourUserId || undefined);
    }
    this.isVisibleSubject.next(false);
    this.activeTourSubject.next(null);
    this.currentStepIndexSubject.next(0);
    this.currentTourId = null;
    this.currentTourUserId = null;
  }

  private getCurrentUserId(): string | number | null {
    try {
      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const user = JSON.parse(userRaw);
        return user?.id || user?.email || null;
      }
    } catch {
      return null;
    }
    return null;
  }
}
