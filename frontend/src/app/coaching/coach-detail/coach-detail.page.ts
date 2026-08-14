import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  goBack() {
    this.router.navigate(['/coaching']);
  }
}
