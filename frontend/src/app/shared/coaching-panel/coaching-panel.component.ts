import { Component, EventEmitter, Output, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonIcon,
  IonSpinner,
  IonModal,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  searchOutline,
  sparklesOutline,
  chatbubblesOutline,
  chatbubbleEllipsesOutline,
  personOutline,
  closeOutline,
  star,
  cashOutline,
  barbellOutline,
  checkmarkCircleOutline,
  personCircleOutline,
  settingsOutline,
  peopleOutline,
  calendarOutline,
  mailUnreadOutline,
  addCircleOutline,
  timeOutline,
  clipboardOutline,
  gridOutline,
  closeCircleOutline,
  chevronForwardOutline,
  addOutline,
  trashOutline,
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { NoNegativeDirective } from '../../directives/no-negative.directive';
import {
  CoachingService,
  Coach,
  Conversation,
  CoachProfileMe,
  CoachClientItem,
  CoachDashboardStats,
  CoachRequestItem,
  CoachAvailabilitySlot,
  CoachProgram,
  CoachProgramItemPayload,
  ProgramBooking,
  WorkoutPlanProposal,
} from '../../services/coaching.service';

/** A single row in the coach dashboard's "Today's Sessions" list. */
interface TodaySessionView {
  proposalId: number;
  clientName: string;
  clientAvatar?: string;
  timeLabel: string;
  focus: string;
  location?: string;
}

/** Internal tab set for the coach-only dashboard content (see coachTab below). */
type CoachDashboardTab = 'clients' | 'requests' | 'messages';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

@Component({
  selector: 'app-coaching-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    IonSpinner,
    IonModal,
    NoNegativeDirective,
  ],
  templateUrl: './coaching-panel.component.html',
  styleUrls: ['./coaching-panel.component.scss'],
})
export class CoachingPanelComponent implements OnChanges, OnDestroy {
  /** Whether the panel is visible. Parent owns this — set true from the header coaching button. */
  @Input() isOpen = false;

  /**
   * Optional tab to land on when the panel opens, overriding the normal
   * role-based default (see loadMyProfile()). Set by the host page from
   * CoachingNavService.consumeReopen() when the panel is being reopened
   * right after ChatPage's back button, so the member/coach lands
   * straight back on Messages instead of re-deciding a default tab they
   * didn't ask for. 'clients'/'conversations' map onto the coach-only
   * dashboard's own tabs (see applyRequestedTab()) when the account
   * resolves as a coach.
   */
  @Input() initialTab: 'explore' | 'conversations' | 'clients' | 'classes' | null = null;

  /** Emitted when the panel should close (close button or header icon re-click). The parent page then flips its own state, which unmounts this component via *ngIf. */
  @Output() closed = new EventEmitter<void>();

  /** All HTTP subscriptions started by this panel — unsubscribed together in ngOnDestroy so an in-flight request never writes into a destroyed component. */
  private sub = new Subscription();

  /**
   * 'clients' (coach's own client roster) is only ever reachable when
   * isCoach is true; 'explore' (browse-a-coach) is only ever reachable
   * when isCoach is false -- see loadMyProfile() below, which is the
   * single place that decides isCoach and therefore the default tab.
   * For a coach account this outer tab bar is not shown at all — the
   * coach dashboard content has its own internal tabs (see coachTab).
   */
  activeTab: 'explore' | 'conversations' | 'clients' | 'classes' = 'explore';
  searchQuery = '';
  activeSpecialty = 'All';

  /**
   * Whether the logged-in account is a coach (has an active CoachProfile
   * row server-side) rather than a regular member. Drives which tabs and
   * data this panel shows -- a coach manages their own client roster and
   * profile here instead of browsing/hiring other coaches. Defaults to
   * false (member view) until loadMyProfile() resolves, so the panel never
   * flashes coach-only UI to a member while the request is in flight.
   */
  isCoach = false;
  myProfile: CoachProfileMe | null = null;
  isLoadingProfile = false;

  clients: CoachClientItem[] = [];
  isLoadingClients = false;

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

  // ── Coach Dashboard state (isCoach === true only) ─────────────────
  // Everything below mirrors the standalone Coach Dashboard page 1:1 —
  // ported here so a coach account gets the full dashboard from this one
  // panel instead of a route change, keeping the rest of the app (bottom
  // nav, member pages) identical for every account. See dayNames etc.

