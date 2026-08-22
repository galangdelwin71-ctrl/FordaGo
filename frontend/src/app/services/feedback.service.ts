import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { API_URL, FACEBOOK_PAGE_URL } from '../config/api.config';
import { AuthService } from './auth.service';

export interface FeedbackStatusResponse {
  hasSubmitted: boolean;
  daysActive: number;
  isEligible: boolean;
  createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly apiUrl = `${API_URL}/feedback`;

  private ratingModalSubject = new BehaviorSubject<boolean>(false);
  ratingModalOpen$ = this.ratingModalSubject.asObservable();

  private successModalSubject = new BehaviorSubject<boolean>(false);
  successModalOpen$ = this.successModalSubject.asObservable();

  private supportModalSubject = new BehaviorSubject<boolean>(false);
  supportModalOpen$ = this.supportModalSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  /**
   * Check if the user is eligible for the 3-day rating popup.
   * Eligible if:
   * 1. User is logged in and not an admin/super_admin/employee/coach.
   * 2. Has not submitted feedback yet.
   * 3. Has not dismissed the popup within the last 24 hours.
   * 4. Account created_at (or first tracked usage) was at least 3 days (72 hours) ago.
   */
  checkAndPromptRating(): void {
    const user = this.auth.user;
    if (!user || !user.id || this.auth.hasAdminAccess()) {
      return;
    }

    const userId = user.id;
    const submittedLocal = localStorage.getItem(`fordago_feedback_submitted_${userId}`);
    if (submittedLocal === 'true') {
      return;
    }

    const dismissedAt = localStorage.getItem(`fordago_feedback_dismissed_at_${userId}`);
    if (dismissedAt) {
      const msSinceDismissed = Date.now() - parseInt(dismissedAt, 10);
      // Wait at least 24 hours before re-prompting if dismissed
      if (msSinceDismissed < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Ensure we track the first active date if created_at is not present
    let firstActiveAt = user.created_at ? new Date(user.created_at).getTime() : null;
    const storedFirstActive = localStorage.getItem(`fordago_first_active_${userId}`);
    if (!firstActiveAt && storedFirstActive) {
      firstActiveAt = parseInt(storedFirstActive, 10);
    } else if (!firstActiveAt) {
      firstActiveAt = Date.now();
      localStorage.setItem(`fordago_first_active_${userId}`, String(firstActiveAt));
    }

    const daysUsed = (Date.now() - firstActiveAt) / (1000 * 60 * 60 * 24);

    if (daysUsed >= 3) {
      // Also query backend status to double check if already submitted in DB
      this.http.get<FeedbackStatusResponse>(`${this.apiUrl}/status`).pipe(
        catchError(() => of({ hasSubmitted: false, isEligible: true, daysActive: Math.floor(daysUsed) } as FeedbackStatusResponse))
      ).subscribe((res) => {
        if (res.hasSubmitted) {
          localStorage.setItem(`fordago_feedback_submitted_${userId}`, 'true');
        } else {
          // Open the rating popup with a short, smooth delay
          setTimeout(() => {
            this.openRatingModal();
          }, 1500);
        }
      });
    }
  }

  submitFeedback(rating: number, reason?: string): Observable<any> {
    const user = this.auth.user;
    const userId = user?.id;

    return this.http.post<any>(this.apiUrl, { rating, reason }).pipe(
      tap(() => {
        if (userId) {
          localStorage.setItem(`fordago_feedback_submitted_${userId}`, 'true');
        }
        this.closeRatingModal();
        this.openSuccessModal();
      })
    );
  }

  dismissRating(): void {
    const user = this.auth.user;
    if (user?.id) {
      localStorage.setItem(`fordago_feedback_dismissed_at_${user.id}`, String(Date.now()));
    }
    this.closeRatingModal();
  }

  openFacebookPage(): void {
    const targetUrl = FACEBOOK_PAGE_URL;
    try {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch {
      window.location.href = targetUrl;
    }
  }

  openRatingModal(): void {
    this.ratingModalSubject.next(true);
  }

  closeRatingModal(): void {
    this.ratingModalSubject.next(false);
  }

  openSuccessModal(): void {
    this.successModalSubject.next(true);
  }

  closeSuccessModal(): void {
    this.successModalSubject.next(false);
  }

  openSupportModal(): void {
    this.supportModalSubject.next(true);
  }

  closeSupportModal(): void {
    this.supportModalSubject.next(false);
  }
}
