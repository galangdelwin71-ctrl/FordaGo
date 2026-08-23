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
import { CoachingNavService, CoachingPanelTab, CoachingPanelHost } from '../../services/coaching-nav.service';
import { NoNegativeDirective } from '../../directives/no-negative.directive';
import { getCachedData, setCachedData } from '../../utils/local-cache.util';
import { CACHE_KEYS } from '../../utils/cache-keys';
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
  /** Conversation this proposal lives in -- the chat route needs THIS, not proposalId (see openTodaySession()). */
  conversationId: number;
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
   * Which host page this panel is mounted on ('dashboard' | 'schedule' |
   * 'coaching'). Required for navigateAway() to tell CoachingNavService
   * which page should receive the reopen signal on back-navigation, so
   * Ionic's cached-page lifecycle can't deliver it to the wrong page.
   * Defaults to 'dashboard' as a safe fallback (unchanged behaviour for
   * any caller that doesn't set it), but every host page should supply
   * this explicitly.
   */
  @Input() hostPage: CoachingPanelHost = 'dashboard';

  /**
   * Optional tab to land on when the panel opens, overriding the normal
   * role-based default (see loadMyProfile()). Set by the host page from
   * CoachingNavService.consumeReopen() when the panel is being reopened
   * after a back-navigation from chat/coach-profile, so the member/coach
   * lands exactly back on whichever tab they were actually on before
   * (see navigateAway() below -- that's where this value gets recorded),
   * instead of a re-decided default they didn't ask for. Any coach-only
   * tab ('clients'/'requests'/'messages') or member-only tab
   * ('explore'/'conversations'/'classes') is silently ignored if it
   * doesn't match the resolved role (see applyRequestedTab()).
   */
  @Input() initialTab: CoachingPanelTab | null = null;

  /** Emitted when the panel should close (close button or header icon re-click). The parent page then flips its own state, which unmounts this component via *ngIf. */
  @Output() closed = new EventEmitter<void>();

  /**
   * Emitted right before this panel navigates away to a full page (chat,
   * coach profile, schedule, settings) via router.navigate() -- distinct
   * from `closed` (the header-X / role-aware "close the panel" intent).
   * The parent must unconditionally unmount the panel on this event
   * regardless of role. `closed` deliberately does NOT unmount for a
   * coach account (see CoachingPage.closeCoachingPanel()), and every
   * navigation method below used to call close() too -- so a coach
   * opening a client chat left a stale CoachingPanelComponent instance
   * mounted underneath the destination route. Combined with Ionic's
   * router-outlet page caching, that stale instance corrupted the page
   * transition on the way back (Location.back() from ChatPage), freezing
   * the UI so nothing on screen responded to touch. See navigateAway().
   */
  @Output() navigated = new EventEmitter<void>();

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

  /**
   * Total unread MESSAGES across every conversation (sum of each
   * Conversation.unread_count from the backend), NOT the number of
   * conversation threads. Drives the member "Messages" tab badge (see
   * .tab-badge-count in the template) -- a thread count was misleading
   * there: a single coach who sent 10 unread messages in one thread
   * showed "1", not "10". unread_count is already scoped server-side to
   * messages the other party sent that this account hasn't read yet, so
   * a plain sum is the correct total with no extra request needed.
   */
  get totalUnreadMessages(): number {
    return this.conversations.reduce((total, convo) => total + (convo.unread_count || 0), 0);
  }

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

  trackByCoach(index: number, coach: Coach): number | string {
    return coach.id || coach.user_id || index;
  }

  trackByConversation(index: number, convo: Conversation): number | string {
    return convo.id || convo.partner?.id || index;
  }

  trackByProgram(index: number, prog: CoachProgram): number | string {
    return prog.id || index;
  }

  trackByClient(index: number, item: CoachClientItem): number | string {
    return item.conversation_id || item.client?.id || index;
  }

  trackByRequest(index: number, item: CoachRequestItem): number | string {
    return item.conversation_id || item.client?.id || index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  constructor(
    private router: Router,
    private auth: AuthService,
    private coachingService: CoachingService,
    private coachingNav: CoachingNavService,
  ) {
    // Immediately resolve coach status synchronously from stored auth state
    // so the panel never flashes member "Personal Coaches" UI to a coach.
    this.isCoach = this.auth.isCoachAccount();
    if (this.isCoach) {
      this.coachTab = 'clients';
    }

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

  // ── Local-First Cache (Memory & Storage) ─────────────────────
  private static cachedMyProfile: CoachProfileMe | null = null;
  private static cachedCoaches: Coach[] = [];
  private static cachedConversations: Conversation[] = [];
  private static cachedPublicPrograms: CoachProgram[] = [];
  private static cachedStats: CoachDashboardStats | null = null;
  private static cachedClients: CoachClientItem[] = [];
  private static cachedTodaySessions: TodaySessionView[] = [];
  private static cachedRequests: CoachRequestItem[] = [];

  // Loading is driven entirely by ngOnChanges below -- isOpen is a bound
  // @Input, so Angular guarantees ngOnChanges fires on this component's
  // very first check too (the initial binding counts as a change, with
  // firstChange: true), before ngOnInit would even run.
  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && this.isOpen) {
      void this.openWithHydration();
    }
  }

  private async openWithHydration(): Promise<void> {
    await this.hydrateFromCache();
    this.loadMyProfile();
  }

  /**
   * Stage 3 local-first hydration: restores last-known profile, coaches list,
   * conversations, and classes immediately from memory/storage so the panel
   * renders with 0ms latency without showing a full-screen loading spinner.
   */
  private async hydrateFromCache(): Promise<void> {
    // 1. In-memory static cache (instant 0ms on re-opening in same session)
    if (CoachingPanelComponent.cachedMyProfile) {
      this.myProfile = CoachingPanelComponent.cachedMyProfile;
      this.isCoach = !!this.myProfile.has_profile;
      this.isLoadingProfile = false;
      this.applyRequestedTab();
    }
    if (CoachingPanelComponent.cachedCoaches.length > 0) {
      this.coaches = CoachingPanelComponent.cachedCoaches;
      this.isLoading = false;
    }
    if (CoachingPanelComponent.cachedConversations.length > 0) {
      this.conversations = CoachingPanelComponent.cachedConversations;
    }
    if (CoachingPanelComponent.cachedPublicPrograms.length > 0) {
      this.publicPrograms = CoachingPanelComponent.cachedPublicPrograms;
      this.isLoadingClasses = false;
    }
    if (CoachingPanelComponent.cachedStats) {
      this.stats = CoachingPanelComponent.cachedStats;
      this.isLoadingStats = false;
    }
    if (CoachingPanelComponent.cachedClients.length > 0) {
      this.clients = CoachingPanelComponent.cachedClients;
      this.isLoadingClients = false;
    }
    if (CoachingPanelComponent.cachedTodaySessions.length > 0) {
      this.todaySessions = CoachingPanelComponent.cachedTodaySessions;
      this.isLoadingTodaySessions = false;
    }
    if (CoachingPanelComponent.cachedRequests.length > 0) {
      this.requests = CoachingPanelComponent.cachedRequests;
      this.isLoadingRequests = false;
    }

    // 2. Persistent storage fallback (for app cold-start)
    if (!this.myProfile) {
      const cachedProf = await getCachedData<CoachProfileMe>(CACHE_KEYS.COACH_PROFILE);
      if (cachedProf) {
        this.myProfile = cachedProf;
        CoachingPanelComponent.cachedMyProfile = cachedProf;
        this.isCoach = !!cachedProf.has_profile || this.auth.isCoachAccount();
        this.isLoadingProfile = false;
        this.applyRequestedTab();
      }
    }
    if (this.coaches.length === 0) {
      const cachedCoaches = await getCachedData<Coach[]>(CACHE_KEYS.COACHES);
      if (Array.isArray(cachedCoaches) && cachedCoaches.length > 0) {
        this.coaches = cachedCoaches;
        CoachingPanelComponent.cachedCoaches = cachedCoaches;
        this.isLoading = false;
      }
    }
    if (this.conversations.length === 0) {
      const cachedConvos = await getCachedData<Conversation[]>(CACHE_KEYS.COACH_CONVERSATIONS);
      if (Array.isArray(cachedConvos) && cachedConvos.length > 0) {
        this.conversations = cachedConvos;
        CoachingPanelComponent.cachedConversations = cachedConvos;
      }
    }
    if (this.publicPrograms.length === 0) {
      const cachedProg = await getCachedData<CoachProgram[]>(CACHE_KEYS.COACH_CLASSES);
      if (Array.isArray(cachedProg) && cachedProg.length > 0) {
        this.publicPrograms = cachedProg;
        CoachingPanelComponent.cachedPublicPrograms = cachedProg;
        this.isLoadingClasses = false;
      }
    }
    if (!CoachingPanelComponent.cachedStats) {
      const cachedStats = await getCachedData<CoachDashboardStats>(CACHE_KEYS.COACH_STATS);
      if (cachedStats) {
        this.stats = cachedStats;
        CoachingPanelComponent.cachedStats = cachedStats;
        this.isLoadingStats = false;
      }
    }
    if (this.todaySessions.length === 0) {
      const cachedToday = await getCachedData<TodaySessionView[]>(CACHE_KEYS.COACH_TODAY_SESSIONS);
      if (Array.isArray(cachedToday) && cachedToday.length > 0) {
        this.todaySessions = cachedToday;
        CoachingPanelComponent.cachedTodaySessions = cachedToday;
        this.isLoadingTodaySessions = false;
      }
    }
    if (this.clients.length === 0) {
      const cachedClients = await getCachedData<CoachClientItem[]>(CACHE_KEYS.COACH_CLIENTS);
      if (Array.isArray(cachedClients) && cachedClients.length > 0) {
        this.clients = cachedClients;
        CoachingPanelComponent.cachedClients = cachedClients;
        this.isLoadingClients = false;
      }
    }
    if (this.requests.length === 0) {
      const cachedReqs = await getCachedData<CoachRequestItem[]>(CACHE_KEYS.COACH_REQUESTS);
      if (Array.isArray(cachedReqs) && cachedReqs.length > 0) {
        this.requests = cachedReqs;
        CoachingPanelComponent.cachedRequests = cachedReqs;
        this.isLoadingRequests = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  close(): void {
    this.closed.emit();
  }

  /**
   * Closes the panel unconditionally before navigating to a full page --
   * see `navigated` doc-comment above. Always use this (never close())
   * from a method that follows with router.navigate().
   *
   * Also records the tab this panel was ACTUALLY showing at the moment of
   * navigating away (see CoachingNavService doc-comment) -- this is what
   * lets a plain back button later restore the exact screen the member
   * left, instead of some hardcoded guess. Every caller below already
   * navigates to a page (chat, coach profile, schedule) that a member can
   * reasonably back out of, so this is deliberately unconditional rather
   * than opted into per-call-site.
   */
  private navigateAway(): void {
    this.coachingNav.requestReopen(
      this.isCoach ? this.coachTab : this.activeTab,
      this.hostPage,
    );
    this.navigated.emit();
  }

  /**
   * Resolves whether the logged-in account is a coach, then loads the
   * correct default tab's data. This is the single entry point that
   * decides isCoach for the rest of the panel -- nothing else here should
   * branch on role before this resolves (see isCoach doc-comment above).
   */
  private loadMyProfile(): void {
    if (!this.myProfile) {
      this.isLoadingProfile = true;
    }
    this.sub.add(
      // Use the single-call endpoint — returns profile + all coach data together,
      // cutting 6 HTTP round-trips down to 1. Falls back to individual calls on error.
      this.coachingService.getDashboardFull().subscribe({
        next: (res) => {
          this.isLoadingProfile = false;
          const profile = res.profile;
          this.myProfile = profile;
          CoachingPanelComponent.cachedMyProfile = profile;
          void setCachedData(CACHE_KEYS.COACH_PROFILE, profile);
          this.isCoach = !!profile?.has_profile;
          this.applyRequestedTab();

          if (this.isCoach) {
            // Populate all coach dashboard data from the single response
            if (res.stats) {
              this.stats = res.stats;
              this.isLoadingStats = false;
              CoachingPanelComponent.cachedStats = res.stats;
              void setCachedData(CACHE_KEYS.COACH_STATS, res.stats);
            }

            // Today's sessions — map from raw proposals (same shape as getProposals())
            const myId = this.auth.user?.id;
            const todayKey = this.todayDateKey();
            const todayList = (res.today_proposals || [])
              .filter((p: any) => (myId ? Number(p.coach_id) === Number(myId) : true))
              .filter((p: any) => this.toDateKey(p.session_date) === todayKey)
              .sort((a: any, b: any) => this.compareTimeAsc(a, b));
            this.todaySessions = todayList.map((p: any) => this.mapProposalToTodaySession(p));
            this.isLoadingTodaySessions = false;
            CoachingPanelComponent.cachedTodaySessions = this.todaySessions;
            void setCachedData(CACHE_KEYS.COACH_TODAY_SESSIONS, this.todaySessions);

            if (Array.isArray(res.conversations)) {
              this.conversations = res.conversations;
              this.isLoading = false;
              CoachingPanelComponent.cachedConversations = res.conversations;
              void setCachedData(CACHE_KEYS.COACH_CONVERSATIONS, res.conversations);
            }
            if (Array.isArray(res.clients)) {
              this.clients = res.clients;
              this.isLoadingClients = false;
              CoachingPanelComponent.cachedClients = res.clients;
              void setCachedData(CACHE_KEYS.COACH_CLIENTS, res.clients);
            }
            if (Array.isArray(res.requests)) {
              this.requests = res.requests;
              this.isLoadingRequests = false;
              CoachingPanelComponent.cachedRequests = res.requests;
              void setCachedData(CACHE_KEYS.COACH_REQUESTS, res.requests);
            }
          } else {
            // Regular member — populate conversations and active coaches directly from the single payload!
            if (Array.isArray(res.conversations)) {
              this.conversations = res.conversations;
              CoachingPanelComponent.cachedConversations = res.conversations;
              void setCachedData(CACHE_KEYS.COACH_CONVERSATIONS, res.conversations);
            }
            if (Array.isArray(res.coaches) && res.coaches.length > 0) {
              this.coaches = res.coaches;
              this.isLoading = false;
              CoachingPanelComponent.cachedCoaches = res.coaches;
              void setCachedData(CACHE_KEYS.COACHES, res.coaches);
            } else {
              this.loadMemberTabData();
            }
          }
        },
        error: (err) => {
          // Fail safe: on error fall back to individual endpoints (old behaviour)
          console.error('dashboard-full failed, falling back to individual calls', err);
          this.isLoadingProfile = false;
          // Try the old profile endpoint as fallback
          this.sub.add(
            this.coachingService.getMyCoachProfile().subscribe({
              next: (profRes) => {
                this.myProfile = profRes;
                CoachingPanelComponent.cachedMyProfile = profRes;
                void setCachedData(CACHE_KEYS.COACH_PROFILE, profRes);
                this.isCoach = !!profRes?.has_profile;
                this.applyRequestedTab();
                if (this.isCoach) {
                  this.loadCoachDashboard();
                } else {
                  this.loadMemberTabData();
                }
              },
              error: () => {
                if (!this.myProfile) {
                  this.myProfile = null;
                  this.isCoach = false;
                  this.activeTab = 'explore';
                  this.loadCoaches();
                  this.loadConversations();
                }
              },
            }),
          );
        },
      }),
    );
  }


  /**
   * Loads whatever data the member's CURRENT activeTab needs -- called
   * both on the normal default ('explore') and after applyRequestedTab()
   * may have just restored a different tab ('conversations'/'classes')
   * via a back-navigation. Conversations are always loaded regardless of
   * which tab is active: the Messages tab button's unread badge
   * (totalUnreadMessages, see getter above) needs that data even while
   * sitting on a different tab.
   */
  private loadMemberTabData(): void {
    this.loadConversations();
    if (this.activeTab === 'explore') this.loadCoaches();
    else if (this.activeTab === 'classes') this.loadPublicPrograms();
  }

  /**
   * Applies the tab requested via CoachingNavService.consumeReopen() (see
   * initialTab doc-comment above), restoring the EXACT tab the panel was
   * showing before it last navigated away -- now that isCoach has just
   * been resolved by the only caller (loadMyProfile()). A coach-only
   * value ('clients'/'requests'/'messages') requested against a member
   * account (or a member-only value against a coach account) is silently
   * ignored, leaving the normal role-based default already set above in
   * place -- that combination should never happen in practice (the panel
   * only ever records its own current role's tab, see navigateAway()),
   * but a stale/cross-role value must never corrupt the UI if it ever did.
   */
  private applyRequestedTab(): void {
    const requested = this.initialTab;
    if (!requested) return;

    const coachTabs: readonly CoachDashboardTab[] = ['clients', 'requests', 'messages'];
    const memberTabs: readonly ('explore' | 'conversations' | 'classes')[] = ['explore', 'conversations', 'classes'];

    if (this.isCoach && (coachTabs as readonly string[]).includes(requested)) {
      this.coachTab = requested as CoachDashboardTab;
    } else if (!this.isCoach && (memberTabs as readonly string[]).includes(requested)) {
      this.activeTab = requested as 'explore' | 'conversations' | 'classes';
    }
  }

  // ── Coach Dashboard: load-all ─────────────────────────────────────
  private loadCoachDashboard(): void {
    this.loadStats();
    this.loadTodaySessions();
    this.loadCoachTabData();
  }

  private loadStats(): void {
    if (!CoachingPanelComponent.cachedStats && (!this.stats || (this.stats.active_clients === 0 && this.stats.sessions_today === 0))) {
      this.isLoadingStats = true;
    }
    this.sub.add(
      this.coachingService.getDashboardStats().subscribe({
        next: (res) => {
          this.stats = res;
          this.isLoadingStats = false;
          if (res) {
            CoachingPanelComponent.cachedStats = res;
            void setCachedData(CACHE_KEYS.COACH_STATS, res);
          }
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
    if (this.todaySessions.length === 0 && CoachingPanelComponent.cachedTodaySessions.length === 0) {
      this.isLoadingTodaySessions = true;
    }
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
          CoachingPanelComponent.cachedTodaySessions = this.todaySessions;
          void setCachedData(CACHE_KEYS.COACH_TODAY_SESSIONS, this.todaySessions);
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
      conversationId: p.conversation_id,
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
    if (this.requests.length === 0 && CoachingPanelComponent.cachedRequests.length === 0) {
      this.isLoadingRequests = true;
    }
    this.sub.add(
      this.coachingService.getCoachRequests().subscribe({
        next: (res) => {
          this.requests = res || [];
          this.isLoadingRequests = false;
          if (Array.isArray(res)) {
            CoachingPanelComponent.cachedRequests = res;
            void setCachedData(CACHE_KEYS.COACH_REQUESTS, res);
          }
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
          CoachingPanelComponent.cachedRequests = this.requests;
          void setCachedData(CACHE_KEYS.COACH_REQUESTS, this.requests);
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
          CoachingPanelComponent.cachedRequests = this.requests;
          void setCachedData(CACHE_KEYS.COACH_REQUESTS, this.requests);
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

  /**
   * Photo picker for Manage Profile -- mirrors ProfilePage's
   * onProfileImageSelected() (member Edit Profile modal) so the coach
   * dashboard uses the same upload-a-file flow instead of a raw "Photo
   * URL" text field asking the coach to paste a link. Reads the file
   * client-side into a data: URL and stores it straight in
   * profileForm.photo_url -- same field saveProfile() already sends to
   * PUT /coaches/me, so the backend contract is unchanged.
   */
  onCoachPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const isAllowedType = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
    if (!isAllowedType) {
      this.profileFormError = 'Please select a PNG, JPG, or WEBP image.';
      input.value = '';
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      this.profileFormError = 'Image must be 2MB or smaller.';
      input.value = '';
      return;
    }

    this.profileFormError = '';
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      if (!result.startsWith('data:image/')) {
        this.profileFormError = 'Invalid image file.';
        return;
      }
      this.profileForm.photo_url = result;
    };
    reader.readAsDataURL(file);
  }

  removeCoachPhoto(): void {
    this.profileForm.photo_url = '';
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
      // No default price — an empty field shows the "0" placeholder
      // instead of a real value the coach has to notice and clear.
      price: undefined,
      description: '',
      // No default sets/reps either, same reasoning — blank inputs show
      // their "Sets" / "Reps" placeholders until the coach types a value.
      items: [{ name: '', sets: undefined, reps: undefined, description: '' }],
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
    this.programForm.items = [...(this.programForm.items || []), { name: '', sets: undefined, reps: undefined, description: '' }];
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
    this.navigateAway();
    this.router.navigate(['/schedule']);
  }

  /**
   * "View" on a Today's Sessions row -- opens the chat thread the proposal
   * belongs to (where the full proposal card -- date, time, price,
   * location, exercise list -- is rendered, see chat.page.html's
   * proposal-card-bubble). Routes on conversationId, NOT proposalId: the
   * chat route is /chat/:conversationId, and passing the proposal's own id
   * there took the coach to the wrong conversation (or a 404) whenever the
   * two ids didn't happen to match.
   */
  openTodaySession(session: TodaySessionView): void {
    this.navigateAway();
    this.router.navigate(['/chat', session.conversationId]);
  }

  // ── Member flow: Explore Coaches ──────────────────────────

  loadCoaches() {
    const isDefaultQuery = !this.searchQuery.trim() && this.activeSpecialty === 'All';
    if (this.coaches.length === 0 || !isDefaultQuery) {
      this.isLoading = true;
    }
    this.coachingService.getCoaches(this.searchQuery, this.activeSpecialty).subscribe({
      next: (res) => {
        this.coaches = res || [];
        this.isLoading = false;
        if (isDefaultQuery && Array.isArray(res)) {
          CoachingPanelComponent.cachedCoaches = res;
          void setCachedData(CACHE_KEYS.COACHES, res);
        }
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
    this.navigateAway(); // Close panel before navigating
    this.router.navigate(['/coach', coach.id]);
  }

  startChat(coach: Coach) {
    if (this.isStartingChat) return;
    this.isStartingChat = true;

    this.coachingService.startConversation({ target_user_id: coach.user_id || coach.id }).subscribe({
      next: (convo) => {
        this.isStartingChat = false;
        if (convo && convo.id) {
          this.navigateAway(); // Close panel before navigating
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
    if (this.publicPrograms.length === 0) {
      this.isLoadingClasses = true;
    }
    this.classActionError = '';
    this.sub.add(
      this.coachingService.getPublicPrograms().subscribe({
        next: (res) => {
          this.publicPrograms = res || [];
          this.isLoadingClasses = false;
          if (Array.isArray(res)) {
            CoachingPanelComponent.cachedPublicPrograms = res;
            void setCachedData(CACHE_KEYS.COACH_CLASSES, res);
          }
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
    if (this.clients.length === 0 && CoachingPanelComponent.cachedClients.length === 0) {
      this.isLoadingClients = true;
    }
    this.sub.add(
      this.coachingService.getCoachClients().subscribe({
        next: (res) => {
          this.clients = res || [];
          this.isLoadingClients = false;
          if (Array.isArray(res)) {
            CoachingPanelComponent.cachedClients = res;
            void setCachedData(CACHE_KEYS.COACH_CLIENTS, res);
          }
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
          if (Array.isArray(res)) {
            CoachingPanelComponent.cachedConversations = res;
            void setCachedData(CACHE_KEYS.COACH_CONVERSATIONS, res);
          }
        },
        error: (err) => {
          console.error('Failed to load conversations', err);
        },
      }),
    );
  }

  openConversation(convo: Conversation) {
    if (convo.unread_count > 0) {
      convo.unread_count = 0;
      this.coachingService.markConversationAsRead(convo.id);
      CoachingPanelComponent.cachedConversations = this.conversations;
      void setCachedData(CACHE_KEYS.COACH_CONVERSATIONS, this.conversations);
    }
    this.navigateAway(); // Close panel before navigating
    this.router.navigate(['/chat', convo.id]);
  }

  /** Opens the chat thread for one of the coach's clients (My Clients tab). */
  openClientChat(item: CoachClientItem): void {
    const convo = this.conversations.find((c) => c.id === item.conversation_id);
    if (convo && convo.unread_count > 0) {
      convo.unread_count = 0;
      this.coachingService.markConversationAsRead(item.conversation_id);
      CoachingPanelComponent.cachedConversations = this.conversations;
      void setCachedData(CACHE_KEYS.COACH_CONVERSATIONS, this.conversations);
    } else {
      this.coachingService.markConversationAsRead(item.conversation_id);
    }
    this.navigateAway(); // Close panel before navigating
    this.router.navigate(['/chat', item.conversation_id]);
  }
}
