import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonFooter,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  chatbubbleEllipsesOutline,
  chatbubblesOutline,
  searchOutline,
  star,
  cashOutline,
  barbellOutline,
  homeOutline,
  calendarOutline,
  scanOutline,
  bagHandleOutline,
  notificationsOutline,
  checkmarkCircleOutline,
  closeOutline,
  arrowForwardOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { CoachingService, Coach, Conversation } from '../services/coaching.service';
import { NotificationCenterService } from '../services/notification-center.service';
import { NotificationPanelComponent } from '../shared/notification-panel/notification-panel.component';

@Component({
  selector: 'app-coaching',
  templateUrl: './coaching.page.html',
  styleUrls: ['./coaching.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonFooter,
    IonIcon,
    IonSpinner,
    NotificationPanelComponent,
  ],
})
export class CoachingPage implements OnInit {
  activeTab: 'explore' | 'conversations' = 'explore';
  searchQuery = '';
  activeSpecialty = 'All';

  specialties: string[] = [
    'All',
    'Strength',
    'Bodybuilding',
    'Weight Loss',
    'HIIT',
    'Cardio',
    'Personal Training',
  ];

  coaches: Coach[] = [];
  conversations: Conversation[] = [];
  isLoading = true;
  isStartingChat = false;

  // Notification panel state
  notifPanelOpen = false;
  unreadNotifCount = 0;

  constructor(
    private router: Router,
    private auth: AuthService,
    private coachingService: CoachingService,
    private notifCenter: NotificationCenterService,
  ) {
    addIcons({
      personOutline,
      chatbubbleEllipsesOutline,
      chatbubblesOutline,
      searchOutline,
      star,
      cashOutline,
      barbellOutline,
      homeOutline,
      calendarOutline,
      scanOutline,
      bagHandleOutline,
      notificationsOutline,
      checkmarkCircleOutline,
      closeOutline,
      arrowForwardOutline,
      sparklesOutline,
    });
  }

  ngOnInit() {
    this.loadCoaches();
    this.loadConversations();
  }

  get user() {
    return this.auth.user;
  }

  get profileImage() {
    return this.auth.user?.profile_image || '';
  }

  get initials(): string {
    const u = this.auth.user;
    if (!u) return 'U';
    const f = (u.first_name || u.username || '').charAt(0);
    const l = (u.last_name || '').charAt(0);
    return (f + l).toUpperCase() || 'U';
  }

  loadCoaches() {
    this.isLoading = true;
    this.coachingService.getCoaches(this.searchQuery, this.activeSpecialty).subscribe({
      next: (res) => {
        this.coaches = res || [];
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load coaches', err);
        this.isLoading = false;
      },
    });
  }

  loadConversations() {
    this.coachingService.getConversations().subscribe({
      next: (res) => {
        this.conversations = res || [];
      },
      error: (err) => {
        console.error('Failed to load conversations', err);
      },
    });
  }

  onSearchChange() {
    this.loadCoaches();
  }

  selectSpecialty(spec: string) {
    this.activeSpecialty = spec;
    this.loadCoaches();
  }

  setTab(tab: 'explore' | 'conversations') {
    this.activeTab = tab;
    if (tab === 'conversations') {
      this.loadConversations();
    } else {
      this.loadCoaches();
    }
  }

  viewCoach(coach: Coach) {
    this.router.navigate(['/coach', coach.id]);
  }

  startChat(coach: Coach) {
    if (this.isStartingChat) return;
    this.isStartingChat = true;

    this.coachingService.startConversation({ target_user_id: coach.user_id || coach.id }).subscribe({
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

  openConversation(convo: Conversation) {
    this.router.navigate(['/chat', convo.id]);
  }

  // ── Navigation ───────────────────────────────────────
  goToDashboard() { this.router.navigate(['/dashboard']); }
  goToSchedule() { this.router.navigate(['/schedule']); }
  goToQr() { this.router.navigate(['/qr-scanner']); }
  goToInventory() { this.router.navigate(['/inventory']); }
  goToProfile() { this.router.navigate(['/profile']); }
  goToEquipment() { this.router.navigate(['/equipment']); }

  openNotifPanel() { this.notifPanelOpen = true; }
  closeNotifPanel() { this.notifPanelOpen = false; }
  onUnreadCountChange(count: number) { this.unreadNotifCount = count; }
}