  readonly dayNames = DAY_NAMES;

  stats: CoachDashboardStats = {
    active_clients: 0,
    sessions_today: 0,
    pending_requests: 0,
    earnings_this_month: 0,
  };
  isLoadingStats = false;

  todaySessions: TodaySessionView[] = [];
  isLoadingTodaySessions = false;

  coachTab: CoachDashboardTab = 'clients';
  requests: CoachRequestItem[] = [];
  isLoadingRequests = false;
  requestActionInFlightId: number | null = null;

  // Manage Profile modal
  profileModalOpen = false;
  profileForm = { bio: '', specialty: '', photo_url: '', rate: 0 };
  isSavingProfile = false;
  profileFormError = '';

  // Set Availability modal
  availabilityModalOpen = false;
  availabilitySlots: CoachAvailabilitySlot[] = [];
  isLoadingAvailability = false;
  newSlot = { day_of_week: 1, start_time: '09:00', end_time: '17:00' };
  availabilityError = '';

  // Create Program modal
  programModalOpen = false;
  programs: CoachProgram[] = [];
  isLoadingPrograms = false;
  programForm: CoachProgram = this.buildEmptyProgramForm();
  isSavingProgram = false;
  programFormError = '';

  // Roster modal (public group-class bookings, coach side)
  rosterModalOpen = false;
  rosterProgram: CoachProgram | null = null;
  rosterBookings: ProgramBooking[] = [];
  isLoadingRoster = false;

  // Browse Classes tab (member side — the "Avail" flow)
  publicPrograms: CoachProgram[] = [];
  isLoadingClasses = false;
  classActionInFlightId: number | null = null;
  classActionError = '';

  constructor(
    private router: Router,
    private auth: AuthService,
    private coachingService: CoachingService,
  ) {
    addIcons({
      personOutline,
      chatbubbleEllipsesOutline,
      chatbubblesOutline,
      searchOutline,
      star,
      cashOutline,
      closeOutline,
      sparklesOutline,
      checkmarkCircleOutline,
      barbellOutline,
      personCircleOutline,
      settingsOutline,
      peopleOutline,
      calendarOutline,
      mailUnreadOutline,
      addCircleOutline,
      timeOutline,
      clipboardOutline,
      gridOutline,
      closeCircleOutline,
      chevronForwardOutline,
      addOutline,
      trashOutline,
    });
  }

  // Loading is driven entirely by ngOnChanges below -- isOpen is a bound
  // @Input, so Angular guarantees ngOnChanges fires on this component's
  // very first check too (the initial binding counts as a change, with
  // firstChange: true), before ngOnInit would even run.
  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      // Every open re-resolves the role first -- role never changes mid
      // session in practice, but re-checking here (rather than caching
      // across opens) keeps this correct if the account type ever does,
      // and it's a single lightweight request either way.
      this.loadMyProfile();
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  close(): void {
    this.closed.emit();
  }

  /**
   * Resolves whether the logged-in account is a coach, then loads the
   * correct default tab's data. This is the single entry point that
   * decides isCoach for the rest of the panel -- nothing else here should
   * branch on role before this resolves (see isCoach doc-comment above).
   */
  private loadMyProfile(): void {
    this.isLoadingProfile = true;
    this.sub.add(
      this.coachingService.getMyCoachProfile().subscribe({
        next: (res) => {
          this.isLoadingProfile = false;
          this.myProfile = res;
          this.isCoach = !!res?.has_profile;
          this.applyRequestedTab();

          if (this.isCoach) {
            this.loadCoachDashboard();
          } else {
            this.loadConversations();
            if (this.activeTab === 'explore') this.loadCoaches();
          }
        },
        error: (err) => {
          // Fail safe as a regular member so the panel stays usable even if
          // this lookup fails -- never assume coach access on an error.
          console.error('Failed to load coach profile', err);
          this.isLoadingProfile = false;
          this.myProfile = null;
          this.isCoach = false;
          this.activeTab = 'explore';
          this.loadCoaches();
          this.loadConversations();
        },
      }),
    );
  }

