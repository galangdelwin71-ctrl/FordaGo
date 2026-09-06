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
  private tourKeyPrefix = 'fordago_tour_completed_';

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
   */
  hasUserSeenTour(tourId: string, userId?: string | number): boolean {
    try {
      if (localStorage.getItem(`${this.tourKeyPrefix}global_all`) === 'true') {
        return true;
      }
      const uId = userId || this.getCurrentUserId() || 'guest';
      if (localStorage.getItem(`${this.tourKeyPrefix}global_all_${uId}`) === 'true') {
        return true;
      }
      const key = `${this.tourKeyPrefix}${tourId}_${uId}`;
      return (
        localStorage.getItem(key) === 'true' ||
        localStorage.getItem(`${this.tourKeyPrefix}${tourId}`) === 'true'
      );
    } catch {
      return false;
    }
  }

  /**
   * Marks tour as completed for user.
   */
  markTourSeen(tourId: string, userId?: string | number): void {
    try {
      const uId = userId || this.getCurrentUserId() || 'guest';
      const key = `${this.tourKeyPrefix}${tourId}_${uId}`;
      localStorage.setItem(key, 'true');
      localStorage.setItem(`${this.tourKeyPrefix}${tourId}`, 'true');
    } catch {
      // Ignore storage write errors
    }
  }

  /**
   * Skips and cancels all guides across all panels permanently for the user.
   */
  skipAllTours(userId?: string | number): void {
    try {
      localStorage.setItem(`${this.tourKeyPrefix}global_all`, 'true');
      const uId = userId || this.getCurrentUserId() || 'guest';
      localStorage.setItem(`${this.tourKeyPrefix}global_all_${uId}`, 'true');

      const allKnownTours = [
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
      allKnownTours.forEach((tid) => {
        localStorage.setItem(`${this.tourKeyPrefix}${tid}_${uId}`, 'true');
        localStorage.setItem(`${this.tourKeyPrefix}${tid}`, 'true');
      });
    } catch {
      // Ignore storage write errors
    }
    this.finishTour();
  }

  /**
   * Resets tour progress so user can replay the tutorial.
   */
  resetTour(tourId?: string, userId?: string | number): void {
    try {
      localStorage.removeItem(`${this.tourKeyPrefix}global_all`);
      const uId = userId || this.getCurrentUserId() || 'guest';
      localStorage.removeItem(`${this.tourKeyPrefix}global_all_${uId}`);
      if (tourId) {
        localStorage.removeItem(`${this.tourKeyPrefix}${tourId}_${uId}`);
        localStorage.removeItem(`${this.tourKeyPrefix}${tourId}`);
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Starts a tour with provided steps.
   */
  startTour(tourId: string, steps: TourStep[], force = false, userId?: string | number): boolean {
    if (!force && this.hasUserSeenTour(tourId, userId)) {
      return false;
    }

    if (!steps || steps.length === 0) {
      return false;
    }

    this.currentTourId = tourId;
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
      this.markTourSeen(this.currentTourId);
    }
    this.isVisibleSubject.next(false);
    this.activeTourSubject.next(null);
    this.currentStepIndexSubject.next(0);
    this.currentTourId = null;
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
