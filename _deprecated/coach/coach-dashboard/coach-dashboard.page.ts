// coach-dashboard.page.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonModal,
  IonSpinner,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  settingsOutline,
  peopleOutline,
  calendarOutline,
  mailUnreadOutline,
  cashOutline,
  addCircleOutline,
  timeOutline,
  clipboardOutline,
  personOutline,
  gridOutline,
  scanOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  chevronForwardOutline,
  addOutline,
  trashOutline,
  closeOutline,
  barbellOutline,
  starOutline,
  star,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NoNegativeDirective } from '../../directives/no-negative.directive';
import { HeaderComponent } from '../../shared/header/header.component';
import { NotificationPanelComponent } from '../../shared/notification-panel/notification-panel.component';
import {
  CoachingService,
  CoachProfileMe,
  CoachDashboardStats,
  CoachClientItem,
  CoachRequestItem,
  Conversation,
  CoachAvailabilitySlot,
  CoachProgram,
  CoachProgramItemPayload,
  WorkoutPlanProposal,
} from '../../services/coaching.service';

interface TodaySessionView {
  proposalId: number;
  clientName: string;
  clientAvatar?: string;
  timeLabel: string;
  focus: string;
  location?: string;
}

type DashboardTab = 'clients' | 'requests' | 'messages';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-coach-dashboard',
  templateUrl: './coach-dashboard.page.html',
  styleUrls: ['./coach-dashboard.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonFooter,
    IonIcon,
    IonModal,
    IonSpinner,
    NoNegativeDirective,
    HeaderComponent,
    NotificationPanelComponent,
  ],
})
export class CoachDashboardPage implements OnInit, OnDestroy {
  private sub = new Subscription();

  // ── Header state ─────────────────────────────────────────
  profileImage = '';
  initials = 'U';
  notifPanelOpen = false;
  unreadCount = 0;

  // ── Profile card ─────────────────────────────────────────
  profile: CoachProfileMe | null = null;
  isLoadingProfile = true;

  // ── Stats row ────────────────────────────────────────────
  stats: CoachDashboardStats = {
    active_clients: 0,
    sessions_today: 0,
    pending_requests: 0,
    earnings_this_month: 0,
  };
  isLoadingStats = true;

  // ── Today's Sessions ─────────────────────────────────────
  todaySessions: TodaySessionView[] = [];
  isLoadingTodaySessions = true;

  // ── Tabs ─────────────────────────────────────────────────
  activeTab: DashboardTab = 'clients';
  clients: CoachClientItem[] = [];
  requests: CoachRequestItem[] = [];
  conversations: Conversation[] = [];
  isLoadingClients = false;
  isLoadingRequests = false;
  isLoadingConversations = false;
  requestActionInFlightId: number | null = null;

  // ── Manage Profile modal ──────────────────────────────────
  profileModalOpen = false;
  profileForm = { bio: '', specialty: '', photo_url: '', rate: 0 };
  isSavingProfile = false;
  profileFormError = '';

  // ── Set Availability modal ────────────────────────────────
  availabilityModalOpen = false;
  availabilitySlots: CoachAvailabilitySlot[] = [];
  isLoadingAvailability = false;
  newSlot = { day_of_week: 1, start_time: '09:00', end_time: '17:00' };
  availabilityError = '';
  readonly dayNames = DAY_NAMES;

  // ── Create Program modal ──────────────────────────────────
  programModalOpen = false;
  programs: CoachProgram[] = [];
  isLoadingPrograms = false;
  programForm: CoachProgram = this.buildEmptyProgramForm();
  isSavingProgram = false;
  programFormError = '';

  constructor(
    private router: Router,
    private auth: AuthService,
    private coachingService: CoachingService,
  ) {
    addIcons({
      settingsOutline,
      peopleOutline,
      calendarOutline,
      mailUnreadOutline,
      cashOutline,
      addCircleOutline,
      timeOutline,
      clipboardOutline,
      personOutline,
      gridOutline,
      scanOutline,
      chatbubbleEllipsesOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      chevronForwardOutline,
      addOutline,
      trashOutline,
      closeOutline,
      barbellOutline,
      starOutline,
      star,
    });
  }

  ngOnInit(): void {
    this.applyUserContext();
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.applyUserContext();
    this.loadAll();
  }