  /**
   * Applies the tab requested via CoachingNavService.consumeReopen() (see
   * initialTab doc-comment above), mapping it onto whichever tab set
   * actually applies now that isCoach has just been resolved by the only
   * caller (loadMyProfile()). 'conversations' maps to the coach
   * dashboard's own 'messages' tab for a coach account, or the member
   * panel's 'conversations' tab otherwise; 'clients' only ever applies to
   * a coach account and 'explore' only ever to a member -- either one
   * requested against the wrong role is silently ignored, leaving the
   * normal role-based default already set above in place.
   */
  private applyRequestedTab(): void {
    const requested = this.initialTab;
    if (!requested) return;

    if (this.isCoach) {
      if (requested === 'conversations') this.coachTab = 'messages';
      else if (requested === 'clients') this.coachTab = 'clients';
    } else if (requested === 'explore' || requested === 'conversations' || requested === 'classes') {
      this.activeTab = requested;
    }
  }

  // ── Coach Dashboard: load-all ─────────────────────────────────────
  private loadCoachDashboard(): void {
    this.loadStats();
    this.loadTodaySessions();
    this.loadCoachTabData();
  }

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

  // ── Coach Dashboard: internal tabs (My Clients / Requests / Messages) ──

  setCoachTab(tab: CoachDashboardTab): void {
    if (this.coachTab === tab) return;
    this.coachTab = tab;
    this.loadCoachTabData();
  }

