// schedule.page.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonFooter,
  IonFab,
  IonFabButton,
  IonIcon,
  IonModal,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { CoachingService } from '../services/coaching.service';
import { NotificationCenterService } from '../services/notification-center.service';
import { WorkoutTrackerService } from '../services/workout-tracker.service';
import { NoNegativeDirective } from '../directives/no-negative.directive';
import { HeaderComponent } from '../shared/header/header.component';
import { NotificationPanelComponent } from '../shared/notification-panel/notification-panel.component';
import { CoachingPanelComponent } from '../shared/coaching-panel/coaching-panel.component';
import { CoachingNavService, CoachingPanelTab } from '../services/coaching-nav.service';
import { ExerciseListEditorComponent } from '../shared/exercise-list-editor/exercise-list-editor.component';
import { PullToRefreshComponent } from '../shared/pull-to-refresh/pull-to-refresh.component';
import { OnboardingService, TourStep } from '../services/onboarding.service';
import { ToastService } from '../services/toast.service';
import { API_URL } from '../config/api.config';
import { buildExercisesFromTemplate, workoutTypes as sharedWorkoutTypes, getSuggestedTargets as sharedGetSuggestedTargets, getTargetPlaceholder as sharedGetTargetPlaceholder } from '../data/workout-templates';
import type { WeekPlanTemplateDay, StoredWorkoutSession } from '../services/workout-tracker.service';

// ── Interfaces ────────────────────────────────────────────

export interface DayItem {
  name: string;
  num: number;
  date: Date;
  hasSession: boolean;
  active: boolean;
}

export type SessionStatus = 'upcoming' | 'optional' | 'missed' | 'done';

export interface Exercise {
  name: string;
  sets: number;
  reps: string; // e.g. "12", "12-15", "failure", "30s"
  done?: boolean;
}

export interface WorkoutSession {
  id?: string;
  timeVal: string;
  timeAmpm: string;
  title: string;
  duration: string;
  location: string;
  coach: string;
  membersCount: number;
  status: SessionStatus;
  customTarget?: string;  // e.g. "Back & Bicep", "Chest & Tricep"
  isCustom?: boolean;
  exercises?: Exercise[];
  /** Explicit "no workout needed today" flag — see WorkoutTrackerService.StoredWorkoutSession (Stage 3). */
  isRestDay?: boolean;
}

export interface HomeWorkout {
  visible: boolean;
  exercises: string[];
  sessionTitle?: string;
}

export interface EditBuffer {
  timeRaw: string;
  duration: string;
  coach: string;
  location: string;
  customTarget: string;
  exercises: Exercise[];
}

export interface WeekPlanDay {
  title: string;
  customTarget: string;
  duration: string;
  coach: string;
  location: string;
  time: string;
  isRest: boolean;
  exercises: Exercise[];
}

export interface WorkoutHistoryItem {
  displayDate: string;
  dateKey: string;
  sessions: WorkoutSession[];
}

// ── Component ─────────────────────────────────────────────

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.page.html',
  styleUrls: ['./schedule.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonFooter,
    IonFab,
    IonFabButton,
    IonIcon,
    IonModal,
    NoNegativeDirective,
    HeaderComponent,
    NotificationPanelComponent,
    CoachingPanelComponent,
    ExerciseListEditorComponent,
    PullToRefreshComponent,
  ],
})
export class SchedulePage implements OnInit, OnDestroy {

  handleRefresh(event: any): void {
    try {
      this.applyUserContext();
      this.seedWeekSessions();
      this.seedMonthSessions();
      this.buildWeekStrip();
      this.renderSessions();
      void this.workoutTracker.pullFromServer();
      void this.notificationCenter.refreshNotifications();
    } finally {
      setTimeout(() => {
        event?.target?.complete();
      }, 700);
    }
  }

  private readonly api = API_URL;
  profileImage = '';
  initials = 'U';
  /** Coach icon badge — mirrors Dashboard's coachUnreadCount via the shared
   *  CoachingService.unreadCount$ BehaviorSubject so it stays in sync across pages. */
  coachUnreadCount = 0;