  private applyUserContext(): void {
    const user = this.auth.user;
    const username = String(user?.username || '').trim();
    this.initials = username
      ? username.split(' ').map((part: string) => part[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
    this.profileImage = String(user?.profile_image || '').trim();
  }

  private loadAll(): void {
    this.loadProfile();
    this.loadStats();
    this.loadTodaySessions();
    this.loadActiveTabData();
  }

  // ── Profile card ─────────────────────────────────────────

  private loadProfile(): void {
    this.isLoadingProfile = true;
    this.sub.add(
      this.coachingService.getMyCoachProfile().subscribe({
        next: (res) => {
          this.profile = res;
          this.isLoadingProfile = false;
        },
        error: (err) => {
          console.error('Failed to load coach profile', err);
          this.isLoadingProfile = false;
        },
      }),
    );
  }

  // ── Stats row ────────────────────────────────────────────

  private loadStats(): void {
    this.isLoadingStats = true;
    this.sub.add(
      this.coachingService.getDashboardStats().subscribe({
        next: (res) => {
          this.stats = res;
          this.isLoadingStats = false;
        },
        error: (err) => {
          console.error('Failed to load dashboard stats', err);
          this.isLoadingStats = false;
        },
      }),
    );
  }

  // ── Today's Sessions ─────────────────────────────────────
  // No dedicated backend endpoint for "today's accepted sessions with
  // client names" exists yet, but GET /proposals?status=accepted already
  // returns everything needed (client, time, items) for both roles the
  // caller plays in each proposal — filtered here to the ones where this
  // account is the coach and the session is today. Real data, zero new
  // backend surface.

  private loadTodaySessions(): void {
    this.isLoadingTodaySessions = true;
    const myId = this.auth.user?.id;
    const todayKey = this.todayDateKey();

    this.sub.add(
      this.coachingService.getProposals('accepted').subscribe({
        next: (res) => {
          const list = (res || [])
            .filter((p: WorkoutPlanProposal) => (myId ? Number(p.coach_id) === Number(myId) : true))
            .filter((p: WorkoutPlanProposal) => this.toDateKey(p.session_date) === todayKey)
            .sort((a, b) => this.compareTimeAsc(a, b));

          this.todaySessions = list.map((p) => this.mapProposalToTodaySession(p));
          this.isLoadingTodaySessions = false;
        },
        error: (err) => {
          console.error('Failed to load today\u2019s sessions', err);
          this.isLoadingTodaySessions = false;
        },
      }),
    );
  }

  private mapProposalToTodaySession(p: WorkoutPlanProposal): TodaySessionView {
    const client = p.client;
    const clientName = client
      ? (`${client.first_name || ''} ${client.last_name || ''}`.trim() || client.username)
      : 'Client';
    const focus = p.items?.length ? p.items.map((i) => i.name).slice(0, 2).join(', ') : 'Workout session';

    return {
      proposalId: p.id,
      clientName,
      clientAvatar: client?.profile_image,
      timeLabel: `${p.time_val} ${p.time_ampm}`,
      focus,
      location: p.location,
    };
  }

  private todayDateKey(): string {
    return this.toDateKey(new Date().toISOString());
  }

  private toDateKey(value: string): string {
    // session_date comes back as 'YYYY-MM-DD' or an ISO timestamp — either
    // way the first 10 chars are the date key we need for same-day matching.
    return String(value).slice(0, 10);
  }

  private compareTimeAsc(a: WorkoutPlanProposal, b: WorkoutPlanProposal): number {
    return this.to24Minutes(a.time_val, a.time_ampm) - this.to24Minutes(b.time_val, b.time_ampm);
  }

  private to24Minutes(timeVal: string, ampm: string): number {
    const [hRaw, mRaw] = String(timeVal || '0:0').split(':').map((n) => parseInt(n, 10) || 0);
    let h = hRaw;
    if (ampm?.toUpperCase() === 'PM' && h !== 12) h += 12;
    if (ampm?.toUpperCase() === 'AM' && h === 12) h = 0;
    return h * 60 + mRaw;
  }

  // ── Tabs ─────────────────────────────────────────────────

  setTab(tab: DashboardTab): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.loadActiveTabData();
  }

  private loadActiveTabData(): void {
    if (this.activeTab === 'clients') this.loadClients();
    else if (this.activeTab === 'requests') this.loadRequests();
    else this.loadConversations();
  }

  private loadClients(): void {
    this.isLoadingClients = true;
    this.sub.add(
      this.coachingService.getCoachClients().subscribe({
        next: (res) => {
          this.clients = res || [];
          this.isLoadingClients = false;
        },
        error: (err) => {
          console.error('Failed to load clients', err);
          this.isLoadingClients = false;
        },
      }),
    );
  }

  private loadRequests(): void {
    this.isLoadingRequests = true;
    this.sub.add(
      this.coachingService.getCoachRequests().subscribe({
        next: (res) => {
          this.requests = res || [];
          this.isLoadingRequests = false;
        },
        error: (err) => {
          console.error('Failed to load requests', err);
          this.isLoadingRequests = false;
        },
      }),
    );
  }

  private loadConversations(): void {
    this.isLoadingConversations = true;
    this.sub.add(
      this.coachingService.getConversations().subscribe({
        next: (res) => {
          // Coach-side conversations list already includes both roles this
          // account could play, but on the Coach Dashboard we only ever
          // show threads where this account IS the coach, and only once
          // they're past the pending gate (pending ones live in Requests).
          this.conversations = (res || []).filter((c) => c.is_coach && c.status !== 'pending');
          this.isLoadingConversations = false;
        },
        error: (err) => {
          console.error('Failed to load conversations', err);
          this.isLoadingConversations = false;
        },
      }),
    );
  }

  acceptRequest(item: CoachRequestItem): void {
    if (this.requestActionInFlightId) return;
    this.requestActionInFlightId = item.conversation_id;
    this.sub.add(
      this.coachingService.acceptConversation(item.conversation_id).subscribe({
        next: () => {
          this.requestActionInFlightId = null;
          this.requests = this.requests.filter((r) => r.conversation_id !== item.conversation_id);
          this.loadStats();
        },
        error: (err) => {
          console.error('Failed to accept request', err);
          this.requestActionInFlightId = null;
        },
      }),
    );
  }

  declineRequest(item: CoachRequestItem): void {
    if (this.requestActionInFlightId) return;
    this.requestActionInFlightId = item.conversation_id;
    this.sub.add(
      this.coachingService.declineConversation(item.conversation_id).subscribe({
        next: () => {
          this.requestActionInFlightId = null;
          this.requests = this.requests.filter((r) => r.conversation_id !== item.conversation_id);
          this.loadStats();
        },
        error: (err) => {
          console.error('Failed to decline request', err);
          this.requestActionInFlightId = null;
        },
      }),
    );
  }

  openClientChat(conversationId: number): void {
    this.router.navigate(['/chat', conversationId]);
  }

  // ── Manage Profile modal ──────────────────────────────────

  openProfileModal(): void {
    this.profileFormError = '';
    this.profileForm = {
      bio: this.profile?.bio || '',
      specialty: this.profile?.specialty || '',
      photo_url: this.profile?.profile_image || '',
      rate: this.profile?.rate || 0,
    };
    this.profileModalOpen = true;
  }

  closeProfileModal(): void {
    this.profileModalOpen = false;
  }

  saveProfile(): void {
    this.profileFormError = '';
    if (this.profileForm.rate < 0) {
      this.profileFormError = 'Rate must be a non-negative number.';
      return;
    }
    this.isSavingProfile = true;
    this.sub.add(
      this.coachingService.updateMyCoachProfile({
        bio: this.profileForm.bio.trim(),
        specialty: this.profileForm.specialty.trim(),
        photo_url: this.profileForm.photo_url.trim(),
        rate: Number(this.profileForm.rate),
      }).subscribe({
        next: () => {
          this.isSavingProfile = false;
          this.profileModalOpen = false;
          this.loadProfile();
        },
        error: (err) => {
          this.isSavingProfile = false;
          this.profileFormError = err?.error?.message || 'Failed to update profile. Please try again.';
          console.error('Failed to update coach profile', err);
        },
      }),
    );
  }

  // ── Set Availability modal ────────────────────────────────

  openAvailabilityModal(): void {
    this.availabilityError = '';
    this.availabilityModalOpen = true;
    this.loadAvailability();
  }

  closeAvailabilityModal(): void {
    this.availabilityModalOpen = false;
  }

  private loadAvailability(): void {
    this.isLoadingAvailability = true;
    this.sub.add(
      this.coachingService.getAvailability().subscribe({
        next: (res) => {
          this.availabilitySlots = res || [];
          this.isLoadingAvailability = false;
        },
        error: (err) => {
          console.error('Failed to load availability', err);
          this.isLoadingAvailability = false;
        },
      }),
    );
  }

  addAvailabilitySlot(): void {
    this.availabilityError = '';
    if (!this.newSlot.start_time || !this.newSlot.end_time) {
      this.availabilityError = 'Start and end time are required.';
      return;
    }
    if (this.newSlot.start_time >= this.newSlot.end_time) {
      this.availabilityError = 'End time must be after start time.';
      return;
    }
    this.sub.add(
      this.coachingService.createAvailabilitySlot(this.newSlot).subscribe({
        next: (slot) => {
          this.availabilitySlots = [...this.availabilitySlots, slot].sort(
            (a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time),
          );
        },
        error: (err) => {
          this.availabilityError = err?.error?.message || 'Failed to add slot. Please try again.';
          console.error('Failed to create availability slot', err);
        },
      }),
    );
  }

  removeAvailabilitySlot(slot: CoachAvailabilitySlot): void {
    if (!slot.id) return;
    this.sub.add(
      this.coachingService.deleteAvailabilitySlot(slot.id).subscribe({
        next: () => {
          this.availabilitySlots = this.availabilitySlots.filter((s) => s.id !== slot.id);
        },
        error: (err) => {
          console.error('Failed to delete availability slot', err);
        },
      }),
    );
  }

  // ── Create Program modal ──────────────────────────────────

  private buildEmptyProgramForm(): CoachProgram {
    return {
      name: '',
      workout_type: '',
      target: '',
      duration_minutes: 60,
      price: 0,
      description: '',
      items: [{ name: '', sets: 3, reps: 10, description: '' }],
    };
  }

  openProgramModal(): void {
    this.programFormError = '';
    this.programForm = this.buildEmptyProgramForm();
    this.programModalOpen = true;
    this.loadPrograms();
  }

  closeProgramModal(): void {
    this.programModalOpen = false;
  }

  private loadPrograms(): void {
    this.isLoadingPrograms = true;
    this.sub.add(
      this.coachingService.getPrograms().subscribe({
        next: (res) => {
          this.programs = res || [];
          this.isLoadingPrograms = false;
        },
        error: (err) => {
          console.error('Failed to load programs', err);
          this.isLoadingPrograms = false;
        },
      }),
    );
  }

  addProgramItem(): void {
    this.programForm.items = [...(this.programForm.items || []), { name: '', sets: 3, reps: 10, description: '' }];
  }

  removeProgramItem(index: number): void {
    if (!this.programForm.items || this.programForm.items.length <= 1) return;
    this.programForm.items = this.programForm.items.filter((_, i) => i !== index);
  }

  saveProgram(): void {
    this.programFormError = '';
    const name = this.programForm.name.trim();
    const validItems = (this.programForm.items || []).filter((i: CoachProgramItemPayload) => i.name.trim() !== '');

    if (!name) {
      this.programFormError = 'Program name is required.';
      return;
    }
    if (validItems.length === 0) {
      this.programFormError = 'Add at least 1 exercise.';
      return;
    }

    this.isSavingProgram = true;
    this.sub.add(
      this.coachingService.createProgram({ ...this.programForm, name, items: validItems }).subscribe({
        next: (created) => {
          this.isSavingProgram = false;
          this.programs = [created, ...this.programs];
          this.programForm = this.buildEmptyProgramForm();
        },
        error: (err) => {
          this.isSavingProgram = false;
          this.programFormError = err?.error?.message || 'Failed to save program. Please try again.';
          console.error('Failed to create program', err);
        },
      }),
    );
  }

  deleteProgram(program: CoachProgram): void {
    if (!program.id) return;
    this.sub.add(
      this.coachingService.deleteProgram(program.id).subscribe({
        next: () => {
          this.programs = this.programs.filter((p) => p.id !== program.id);
        },
        error: (err) => {
          console.error('Failed to delete program', err);
        },
      }),
    );
  }

  // ── Notifications panel ───────────────────────────────────

  openNotifPanel(): void {
    this.notifPanelOpen = true;
  }

  closeNotifPanel(): void {
    this.notifPanelOpen = false;
  }

  onUnreadCountChange(count: number): void {
    this.unreadCount = count;
  }

  // ── Header actions ─────────────────────────────────────────
  // Reuses the shared app-header's 4 buttons (see header.component.ts):
  // coachingClick jumps straight to the Messages tab (this account IS the
  // coach, so "browse coaches" doesn't apply), equipmentClick stays the
  // role-agnostic equipment scanner, notifClick/profileClick are unchanged.

  onCoachingHeaderClick(): void {
    this.setTab('messages');
  }

  goToEquipment(): void {
    this.router.navigate(['/equipment']);
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }

  goToSchedule(): void {
    this.router.navigate(['/schedule']);
  }

  /**
   * "Preview Coach Profile" (My Clients empty state) — CoachProfileMe.id is
   * the coach's USER id (see CoachController::myProfile()), which is exactly
   * what the client-facing /coach/:id route (CoachController::show()) keys
   * on, so this reuses that route rather than adding a new one.
   */
  previewProfile(): void {
    if (!this.profile?.id) return;
    this.router.navigate(['/coach', this.profile.id]);
  }

  // ── Bottom nav ───────────────────────────────────────────
  goToDashboard(): void { /* already here */ }
  goToClients(): void { this.setTab('clients'); }
  goToQr(): void { this.router.navigate(['/qr-scanner']); }
  goToMessages(): void { this.setTab('messages'); }
}