  private loadCoachTabData(): void {
    if (this.coachTab === 'clients') this.loadClients();
    else if (this.coachTab === 'requests') this.loadRequests();
    else this.loadConversations();
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

  // ── Manage Profile modal ──────────────────────────────────

  openProfileModal(): void {
    this.profileFormError = '';
    this.profileForm = {
      bio: this.myProfile?.bio || '',
      specialty: this.myProfile?.specialty || '',
      photo_url: this.myProfile?.profile_image || '',
      rate: this.myProfile?.rate || 0,
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
          this.reloadProfileOnly();
        },
        error: (err) => {
          this.isSavingProfile = false;
          this.profileFormError = err?.error?.message || 'Failed to update profile. Please try again.';
          console.error('Failed to update coach profile', err);
        },
      }),
    );
  }

  /** Re-fetches just the profile card after a save, without re-resolving role or re-triggering the tab loader. */
  private reloadProfileOnly(): void {
    this.sub.add(
      this.coachingService.getMyCoachProfile().subscribe({
        next: (res) => { this.myProfile = res; },
        error: (err) => console.error('Failed to reload coach profile', err),
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
      is_public: false,
      capacity: 10,
      session_date: '',
      time_val: '',
      time_ampm: 'AM',
      location: '',
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

    // Public group classes are a single scheduled occurrence members book
    // into instantly, so the schedule + capacity aren't optional the way
    // they are for a private, reusable template.
    if (this.programForm.is_public) {
      if (!this.programForm.capacity || this.programForm.capacity < 1) {
        this.programFormError = 'Set how many members can join (capacity).';
        return;
      }
      if (!this.programForm.session_date) {
        this.programFormError = 'Pick a class date.';
        return;
      }
      if (!this.programForm.time_val || !this.programForm.time_ampm) {
        this.programFormError = 'Pick a class time.';
        return;
      }
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

  // ── Roster modal (coach viewing who availed their public class) ────

  openRosterModal(program: CoachProgram): void {
    if (!program.id) return;
    this.rosterProgram = program;
    this.rosterModalOpen = true;
    this.rosterBookings = [];
    this.isLoadingRoster = true;
    this.sub.add(
      this.coachingService.getProgramRoster(program.id).subscribe({
        next: (res) => {
          this.rosterBookings = res || [];
          this.isLoadingRoster = false;
        },
        error: (err) => {
          console.error('Failed to load class roster', err);
          this.isLoadingRoster = false;
        },
      }),
    );
  }

  closeRosterModal(): void {
    this.rosterModalOpen = false;
    this.rosterProgram = null;
  }

  // ── Coach Dashboard: navigation helpers (all close the panel first,
  // since this is an overlay, not a route — leaving it open underneath
  // a pushed page would leave stale state mounted). ───────────────────

  goToSchedule(): void {
    this.close();
    this.router.navigate(['/schedule']);
  }

  /** Settings shortcut on the Coach Dashboard header — closes the panel then hands off to the normal Profile/Settings page. */
  openSettings(): void {
    this.close();
    this.router.navigate(['/profile']);
  }

  openTodaySession(session: TodaySessionView): void {
    this.close();
    this.router.navigate(['/chat', session.proposalId]);
  }

  // ── Member flow: Explore Coaches ──────────────────────────

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

  onSearchChange() {
    this.loadCoaches();
  }

  selectSpecialty(spec: string) {
    this.activeSpecialty = spec;
    this.loadCoaches();
  }

  setTab(tab: 'explore' | 'conversations' | 'clients' | 'classes') {
    // Defensive role guard: 'explore' (hire-a-coach) never applies to a
    // coach account and 'clients' (client roster) never applies to a
    // regular member -- the template only renders the tab buttons that
    // match the resolved role, but this keeps the method itself safe even
    // if called directly.
    if (tab === 'explore' && this.isCoach) return;
    if (tab === 'clients') return; // superseded by setCoachTab() for coach accounts

    this.activeTab = tab as 'explore' | 'conversations' | 'classes';
    if (tab === 'conversations') {
      this.loadConversations();
    } else if (tab === 'classes') {
      this.loadPublicPrograms();
    } else {
      this.loadCoaches();
    }
  }

  viewCoach(coach: Coach) {
    this.close(); // Close panel before navigating
    this.router.navigate(['/coach', coach.id]);
  }

  startChat(coach: Coach) {
    if (this.isStartingChat) return;
    this.isStartingChat = true;

    this.coachingService.startConversation({ target_user_id: coach.user_id || coach.id }).subscribe({
      next: (convo) => {
        this.isStartingChat = false;
        if (convo && convo.id) {
          this.close(); // Close panel before navigating
          this.router.navigate(['/chat', convo.id]);
        }
      },
      error: (err) => {
        this.isStartingChat = false;
        console.error('Failed to start chat', err);
      },
    });
  }

  // ── Member flow: Browse Classes ("Avail" a public group class) ─────

  loadPublicPrograms(): void {
    this.isLoadingClasses = true;
    this.classActionError = '';
    this.sub.add(
      this.coachingService.getPublicPrograms().subscribe({
        next: (res) => {
          this.publicPrograms = res || [];
          this.isLoadingClasses = false;
        },
        error: (err) => {
          console.error('Failed to load public classes', err);
          this.isLoadingClasses = false;
        },
      }),
    );
  }

  /** "Avail" button: instant-books a seat, pay at gym. */
  bookClass(program: CoachProgram): void {
    if (!program.id || this.classActionInFlightId) return;
    this.classActionError = '';
    this.classActionInFlightId = program.id;
    this.sub.add(
      this.coachingService.bookProgram(program.id).subscribe({
        next: () => {
          this.classActionInFlightId = null;
          // Refresh from the server so booked_count/spots_left/already_booked
          // reflect the real, authoritative state rather than a guessed patch.
          this.loadPublicPrograms();
        },
        error: (err) => {
          this.classActionInFlightId = null;
          this.classActionError = err?.error?.message || 'Failed to book this class. Please try again.';
          console.error('Failed to book class', err);
        },
      }),
    );
  }

  cancelClassBooking(program: CoachProgram): void {
    if (!program.id || this.classActionInFlightId) return;
    this.classActionError = '';
    this.classActionInFlightId = program.id;
    this.sub.add(
      this.coachingService.cancelProgramBooking(program.id).subscribe({
        next: () => {
          this.classActionInFlightId = null;
          this.loadPublicPrograms();
        },
        error: (err) => {
          this.classActionInFlightId = null;
          this.classActionError = err?.error?.message || 'Failed to cancel your booking. Please try again.';
          console.error('Failed to cancel class booking', err);
        },
      }),
    );
  }

  // ── Shared: Clients list (coach) / Conversations list (both roles) ──

  /** Loads the coach's own client roster (GET /coaches/clients). Coach-only -- callers must gate on isCoach. */
  loadClients(): void {
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

  loadConversations() {
    this.sub.add(
      this.coachingService.getConversations().subscribe({
        next: (res) => {
          this.conversations = res || [];
        },
        error: (err) => {
          console.error('Failed to load conversations', err);
        },
      }),
    );
  }

  openConversation(convo: Conversation) {
    this.close(); // Close panel before navigating
    this.router.navigate(['/chat', convo.id]);
  }

  /** Opens the chat thread for one of the coach's clients (My Clients tab). */
  openClientChat(item: CoachClientItem): void {
    this.close(); // Close panel before navigating
    this.router.navigate(['/chat', item.conversation_id]);
  }
}