  // ── Constants ────────────────────────────────────────────
  private readonly DAY_NAMES   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  private readonly DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  private readonly MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];

  readonly workoutTypes = sharedWorkoutTypes;

  readonly coaches   = ['Coach Ethan', 'Coach Ryza', 'Coach Marco'];
  readonly locations = ['Gym Floor B','Cardio Area','Weights Area','Functional Zone','Home'];
  readonly durationOptions = ['30 min','45 min','60 min','75 min','90 min'];

  // ── Suggested targets per workout type ───────────────────
  // getSuggestedTargets()/getTargetPlaceholder() below delegate directly to
  // ../data/workout-templates.ts (shared with the coach's Propose Workout
  // Plan modal) — no local copy of the map is kept here anymore.

  // Home workout alternatives per workout type (string format for hw-card)
  private readonly homeWorkoutMap: Record<string, string[]> = {
    'Upper Body':           ['3 × 15 Push-ups','3 × 12 Tricep Dips','3 × 10 Pike Push-ups','2 × 15 Diamond Push-ups'],
    'Lower Body / Leg Day': ['3 × 15 Squats','3 × 12 Lunges each leg','3 × 20 Calf Raises','2 × 30s Wall Sit'],
    'Cardio & Core':        ['3 × 20 Mountain Climbers','3 × 15 Burpees','3 × 30 Bicycle Crunches','2 min Jump Rope'],
    'Full Body':            ['3 × 10 Burpees','3 × 12 Push-ups','3 × 15 Squats','3 × 20 Jumping Jacks'],
    'Mobility & Stretch':   ['2 min Hip Flexor Stretch','2 min Hamstring Stretch','90s Shoulder Mobility','2 min Cat-Cow Flow'],
    'Rest Day':             ['10 min Light Walk','5 min Deep Breathing','Foam Roll 15 min','Hydrate & Rest'],
  };

  // ── State ────────────────────────────────────────────────

  private baseDate: Date = (() => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon ... 6=Sat
    const diff = day === 0 ? -6 : 1 - day; // offset to Monday
    const mon = new Date(today);
    mon.setDate(today.getDate() + diff);
    mon.setHours(0, 0, 0, 0);
    return mon;
  })();

  private selectedDayIndex: number = (() => {
    const day = new Date().getDay(); // 0=Sun
    return day === 0 ? 6 : day - 1; // Mon=0 ... Sun=6
  })();

  weekDays: DayItem[] = [];
  sessions: WorkoutSession[] = [];
  private trackerSubscription?: Subscription;

  monthLabel        = '';
  selectedDayLabel  = '';

  // ── Card expand/edit ──────────────────────────────────────
  expandedCard: number | null = null;
  editBuffer: EditBuffer = { timeRaw: '', duration: '', coach: '', location: '', customTarget: '', exercises: [] };

  // Sessions list for the selected day shows only ONE session card by
  // default — tapping "View all" below it expands to show every session
  // scheduled that day. Mirrors the same pattern on the Dashboard page.
  showAllSessions = false;

  toggleShowAllSessions(): void {
    this.showAllSessions = !this.showAllSessions;
    // Closing back to the single-card view can hide whichever session was
    // mid-edit; close the edit panel too so it never stays open on a card
    // the member can no longer see.
    this.expandedCard = null;
  }

  /**
   * Sort priority used by sortedSessions below: still-actionable sessions
   * (upcoming/optional — the member can still do these) always rank above
   * 'missed' (already past, can't be completed on time anymore), which in
   * turn ranks above 'done' (already finished — nothing left to do here).
   * Keeping missed sessions out of the same bucket as upcoming ones (the
   * old behavior) let an old missed morning session sit above an
   * actionable session later today just because it happened earlier in
   * the day — confusing, since the actionable one is what the member
   * actually needs to see first.
   */
  private statusSortRank(status: SessionStatus): number {
    if (status === 'done') return 2;
    if (status === 'missed') return 1;
    return 0; // upcoming / optional — still actionable
  }

  /**
   * this.sessions sorted by statusSortRank first (actionable → missed →
   * done), then by scheduled time ascending within each group — so the
   * next thing the member can actually still do is always what's on top /
   * shown first, resolved sessions (missed or done) sink below it.
   */
  get sortedSessions(): WorkoutSession[] {
    return [...this.sessions].sort((a, b) => {
      const rankDiff = this.statusSortRank(a.status) - this.statusSortRank(b.status);
      if (rankDiff !== 0) return rankDiff;

      const aTime = this.to24(a.timeVal, a.timeAmpm);
      const bTime = this.to24(b.timeVal, b.timeAmpm);
      return aTime.localeCompare(bTime);
    });
  }

  /** What the template actually renders: just the top card unless the member has tapped "View all". */
  get displayedSessions(): WorkoutSession[] {
    const sorted = this.sortedSessions;
    return this.showAllSessions ? sorted : sorted.slice(0, 1);
  }

  /**
   * Real index of a session within the unsorted this.sessions array. The
   * template iterates displayedSessions — a sorted/sliced VIEW — but every
   * existing action method (toggleEditPanel, cycleStatus, deleteSession,
   * saveEdit, expandedCard tracking) is index-based against this.sessions,
   * so the template resolves the real index through this helper rather than
   * using the display loop's own index, which would no longer line up.
   * Sorting is done via a shallow copy ([...this.sessions].sort(...)), so
   * elements are the SAME object references — indexOf() reliably finds
   * the matching entry.
   */
  sessionIndex(session: WorkoutSession): number {
    return this.sessions.indexOf(session);
  }

  trackBySession(index: number, item: WorkoutSession): string {
    return item.id || `${item.title}_${item.timeVal}_${item.timeAmpm}_${index}`;
  }

  trackByExercise(index: number, ex: any): string {
    return ex.name || String(index);
  }

  trackByIndex(index: number): number {
    return index;
  }

  // ── Add modal ─────────────────────────────────────────────
  addModalOpen             = false;
  newWorkoutType           = 'Upper Body';
  newWorkoutCustomTarget   = '';
  newWorkoutDate           = '';
  newWorkoutTime           = '';
  newWorkoutDuration       = '60 min';
  // Backing numeric value for the free-typing duration input in the Add
  // Workout modal (see onDurationInputChange/selectDurationPreset below).
  // Kept in sync with newWorkoutDuration (the "NN min" string every other
  // part of the app — saveWorkout(), session display, durationToMinutes()
  // parsing — already expects) so nothing downstream needed to change.
  newWorkoutDurationMinutes: number | null = 60;
  // Unit currently shown in the Min/Hrs toggle. Purely a display concern —
  // newWorkoutDurationMinutes (and therefore newWorkoutDuration) always
  // stays in minutes no matter which unit is selected.
  newWorkoutDurationUnit: 'min' | 'hrs' = 'min';
  // Raw value bound to the duration <input>, interpreted according to
  // newWorkoutDurationUnit. Kept separate from newWorkoutDurationMinutes so
  // the field can hold a decimal (e.g. "1.5" hrs) without it being truncated.
  newWorkoutDurationInputValue: number | null = 60;
  newWorkoutCoach          = '';
  newWorkoutLocation       = 'Gym Floor B';
  newWorkoutExercises: Exercise[] = [];
  newWorkoutTimeWarning    = ''; // Time validation warning

  // ── Home workout card ─────────────────────────────────────
  homeWorkout: HomeWorkout = { visible: false, exercises: [], sessionTitle: '' };
  homeWorkoutModalOpen = false;

  // ── History modal ─────────────────────────────────────────
  historyModalOpen = false;
  historyItems: WorkoutHistoryItem[] = [];

  // ── Week Plan modal ───────────────────────────────────────
  private readonly WEEK_PLAN_KEY = 'fordago_week_plan_v1';
  weekPlanModalOpen = false;
  weekPlanDays: WeekPlanDay[] = this.buildDefaultWeekPlanDays();
  weekPlanActiveDay = 0;
  weekPlanSaved = false;

  // ── Lifecycle ────────────────────────────────────────────

  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthService,
    private notificationCenter: NotificationCenterService,
    private workoutTracker: WorkoutTrackerService,
    private coachingNav: CoachingNavService,
    private coachingService: CoachingService,
    public onboardingService: OnboardingService,
    private toast: ToastService,
  ) {}

  /**
   * Reopens the coaching panel straight to Messages if we landed here via
   * ChatPage's back button (see coaching-nav.service.ts). One-shot --
   * consumeReopen() clears itself, so a normal visit to Schedule is
   * completely unaffected.
   *
   * Called from BOTH ngOnInit() (first mount) and ionViewWillEnter()
   * (every re-entry) -- Ionic's router-outlet caches previously-visited
   * pages, so navigating Schedule -> Chat -> back reuses the SAME
   * SchedulePage instance instead of destroying/recreating it, and only
   * fires ionViewWillEnter(), never ngOnInit() again. Relying on ngOnInit()
   * alone silently dropped the pending tab on that path, leaving the
   * member stranded on a plain Schedule page instead of back in Personal
   * Coaches/Messages.
   */
  private applyPendingCoachingReopen(): void {
    const pendingCoachTab = this.coachingNav.consumeReopen('schedule');
    if (pendingCoachTab) {
      this.coachingPanelInitialTab = pendingCoachTab;
      this.coachingPanelOpen = true;
    }
  }

  ngOnInit(): void {
    this.applyPendingCoachingReopen();

    // Keep coach badge in sync on this page
    this.coachingService.unreadCount$.subscribe((count) => { this.coachUnreadCount = count; });

    this.applyUserContext();
    this.workoutTracker.startAutoSync();
    this.seedWeekSessions();
    this.seedMonthSessions();
    this.buildWeekStrip();
    this.renderSessions();
    // Pull server-side sessions into the local store — e.g. a workout plan
    // a coach proposed and the member just accepted in chat, which
    // ProposalController::accept() writes straight into workout_sessions
    // on the backend. Without this call the Schedule page NEVER learns
    // about that row unless the member happens to visit the Dashboard
    // first (the only other page that calls pullFromServer()) — the local
    // store above is only seeded from templates, not synced from the
    // server, so an accepted proposal silently never showed up here.
    // Fire-and-forget: writeStore() inside pullFromServer() fires
    // updates$, which the subscription below already listens to, so the
    // currently-viewed day updates itself the moment the pull resolves.
    void this.workoutTracker.pullFromServer();
    // Keep the displayed sessions in sync with the tracker's background
    // store even while the member stays on this page without navigating
    // away and back — e.g. the periodic 15s status poll in
    // WorkoutTrackerService.startAutoSync() flipping a session to 'missed'
    // the moment its scheduled time passes. Calls refreshSessionsView()
    // (read-only) rather than renderSessions() on purpose: renderSessions()
    // always re-saves via saveSessionsForDate() — which itself fires this
    // same updates$ stream — so wiring it directly here would recurse.
    this.trackerSubscription = this.workoutTracker.updates$.subscribe(() => {
      this.refreshSessionsView();
    });
  }

  ngOnDestroy(): void {
    this.trackerSubscription?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.applyPendingCoachingReopen();

    this.applyUserContext();
    this.workoutTracker.syncStoreStatuses();
    this.seedMonthSessions();
    this.buildWeekStrip();
    this.renderSessions();
    // Same reasoning as ngOnInit() above — re-pull on every re-entry (not
    // just first mount) so a proposal accepted in chat, then immediately
    // followed by Schedule via the bottom nav, shows up without the member
    // needing to detour through the Dashboard first.
    void this.workoutTracker.pullFromServer();

    this.checkAndStartScheduleTour();
  }

  private checkAndStartScheduleTour(): void {
    const user = this.auth.user;
    if (!user || user.role === 'admin' || user.role === 'coach') return;

    setTimeout(() => {
      if (this.onboardingService.isRunning || this.coachingPanelOpen) return;

      const steps: TourStep[] = [
        {
          targetId: '#tour-schedule-calendar',
          title: '7-Day Workout Calendar',
          description: 'Tap any day of the week to view scheduled workout sessions or plan your training days.',
          icon: 'calendar-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-schedule-history-btn',
          title: 'Workout History & Logs',
          description: 'Review your past workout logs, completion history, and training attendance records.',
          icon: 'time-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-schedule-plan-btn',
          title: '7-Day Week Plan Builder',
          description: 'Create and customize a recurring weekly workout split that automatically fills your schedule.',
          icon: 'calendar-number-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-schedule-exercises',
          title: 'Exercise Routine (Sets × Reps)',
          description: 'See the full breakdown of movements for this session with designated set and rep targets (e.g. Cable Crunch 4×15-20).',
          icon: 'clipboard-outline',
          position: 'top',
        },
        {
          targetId: '#tour-schedule-card-actions',
          title: 'Workout Actions (Edit, Done, Delete)',
          description: 'Tap "Mark Done" once you finish training to log attendance and increase your streak. Use "Edit" to adjust exercises/time, or "Delete" to cancel.',
          icon: 'checkmark-circle-outline',
          position: 'top',
        },
        {
          targetId: '#tour-schedule-add-btn',
          title: 'Add New Workout (+)',
          description: 'Tap this button anytime to schedule a custom workout session with specific muscle targets and exercises.',
          icon: 'add-outline',
          position: 'top',
        },
      ];

      const available = steps.filter((s) => !!document.querySelector(s.targetId));
      if (available.length > 0) {
        this.onboardingService.startTour('schedule_main', available, false, user.id);
      }
    }, 700);
  }

  public checkAndStartAddWorkoutTour(): void {
    const user = this.auth.user;
    if (!user || user.role === 'admin' || user.role === 'coach') return;

    setTimeout(() => {
      if (this.onboardingService.isRunning) return;

      const steps: TourStep[] = [
        {
          targetId: '#tour-add-workout-type',
          title: 'Select Workout Type',
          description: 'Choose your workout focus (Upper Body, Lower Body, Core, Cardio) or enter a custom target.',
          icon: 'barbell-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-add-workout-date',
          title: 'Schedule Date & Time',
          description: 'Set the date and starting time for your workout session.',
          icon: 'calendar-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-add-workout-duration',
          title: 'Workout Duration',
          description: 'Set the expected session duration using quick chips or typing custom minutes.',
          icon: 'time-outline',
          position: 'top',
        },
        {
          targetId: '#tour-add-workout-location',
          title: 'Gym Location',
          description: 'Choose which gym floor or area you will be training in — e.g. Gym Floor A or Gym Floor B.',
          icon: 'location-outline',
          position: 'top',
        },
        {
          targetId: '#tour-add-workout-exercises',
          title: 'My Exercises (Optional)',
          description: 'Tap "+ Add" to build your own custom exercise list. Leave it empty and we\'ll suggest a recommended routine based on your workout type.',
          icon: 'barbell-outline',
          position: 'top',
        },
        {
          targetId: '#tour-add-workout-save-btn',
          title: 'Save to Schedule',
          description: 'Tap Save Workout to add this session to your calendar and track your routine.',
          icon: 'checkmark-circle-outline',
          position: 'top',
        },
      ];

      const available = steps.filter((s) => !!document.querySelector(s.targetId));
      if (available.length > 0) {
        this.onboardingService.startTour('schedule_add_modal', available, false, user.id);
      }
    }, 450);
  }

  public checkAndStartWeekPlanTour(): void {
    const user = this.auth.user;
    if (!user || user.role === 'admin' || user.role === 'coach') return;

    setTimeout(() => {
      if (this.onboardingService.isRunning) return;

      const steps: TourStep[] = [
        {
          targetId: '#tour-week-plan-tabs',
          title: 'Day-by-Day Selector',
          description: 'Select each day (Monday to Sunday) to customize your daily split.',
          icon: 'calendar-number-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-week-plan-rest',
          title: 'Rest Day Toggle',
          description: 'Toggle on Rest Day to mark recovery days, or turn off to configure workout routines.',
          icon: 'moon-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-week-plan-type',
          title: 'Workout Category',
          description: 'Select your target category such as Upper Body, Lower Body, Core & Abs, or Cardio.',
          icon: 'barbell-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-week-plan-target',
          title: 'Muscle Target Suggestions',
          description: 'Tap suggested focus chips (e.g. Back & Bicep, Chest & Tricep) or type a custom target.',
          icon: 'locate-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-week-plan-time',
          title: 'Time & Session Duration',
          description: 'Set your preferred gym start time and workout session duration.',
          icon: 'time-outline',
          position: 'top',
        },
        {
          targetId: '#tour-week-plan-exercises',
          title: 'Build Exercise List',
          description: 'Tap "+ Add Exercise" to specify custom movements, set counts, and target repetitions.',
          icon: 'clipboard-outline',
          position: 'top',
        },
        {
          targetId: '#tour-week-plan-save-btn',
          title: 'Apply Weekly Plan',
          description: 'Save this weekly template to automatically auto-fill your workouts every week.',
          icon: 'checkmark-circle-outline',
          position: 'top',
        },
      ];

      const available = steps.filter((s) => !!document.querySelector(s.targetId));
      if (available.length > 0) {
        this.onboardingService.startTour('schedule_week_plan_modal', available, false, user.id);
      }
    }, 450);
  }

  private applyUserContext(): void {
    const user = this.auth.user;
    const username = String(user?.username || '').trim();
    this.initials = username
      ? username.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
    this.profileImage = String(user?.profile_image || '').trim();
  }

  // ── Auto status calculation ────────────────────────────
  /**
   * Returns the effective display status for a session, auto-detecting
   * missed workouts based on current date/time.
   */
  private autoComputeStatus(session: WorkoutSession, dayDate: Date): SessionStatus {
    return this.workoutTracker.autoComputeStatus(session, dayDate);
  }

  private sendMissedNotification(sessionTitle: string, dayDate: Date, homeExercises: string[]): void {
    void this.notificationCenter.notifyMissedWorkout(
      sessionTitle,
      dayDate,
      `${this.dateKey(dayDate)}-${sessionTitle}`,
      homeExercises
    );
  }

  private getHomeWorkoutListForTitle(sessionTitle: string): string[] {
    return this.homeWorkoutMap[sessionTitle] ?? this.homeWorkoutMap['Full Body'];
  }

  // ── Helpers ──────────────────────────────────────────────

  private dateKey(d: Date): string {
    return this.workoutTracker.getDateKey(d);
  }

  private to24(time: string, ampm: string): string {
    let [h, m] = time.split(':').map(Number);
    if (ampm === 'PM' && h !== 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }

  private to12(time24: string): { time: string; ampm: 'AM' | 'PM' } {
    if (!time24) return { time: '12:00', ampm: 'AM' };
    let [h, m] = time24.split(':').map(Number);
    const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    h = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return { time: `${h}:${String(m).padStart(2,'0')}`, ampm };
  }

  private readStoredSessions(): Record<string, WorkoutSession[]> {
    return this.workoutTracker.readStore() as Record<string, WorkoutSession[]>;
  }

  private writeStoredSessions(store: Record<string, WorkoutSession[]>): void {
    this.workoutTracker.writeStore(store);
  }

  /** Delegates to the shared workout-templates data source (see ../data/workout-templates.ts) so this stays in sync with WorkoutTrackerService's own month-seeding. */
  private buildExercises(title: string, customTarget?: string): Exercise[] {
    return buildExercisesFromTemplate(title, customTarget);
  }

  /**
   * Delegates day-seeding to WorkoutTrackerService.buildDaySessions() — the
   * single shared implementation of rest-day/template logic — instead of
   * re-deriving it locally. Casts across the two pages' near-identical
   * WorkoutSession/StoredWorkoutSession shapes (runtime-compatible; the
   * only static difference is `reps: string` vs `string | number`), then
   * runs the result through this page's own normalizeSession() so ids and
   * exercise arrays stay in the shape the rest of this page expects.
   * (Stage 3 follow-up: previously seedWeekSessions/seedMonthSessions/
   * applyWeekPlanToCurrentWeek each had their own copy of this logic that
   * still wrote `[]` for rest days, so which page seeded a day first could
   * silently determine whether the dashboard's streak logic saw a proper
   * rest-day flag or a blank record.)
   */
  private buildDaySessionsFromTracker(dayIdx: number, template: WeekPlanDay[] | null): WorkoutSession[] {
    const built = this.workoutTracker.buildDaySessions(dayIdx, template as unknown as WeekPlanTemplateDay[] | null);
    return (built as unknown as WorkoutSession[]).map(session => this.normalizeSession(session));
  }

  private normalizeSession(session: WorkoutSession): WorkoutSession {
    return {
      ...session,
      id: session.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      customTarget: session.customTarget?.trim() || undefined,
      exercises: session.exercises?.length
        ? session.exercises.map(ex => ({ ...ex }))
        : this.buildExercises(session.title, session.customTarget),
    };
  }

  private getStoredSessionsForDate(dayDate: Date, fallbackIndex?: number): WorkoutSession[] {
    const store = this.readStoredSessions();
    const key = this.dateKey(dayDate);
    const saved = store[key];
    // Check key EXISTENCE, not array length — an empty array here means
    // the member intentionally deleted every session for this day (now a
    // rest day) and must stay empty. Checking `.length` treated that
    // empty-but-present array the same as "never seeded" (0 is falsy),
    // which silently re-seeded deleted sessions back on the next render.
    if (saved) {
      return saved.map(session => this.normalizeSession(session));
    }

    if (fallbackIndex === undefined) return [];
    return this.buildDaySessionsFromTracker(fallbackIndex, this.loadWeekPlanTemplate());
  }

  private saveSessionsForDate(dayDate: Date, sessions: WorkoutSession[]): void {
    const store = this.readStoredSessions();
    const key = this.dateKey(dayDate);
    store[key] = sessions.map(session => this.normalizeSession(session));
    this.writeStoredSessions(store);
  }

  private seedWeekSessions(): void {
    const store = this.readStoredSessions();
    const template = this.loadWeekPlanTemplate();
    let changed = false;

    for (let i = 0; i < 7; i++) {
      const d = new Date(this.baseDate);
      d.setDate(this.baseDate.getDate() + i);
      const key = this.dateKey(d);
      if (store[key]) continue; // already seeded

      store[key] = this.buildDaySessionsFromTracker(i, template);
      changed = true;
    }

    if (changed) {
      this.writeStoredSessions(store);
    }
  }

  /**
   * Pre-seeds the ENTIRE current calendar month (not just the currently
   * viewed 7-day week) so anything relying on the stored schedule — most
   * importantly the dashboard's "Upcoming Schedules" (This Month) stat —
   * reflects the true number of sessions for the month, even for days the
   * member hasn't scrolled to yet on this page. Idempotent: only writes
   * days that aren't already in the store, so it never clobbers existing
   * progress (done/missed/edited sessions are left untouched).
   */
  private seedMonthSessions(): void {
    const store = this.readStoredSessions();
    const template = this.loadWeekPlanTemplate();
    let changed = false;

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const key = this.dateKey(d);
      if (store[key]) continue; // already seeded (e.g. by seedWeekSessions or a prior visit)

      // Convert JS's Sunday-first getDay() (0=Sun..6=Sat) into the
      // Monday-first index (0=Mon..6=Sun) that defaultSessionsByDayIdx /
      // the saved week-plan template both use.
      const jsDay = d.getDay();
      const idx = jsDay === 0 ? 6 : jsDay - 1;

      store[key] = this.buildDaySessionsFromTracker(idx, template);
      changed = true;
    }

    if (changed) {
      this.writeStoredSessions(store);
    }
  }

  // ── Exercise lookup ───────────────────────────────────────

  /**
   * Returns exercises for a session.
   * Priority: "WorkoutType|CustomTarget" → "WorkoutType" → []
   */
  getExercises(session: WorkoutSession): Exercise[] {
    if (session.exercises?.length) {
      return session.exercises;
    }
    return this.buildExercises(session.title, session.customTarget);
  }

  /** Exercises shown in the modal preview */
  getModalExercises(): Exercise[] {
    return this.buildExercises(this.newWorkoutType, this.newWorkoutCustomTarget);
  }

  // ── Suggested targets & target placeholder ────────────────

  getSuggestedTargets(workoutType: string): string[] {
    return sharedGetSuggestedTargets(workoutType);
  }

  getTargetPlaceholder(workoutType: string): string {
    return sharedGetTargetPlaceholder(workoutType);
  }

  selectTarget(target: string): void {
    this.newWorkoutCustomTarget = this.newWorkoutCustomTarget === target ? '' : target;
  }

  onWorkoutTypeChange(type: string): void {
    this.newWorkoutCustomTarget = ''; // reset when workout type changes
    this.newWorkoutExercises = [];
  }

  // ── Week Strip ───────────────────────────────────────────

  buildWeekStrip(): void {
    this.seedWeekSessions();
    const days: DayItem[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.baseDate);
      d.setDate(this.baseDate.getDate() + i);

      const storedSessions = this.getStoredSessionsForDate(d, i);
      const hasSession = storedSessions.length > 0;

      days.push({
        name:      this.DAY_SHORT[d.getDay()],
        num:       d.getDate(),
        date:      d,
        hasSession,
        active:    i === this.selectedDayIndex,
      });
    }
    this.weekDays = days;
    this.updateMonthLabel();
  }

  private updateMonthLabel(): void {
    const first = this.weekDays[0].date;
    const last  = this.weekDays[6].date;
    this.monthLabel = first.getMonth() === last.getMonth()
      ? `${this.MONTH_NAMES[first.getMonth()]} ${first.getFullYear()}`
      : `${this.MONTH_NAMES[first.getMonth()]} – ${this.MONTH_NAMES[last.getMonth()]} ${first.getFullYear()}`;
  }

  selectDay(day: DayItem, index: number): void {
    this.weekDays.forEach(d => (d.active = false));
    day.active            = true;
    this.selectedDayIndex = index;
    this.expandedCard     = null;
    this.showAllSessions  = false;
    this.renderSessions();
  }

  prevWeek(): void {
    this.baseDate = new Date(this.baseDate);
    this.baseDate.setDate(this.baseDate.getDate() - 7);
    this.selectedDayIndex = 0;
    this.showAllSessions  = false;
    this.buildWeekStrip();
    this.renderSessions();
  }

  nextWeek(): void {
    this.baseDate = new Date(this.baseDate);
    this.baseDate.setDate(this.baseDate.getDate() + 7);
    this.selectedDayIndex = 0;
    this.showAllSessions  = false;
    this.buildWeekStrip();
    this.renderSessions();
  }

  // ── Sessions ─────────────────────────────────────────────

  renderSessions(): void {
    this.workoutTracker.syncStoreStatuses();
    const selected = this.weekDays[this.selectedDayIndex];
    const dayDate  = selected?.date ?? this.baseDate;
    const all = this.getStoredSessionsForDate(dayDate, this.selectedDayIndex);

    // Auto-compute status for each session (detect missed workouts)
    all.forEach(s => {
      const computed = this.autoComputeStatus(s, dayDate);
      if (computed === 'missed' && s.status !== 'done') {
        if (s.status !== 'missed') {
          s.status = 'missed';
          this.sendMissedNotification(s.title, dayDate, this.getHomeWorkoutListForTitle(s.title));
        }
      } else if (s.status !== 'done') {
        s.status = computed;
      }
    });

    this.sessions = all.map(session => this.normalizeSession(session));
    this.saveSessionsForDate(dayDate, this.sessions);
    this.selectedDayLabel = `${this.DAY_NAMES[dayDate.getDay()]}, ${this.MONTH_NAMES[dayDate.getMonth()]} ${dayDate.getDate()}`;

    const missed = this.sessions.find(s => s.status === 'missed');
    this.homeWorkout = missed
      ? { visible: true, exercises: this.getHomeWorkoutListForTitle(missed.title), sessionTitle: missed.title }
      : { visible: false, exercises: [], sessionTitle: '' };
  }

  /**
   * Read-only counterpart to renderSessions(): re-reads the SELECTED day's
   * sessions straight from the tracker store and refreshes what's shown,
   * without writing anything back. Used by the updates$ subscription in
   * ngOnInit() so a background status change (missed-poll, server pull,
   * another push) shows up immediately here even if the member never
   * leaves/re-enters this page. Deliberately skipped if the selected day
   * has no store entry yet — seeding/normal renderSessions() owns that
   * path, this method only mirrors what's already there.
   */
  private refreshSessionsView(): void {
    const selected = this.weekDays[this.selectedDayIndex];
    const dayDate = selected?.date ?? this.baseDate;
    const key = this.dateKey(dayDate);
    const store = this.readStoredSessions();
    const daySessions = store[key];
    if (!daySessions) return;

    this.sessions = daySessions.map(session => this.normalizeSession(session));

    const missed = this.sessions.find(s => s.status === 'missed');
    this.homeWorkout = missed
      ? { visible: true, exercises: this.getHomeWorkoutListForTitle(missed.title), sessionTitle: missed.title }
      : { visible: false, exercises: [], sessionTitle: '' };
  }

  openHomeWorkoutModal(): void {
    this.homeWorkoutModalOpen = true;
  }

  closeHomeWorkoutModal(): void {
    this.homeWorkoutModalOpen = false;
  }

  // ── Card Actions ─────────────────────────────────────────

  editDurationMinutes: number | null = 60;
  editDurationUnit: 'min' | 'hrs' = 'min';
  editDurationInputValue: number | null = 60;

  toggleEditPanel(index: number, event: Event): void {
    event.stopPropagation();
    if (this.expandedCard === index) { this.expandedCard = null; return; }

    const s = this.sessions[index];
    const exercises = this.getExercises(s).map(ex => ({ ...ex }));
    const durationMatch = (s.duration || '').match(/(\d+)/);
    const initialMins = durationMatch ? Number(durationMatch[1]) : 60;
    this.editDurationMinutes = initialMins;
    this.editDurationUnit = 'min';
    this.editDurationInputValue = initialMins;

    this.editBuffer = {
      timeRaw:      this.to24(s.timeVal, s.timeAmpm),
      duration:     s.duration || `${initialMins} min`,
      coach:        s.coach,
      location:     s.location,
      customTarget: s.customTarget ?? '',
      exercises,
    };
    this.expandedCard = index;
  }

  onEditDurationInputChange(value: number | string | null): void {
    if (value === null || value === undefined || value === '') {
      this.editDurationInputValue = null;
      return;
    }
    const numeric = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(numeric)) return;

    this.editDurationInputValue = numeric;
    if (numeric <= 0) return;

    const minutesValue = this.editDurationUnit === 'hrs' ? numeric * 60 : numeric;
    const clamped = this.clampDurationMinutes(minutesValue);
    this.editDurationMinutes = clamped;
    this.editBuffer.duration = `${clamped} min`;
  }

  onEditDurationUnitChange(unit: 'min' | 'hrs'): void {
    if (this.editDurationUnit === unit) return;
    this.editDurationUnit = unit;
    const minutes = this.editDurationMinutes ?? this.clampDurationMinutes(60);
    this.editDurationInputValue = unit === 'hrs'
      ? Math.round((minutes / 60) * 100) / 100
      : minutes;
  }

  selectEditDurationPreset(preset: string): void {
    const match = preset.match(/(\d+)/);
    const minutes = match ? this.clampDurationMinutes(Number(match[1])) : this.editDurationMinutes;
    this.editDurationMinutes = minutes;
    this.editBuffer.duration = preset;
    this.editDurationUnit = 'min';
    this.editDurationInputValue = minutes;
  }

  saveEdit(index: number): void {
    const s = this.sessions[index];
    if (!s) return;

    const { time, ampm } = this.to12(this.editBuffer.timeRaw);
    s.timeVal     = time;
    s.timeAmpm    = ampm;
    s.duration    = this.editBuffer.duration;
    s.coach       = this.editBuffer.coach;
    s.location    = this.editBuffer.location;
    s.customTarget = this.editBuffer.customTarget.trim() || undefined;

    // Use exercises from buffer (custom edits) if any are non-empty, else rebuild from type/target
    const validExercises = this.editBuffer.exercises.filter(ex => ex.name.trim() !== '');
    s.exercises = validExercises.length > 0
      ? validExercises.map(ex => ({ ...ex }))
      : this.buildExercises(s.title, s.customTarget);

    const editedDayDate = this.weekDays[this.selectedDayIndex].date;
    // If the session is not completed, re-evaluate its status for the new time
    // so editing a missed session to a future time resets it to 'upcoming'
    if (s.status !== 'done') {
      s.status = this.workoutTracker.autoComputeStatus(s as unknown as StoredWorkoutSession, editedDayDate);
    }

    this.expandedCard = null;
    this.saveSessionsForDate(editedDayDate, this.sessions);
    // Push this edit to the backend immediately — without this the edit
    // stays local-only and gets silently reverted the next time
    // WorkoutTrackerService.pullFromServer() merges the (stale) server copy
    // back into the local store (e.g. on the next Dashboard visit).
    this.workoutTracker.pushSession(editedDayDate, s as unknown as StoredWorkoutSession);
    void this.workoutTracker.scheduleMissedChecks();
    this.workoutTracker.scheduleUpcomingReminders();
    this.renderSessions();
    this.toast.success('Workout updated!');
  }

  isAdminScheduled(session?: WorkoutSession): boolean {
    return typeof session?.id === 'string' && session.id.startsWith('admin_class_');
  }

  deleteSession(index: number, event?: Event): void {
    if (event) event.stopPropagation();
    const session = this.sessions[index];
    if (!session) return;

    const dayDate = this.weekDays[this.selectedDayIndex].date;
    const todayKey = this.dateKey(dayDate);
    const uniqueKey = `${todayKey}-${session.id ?? session.title}-${session.timeVal}-${session.timeAmpm}`;
    void this.notificationCenter.cancelNativeWorkoutAlerts(uniqueKey);

    this.sessions.splice(index, 1);
    this.saveSessionsForDate(dayDate, this.sessions);
    // Delete on the backend too — otherwise the deleted session still
    // exists server-side and pullFromServer() re-adds it as a "new"
    // session the next time the local store no longer has a matching id.
    this.workoutTracker.deleteSessionFromServer(dayDate, session.id);

    void this.workoutTracker.scheduleMissedChecks();
    this.workoutTracker.scheduleUpcomingReminders();

    this.expandedCard = null;
    this.buildWeekStrip();
    this.renderSessions();
    this.toast.success('Workout removed from schedule');
  }

  cycleStatus(index: number, event: Event): void {
    event.stopPropagation();
    const s = this.sessions[index];
    if (!s) return;

    const cycle: Record<SessionStatus, SessionStatus> = {
      upcoming: 'done',
      optional: 'done',
      done:     'upcoming',
      missed:   'upcoming',
    };
    s.status = cycle[s.status];
    if (s.exercises?.length) {
      const markDone = s.status === 'done';
      s.exercises = s.exercises.map((exercise) => ({
        ...exercise,
        done: markDone,
      }));
    }
    const dayDate = this.weekDays[this.selectedDayIndex].date;
    this.saveSessionsForDate(dayDate, this.sessions);
    this.workoutTracker.pushSession(dayDate, s as unknown as StoredWorkoutSession);
    this.renderSessions();

    if (s.status === 'done') {
      const todayKey = this.dateKey(dayDate);
      const uniqueKey = `${todayKey}-${s.id ?? s.title}-${s.timeVal}-${s.timeAmpm}`;
      void this.notificationCenter.cancelNativeWorkoutAlerts(uniqueKey);
      this.toast.success('Workout completed! Keep up the streak 🔥');
    }

    void this.workoutTracker.scheduleMissedChecks();
    this.workoutTracker.scheduleUpcomingReminders();
  }

  // ── Add Modal ─────────────────────────────────────────────

  openAddModal(): void {
    const d  = this.weekDays[this.selectedDayIndex]?.date ?? new Date();
    const mm = String(d.getMonth() + 1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    this.newWorkoutDate          = `${d.getFullYear()}-${mm}-${dd}`;
    this.newWorkoutTime          = '07:00';
    this.newWorkoutDuration      = '60 min';
    this.newWorkoutDurationMinutes = 60;
    this.newWorkoutDurationUnit  = 'min';
    this.newWorkoutDurationInputValue = 60;
    this.newWorkoutCoach         = '';
    this.newWorkoutLocation      = 'Gym Floor B';
    this.newWorkoutCustomTarget  = '';
    this.newWorkoutType          = 'Upper Body';
    this.newWorkoutExercises     = [];
    this.addModalOpen            = true;
    this.checkAndStartAddWorkoutTour();
  }

  closeAddModal(): void {
    this.addModalOpen = false;
  }

  saveWorkout(): void {
    if (!this.newWorkoutDate) return;

    const [y, mo, day] = this.newWorkoutDate.split('-').map(Number);
    const targetDate   = new Date(y, mo - 1, day);
    const key          = this.dateKey(targetDate);

    // Check if time is in the past for today
    const now = new Date();
    const todayKey = this.dateKey(now);
    if (key === todayKey) {
      const [inputHour, inputMin] = (this.newWorkoutTime || '07:00').split(':').map(Number);
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      
      if (inputHour < currentHour || (inputHour === currentHour && inputMin <= currentMin)) {
        this.newWorkoutTimeWarning = `⚠ Cannot add workout — ${this.to12String(inputHour, inputMin)} has already passed today`;
        return;
      }
    }

    this.newWorkoutTimeWarning = ''; // Clear warning on success

    const { time, ampm } = this.to12(this.newWorkoutTime || '07:00');

    const validCustomExercises = this.newWorkoutExercises.filter(ex => ex.name.trim() !== '');

    const session: WorkoutSession = this.normalizeSession({
      id:           `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timeVal:      time,
      timeAmpm:     ampm,
      title:        this.newWorkoutType,
      duration:     this.newWorkoutDuration,
      location:     this.newWorkoutLocation,
      coach:        this.newWorkoutCoach,
      membersCount: 0,
      status:       'upcoming',
      customTarget: this.newWorkoutCustomTarget.trim() || undefined,
      isCustom:     true,
      exercises:    validCustomExercises.length > 0 ? validCustomExercises : undefined,
    });

    const store = this.readStoredSessions();
    const sessionsForDate = (store[key] ?? []).map(item => this.normalizeSession(item));
    sessionsForDate.push(session);
    store[key] = sessionsForDate;
    this.writeStoredSessions(store);
    this.workoutTracker.pushSession(targetDate, session as unknown as StoredWorkoutSession);

    // Re-register native Android AlarmManager alarms so the new session fires
    // a notification at the exact scheduled time even when the app is closed/backgrounded.
    // Without this call, scheduleMissedChecks() only runs on app start or internal
    // store mutations — never when schedule.page.ts directly writes to localStorage.
    this.workoutTracker.scheduleMissedChecks();
    this.workoutTracker.scheduleUpcomingReminders();

    const selKey = this.dateKey(this.weekDays[this.selectedDayIndex]?.date ?? new Date());
    if (key === selKey) this.renderSessions();

    this.buildWeekStrip();
    this.closeAddModal();
    this.toast.success('Workout added to schedule!');
  }


  private to12String(hour: number, min: number): string {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12;
    const minStr = min.toString().padStart(2, '0');
    return `${h12}:${minStr} ${ampm}`;
  }

  private clampDurationMinutes(value: number): number {
    if (!Number.isFinite(value)) return 1;
    return Math.min(480, Math.max(1, Math.round(value)));
  }

  /**
   * Fires on every keystroke in the free-typing Duration field. The typed
   * value is interpreted according to newWorkoutDurationUnit (min or hrs)
   * and converted to minutes for newWorkoutDurationMinutes/newWorkoutDuration
   * (the "NN min" string saveWorkout() actually persists) — everything
   * downstream of those two keeps working exactly as before, regardless of
   * which unit the member is typing in.
   *
   * Allows a temporarily empty/invalid field while the member is still
   * typing (e.g. clearing "60" to type "45", or "1" to type "1.5") without
   * snapping back to a stale value mid-edit — newWorkoutDuration simply
   * keeps its last valid value until a valid positive number is entered
   * again. NaN is never assigned to newWorkoutDurationInputValue so the
   * bound <input> can't be pushed into an invalid state.
   */
  onDurationInputChange(value: number | string | null): void {
    if (value === null || value === '') {
      this.newWorkoutDurationInputValue = null;
      return;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) {
      return; // unparseable — ignore and keep the last valid state
    }
    this.newWorkoutDurationInputValue = numeric;
    if (numeric <= 0) {
      // Mid-typing a value like "0.5" passes through "0" first — let it
      // through without touching the canonical minutes/duration yet.
      return;
    }
    const minutesValue = this.newWorkoutDurationUnit === 'hrs' ? numeric * 60 : numeric;
    const clamped = this.clampDurationMinutes(minutesValue);
    this.newWorkoutDurationMinutes = clamped;
    this.newWorkoutDuration = `${clamped} min`;
  }

  /**
   * Handles the Min/Hrs toggle. Re-derives the displayed input value from
   * the current canonical minutes so switching units never loses or
   * corrupts the underlying duration — e.g. 90 min becomes "1.5" when
   * switching to Hrs, and switching back shows "90" again.
   */
  onDurationUnitChange(unit: 'min' | 'hrs'): void {
    if (this.newWorkoutDurationUnit === unit) return;
    this.newWorkoutDurationUnit = unit;
    const minutes = this.newWorkoutDurationMinutes ?? this.clampDurationMinutes(60);
    this.newWorkoutDurationInputValue = unit === 'hrs'
      ? Math.round((minutes / 60) * 100) / 100 // e.g. 90 min -> 1.5
      : minutes;
  }

  /** Tapping a quick-preset chip fills the display string and numeric input (always in minutes) in one step. */
  selectDurationPreset(preset: string): void {
    const match = preset.match(/(\d+)/);
    const minutes = match ? this.clampDurationMinutes(Number(match[1])) : this.newWorkoutDurationMinutes;
    this.newWorkoutDurationMinutes = minutes;
    this.newWorkoutDuration = preset;
    this.newWorkoutDurationUnit = 'min';
    this.newWorkoutDurationInputValue = minutes;
  }

  // ── Template helpers ──────────────────────────────────────

  get missedSessions(): boolean {
    return this.sessions.some(s => s.status === 'missed');
  }

  get missedSessionTitle(): string {
    return this.sessions.find(s => s.status === 'missed')?.title ?? 'Workout';
  }

  getDotColor(status: SessionStatus): string {
    const map: Record<SessionStatus, string> = {
      upcoming: '#e8ff47',
      optional: '#60a5fa',
      missed:   '#555555',
      done:     '#22c55e',
    };
    return map[status] ?? '#e8ff47';
  }

  getBadgeClass(status: SessionStatus): string {
    const map: Record<SessionStatus, string> = {
      upcoming: 'badge-green',
      optional: 'badge-amber',
      missed:   'badge-muted',
      done:     'badge-done',
    };
    return map[status] ?? 'badge-green';
  }

  getBadgeText(status: SessionStatus): string {
    const map: Record<SessionStatus, string> = {
      upcoming: 'Upcoming',
      optional: 'Optional',
      missed:   'Missed',
      done:     'Done',
    };
    return map[status] ?? 'Upcoming';
  }

  // ── Notifications panel ───────────────────────────────────
  // Display/state now lives entirely in the shared NotificationPanelComponent
  // (see shared/notification-panel/); this page just toggles [isOpen] from
  // the header bell and mirrors (unreadCountChange) into its own header badge.
  notifPanelOpen = false;
  unreadCount = 0;

  openNotifPanel(): void {
    this.notifPanelOpen = true;
  }

  closeNotifPanel(): void { this.notifPanelOpen = false; }

  onUnreadCountChange(count: number): void {
    this.unreadCount = count;
  }

  // ── Coaching screen ────────────────────────────────────────
  // In-flow replacement for ion-content (see schedule.page.html) rather
  // than an overlay -- header and footer are untouched siblings either way.
  coachingPanelOpen = false;
  /** Set from CoachingNavService.consumeReopen() in ngOnInit() when this page is reached via a back-navigation from chat/coach-profile -- see coaching-nav.service.ts. Cleared whenever the panel closes (closeOverlaysForNavigation()/closeCoachingPanel()) so it never silently re-applies to a later, unrelated open. */
  coachingPanelInitialTab: CoachingPanelTab | null = null;

  onCoachingClick(): void {
    this.coachingPanelOpen = !this.coachingPanelOpen;
  }

  closeCoachingPanel(): void {
    this.coachingPanelOpen = false;
    this.coachingPanelInitialTab = null;
  }

  private closeOverlaysForNavigation(): void {
    this.notifPanelOpen = false;
    this.homeWorkoutModalOpen = false;
    this.historyModalOpen = false;
    this.weekPlanModalOpen = false;
    this.addModalOpen = false;
    this.coachingPanelOpen = false;
    this.coachingPanelInitialTab = null;
  }

  // ── Navigation ───────────────────────────────────────────
  // NOTE: replaceUrl: true — see the matching note in dashboard.page.ts.
  // Bottom-nav tab switches must REPLACE the current history entry, not
  // push a new one, or Location.back() (on-screen arrow / hardware back)
  // from a later drill-in page (e.g. chat) walks past several stale tab
  // visits instead of returning to whichever tab was actually active.
  goToDashboard(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard'], { replaceUrl: true });  }
  goToSchedule():  void { this.closeOverlaysForNavigation(); this.router.navigate(['/schedule'], { replaceUrl: true });   }
  goToQr():        void { this.closeOverlaysForNavigation(); this.router.navigate(['/qr-scanner'], { replaceUrl: true }); }
  goToInventory(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/inventory'], { replaceUrl: true });  }
  goToEquipment(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/equipment'], { replaceUrl: true }); }
  goToProfile():   void { this.closeOverlaysForNavigation(); this.router.navigate(['/profile'], { replaceUrl: true });    }

  // ── History ───────────────────────────────────────────────
  openHistoryModal(): void {
    this.historyItems = this.buildHistory();
    this.historyModalOpen = true;
  }

  closeHistoryModal(): void {
    this.historyModalOpen = false;
  }

  private buildHistory(): WorkoutHistoryItem[] {
    const store = this.readStoredSessions() as Record<string, WorkoutSession[]>;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const items: WorkoutHistoryItem[] = [];

    for (const key of Object.keys(store)) {
      const [y, m, d] = key.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      if (date > today) continue;
      const doneSessions = (store[key] ?? []).filter(s => s.status === 'done');
      if (doneSessions.length === 0) continue;
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
      items.push({
        displayDate: `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`,
        dateKey: key,
        sessions: doneSessions.map(s => this.normalizeSession(s)),
      });
    }

    return items.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }

  // ── Week Plan ─────────────────────────────────────────────
  private buildDefaultWeekPlanDays(): WeekPlanDay[] {
    const defaults = ['Upper Body','Cardio & Core','Rest Day','Upper Body','Full Body','Lower Body / Leg Day','Rest Day'];
    const targets  = ['Back & Bicep','Core & Abs','','Chest & Tricep','Compound Lifts','Quads & Glutes',''];
    return defaults.map((title, i) => ({
      title,
      customTarget: targets[i],
      duration: '60 min',
      coach: '',
      location: 'Gym Floor B',
      time: '07:00',
      isRest: title === 'Rest Day',
      exercises: [],
    }));
  }

  openWeekPlanModal(): void {
    const saved = this.loadWeekPlanTemplate();
    this.weekPlanDays = saved ?? this.buildDefaultWeekPlanDays();
    this.weekPlanActiveDay = 0;
    this.weekPlanSaved = false;
    this.weekPlanModalOpen = true;
    this.checkAndStartWeekPlanTour();
  }

  closeWeekPlanModal(): void {
    this.weekPlanModalOpen = false;
  }

  toggleWeekPlanRest(dayIndex: number): void {
    const day = this.weekPlanDays[dayIndex];
    day.isRest = !day.isRest;
    if (day.isRest) {
      day.title = 'Rest Day';
      day.customTarget = '';
      day.exercises = [];
    } else {
      day.title = 'Upper Body';
    }
    // If this is the active day, switch to it to show the updated editor
    this.weekPlanActiveDay = dayIndex;
  }

  onWeekPlanTypeChange(dayIndex: number): void {
    const day = this.weekPlanDays[dayIndex];
    day.isRest = day.title === 'Rest Day';
    if (day.isRest) { day.customTarget = ''; }
    day.exercises = [];
  }

  saveWeekPlan(): void {
    localStorage.setItem(this.WEEK_PLAN_KEY, JSON.stringify(this.weekPlanDays));
    this.weekPlanSaved = true;
    // Apply template to the current week (unseeded days)
    this.applyWeekPlanToCurrentWeek();
    void this.workoutTracker.scheduleMissedChecks();
    this.workoutTracker.scheduleUpcomingReminders();
    setTimeout(() => {
      this.closeWeekPlanModal();
      this.buildWeekStrip();
      this.renderSessions();
    }, 900);
    this.toast.success('Weekly plan saved and applied!');
  }

  clearWeekPlan(): void {
    localStorage.removeItem(this.WEEK_PLAN_KEY);
    this.weekPlanDays = this.buildDefaultWeekPlanDays();
    this.weekPlanSaved = false;
    void this.workoutTracker.scheduleMissedChecks();
    this.workoutTracker.scheduleUpcomingReminders();
  }

  private loadWeekPlanTemplate(): WeekPlanDay[] | null {
    try {
      const raw = localStorage.getItem(this.WEEK_PLAN_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as WeekPlanDay[];
    } catch {
      return null;
    }
  }

  private applyWeekPlanToCurrentWeek(): void {
    const template = this.loadWeekPlanTemplate();
    if (!template) return;
    const store = this.readStoredSessions();

    for (let i = 0; i < 7; i++) {
      const d = new Date(this.baseDate);
      d.setDate(this.baseDate.getDate() + i);
      const key = this.dateKey(d);

      const existingSessions = store[key] ?? [];
      const builtSessions = this.buildDaySessionsFromTracker(i, template);

      // Reuse the existing session id(s) for this date (matched by position)
      // instead of the fresh random id buildDaySessionsFromTracker just
      // generated. Without this, every Week Plan save orphans the old
      // backend row (the new id never matches it) — that old row then comes
      // back as a DUPLICATE the next time pullFromServer() merges server
      // data into the local store.
      const sessions = builtSessions.map((session, idx) => ({
        ...session,
        id: existingSessions[idx]?.id ?? session.id,
      }));

      store[key] = sessions;

      sessions.forEach((session) => this.workoutTracker.pushSession(d, session as unknown as StoredWorkoutSession));

      // If this day used to have MORE sessions than the new template
      // produces, the leftover old ones are gone locally — delete them
      // server-side too so they don't come back as orphaned duplicates later.
      existingSessions.slice(sessions.length).forEach((oldSession) => {
        if (oldSession.id) this.workoutTracker.deleteSessionFromServer(d, oldSession.id);
      });
    }
    this.writeStoredSessions(store);
  }

  readonly weekDayLabels = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
}