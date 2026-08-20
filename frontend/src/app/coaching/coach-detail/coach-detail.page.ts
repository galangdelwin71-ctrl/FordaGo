import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  chatbubbleEllipsesOutline,
  cashOutline,
  checkmarkCircle,
  star,
  ribbonOutline,
  fitnessOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { CoachingService, Coach } from '../../services/coaching.service';

@Component({
  selector: 'app-coach-detail',
  templateUrl: './coach-detail.page.html',
  styleUrls: ['./coach-detail.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonIcon,
    IonSpinner,
  ],
})
export class CoachDetailPage implements OnInit {
  coachId!: number;
  coach: Coach | null = null;
  isLoading = true;
  isStartingChat = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private coachingService: CoachingService,
  ) {
    addIcons({
      arrowBackOutline,
      chatbubbleEllipsesOutline,
      cashOutline,
      checkmarkCircle,
      star,
      ribbonOutline,
      fitnessOutline,
      shieldCheckmarkOutline,
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.coachId = parseInt(idParam, 10);
      this.loadCoachDetails();
    } else {
      this.goBack();
    }
  }

  loadCoachDetails() {
    this.isLoading = true;
    this.coachingService.getCoach(this.coachId).subscribe({
      next: (res) => {
        this.coach = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load coach details', err);
        this.isLoading = false;
      },
    });
  }

  startChat() {
    if (!this.coach || this.isStartingChat) return;
    this.isStartingChat = true;

    this.coachingService.startConversation({ target_user_id: this.coach.user_id || this.coach.id }).subscribe({
      next: (convo) => {
        this.isStartingChat = false;
        if (convo && convo.id) {
          this.router.navigate(['/chat', convo.id]);
        }
      },
      error: (err) => {
        this.isStartingChat = false;
        console.error('Failed to start chat', err);
      },
    });
  }

  /**
   * Returns to the coaching panel's Explore tab (where this coach profile
   * was opened from -- see CoachingPanelComponent.viewCoach(), the only
   * place that routes here) instead of a hardcoded navigate to '/coaching'.
   * That hardcoded navigate landed on CoachingPage with the panel already
   * closed (viewCoach() unmounts it via the `navigated` output before
   * pushing this route), so the member saw the generic "Ready to Level
   * Up?" landing card instead of going back to the coach they were just
   * looking at. Mirrors ChatPage.goBack(): just walk back one real
   * history entry with Location so we land on whatever host page actually
   * preceded this page.
   *
   * Deliberately does NOT call requestReopen() itself -- viewCoach() (the
   * only entry point into this page) already recorded the correct
   * (tab, hostPage) pair via CoachingNavService.requestReopen() right
   * before pushing this route. Re-calling requestReopen('explore') here
   * with no hostPage would overwrite that correct pair with an incomplete
   * one, breaking delivery to whichever page (Dashboard/Schedule/Coaching)
   * the member actually came from -- see coaching-nav.service.ts.
   */
  goBack() {
    this.location.back();
  }
}
