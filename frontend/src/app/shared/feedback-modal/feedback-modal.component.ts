import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { FeedbackService } from '../../services/feedback.service';

@Component({
  selector: 'app-feedback-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  templateUrl: './feedback-modal.component.html',
  styleUrls: ['./feedback-modal.component.scss'],
})
export class FeedbackModalComponent implements OnInit, OnDestroy {
  isRatingOpen = false;
  isSuccessOpen = false;
  isSupportOpen = false;

  selectedScore: number | null = null;
  reasonText: string = '';
  isSubmitting: boolean = false;
  errorMessage: string = '';

  readonly scoresRow1 = [0, 1, 2, 3, 4, 5];
  readonly scoresRow2 = [6, 7, 8, 9, 10];

  private subs = new Subscription();

  constructor(public feedbackService: FeedbackService) {}

  ngOnInit(): void {
    this.subs.add(
      this.feedbackService.ratingModalOpen$.subscribe((isOpen) => {
        this.isRatingOpen = isOpen;
        if (isOpen) {
          this.errorMessage = '';
        }
      })
    );

    this.subs.add(
      this.feedbackService.successModalOpen$.subscribe((isOpen) => {
        this.isSuccessOpen = isOpen;
      })
    );

    this.subs.add(
      this.feedbackService.supportModalOpen$.subscribe((isOpen) => {
        this.isSupportOpen = isOpen;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  selectScore(score: number): void {
    this.selectedScore = score;
    this.errorMessage = '';
  }

  submitRating(): void {
    if (this.selectedScore === null) {
      this.errorMessage = 'Please select a rating score from 0 to 10.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    this.feedbackService.submitFeedback(this.selectedScore, this.reasonText).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.selectedScore = null;
        this.reasonText = '';
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = err?.error?.message || 'Failed to submit feedback. Please try again.';
      },
    });
  }

  closeRating(): void {
    this.feedbackService.dismissRating();
  }

  closeSuccess(): void {
    this.feedbackService.closeSuccessModal();
  }

  closeSupport(): void {
    this.feedbackService.closeSupportModal();
  }

  openFacebook(): void {
    this.feedbackService.openFacebookPage();
  }

  openRatingFromSupport(): void {
    this.feedbackService.closeSupportModal();
    this.feedbackService.openRatingModal();
  }
}
