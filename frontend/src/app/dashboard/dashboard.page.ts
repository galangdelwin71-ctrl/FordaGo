// dashboard.page.ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonFooter, IonIcon, IonModal, IonInput } from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { WorkoutTrackerService, StoredWorkoutSession } from '../services/workout-tracker.service';
import { NoNegativeDirective } from '../directives/no-negative.directive';
import { HeaderComponent } from '../shared/header/header.component';
import { NotificationPanelComponent } from '../shared/notification-panel/notification-panel.component';
import { API_BASE_URL } from '../config/api.config';

// ─────────────────────────────────────────────────────
// INTERFACES
// ─────────────────────────────────────────────────────

// Represents one exercise inside a scheduled workout
export interface WorkoutExercise {
  name: string;
  sets: number;
  reps: number | string; // can be "12" or "30 sec"
  color: string;
  done: boolean;         // toggled manually by the member on dashboard
}

// Represents today's scheduled workout (pulled from your schedule service)
export interface TodayWorkout {
  sessionId: string;
  name: string;          // e.g. "Upper Body"
  focus?: string;        // e.g. "Back & Bicep"
  time: string;          // e.g. "6:00 AM Tomorrow"
  exercises: WorkoutExercise[];
  status: PersistedScheduleSession['status'];
  actualMinutes?: number;  // minutes captured by the Start/Stop session timer, once stopped
  startedAt?: string | null; // ISO timestamp while the session timer is running, else null
}

export interface PersistedScheduleExercise {
  name: string;
  sets: number;
  reps: string | number;
  done?: boolean;
}

export interface PersistedScheduleSession {
  id?: string;
  timeVal: string;
  timeAmpm: string;
  title: string;
  duration: string;
  location: string;
  coach: string;
  membersCount: number;
  status: 'upcoming' | 'optional' | 'missed' | 'done';
  customTarget?: string;
  isCustom?: boolean;
  exercises?: PersistedScheduleExercise[];
  actualMinutes?: number;
  startedAt?: string | null;
  /** Explicit "no workout needed today" flag (Stage 3) — see WorkoutTrackerService.StoredWorkoutSession. */
  isRestDay?: boolean;
}

// Summary of a single completed session, shown in the "Sessions This Month" detail panel
export interface CompletedSessionItem {
  title: string;
  date: string;
  time: string;
  duration: string;
}

// Summary of a single upcoming session, shown in the "Upcoming Schedules" detail panel
export interface UpcomingScheduleItem {
  title: string;
  type: string;
  date: string;
  time: string;
  status: PersistedScheduleSession['status'];
}

// One cell in the activity heatmap
export interface HeatmapCell {
  date: string;          // e.g. "Jun 5"
  intensity: 0 | 1 | 2 | 3;
  // 0 = rest / no session
  // 1 = partial session (did some exercises, no check-in scan)
  // 2 = moderate (scanned QR but incomplete workout)
  // 3 = full session (scanned QR + completed all exercises)
  label: string;         // tooltip text e.g. "Full session" or "Rest day"
  /**
   * Stage 4: true ONLY for a leading blank cell inserted so the first REAL
   * day (the start of the member's window — see generateHeatmap()) lines up
   * under its correct weekday column in `dayLabels` (M T W T F S S). It
   * renders fully transparent (see .heat-pad) and has no date/intensity/
   * label. Every other cell is a real, visible cell (see buildHeatmapCell).
   */
  isPadding?: boolean;
}

// One personal record entry
export interface PersonalRecord {
  id: number;
  exercise: string;      // e.g. "Bench Press"
  icon: string;          // ionicon name
  value: number | string;
  unit: string;          // kg, lbs, min, reps
  date: string;          // display date e.g. "3 days ago"
  isNew: boolean;        // show "New PR" badge if recently set (within 7 days)
}

// Form model for adding/editing a PR
export interface PrForm {
  exercise: string;
  value: number | string;
  unit: string;
}

// ─────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [CommonModule, FormsModule, IonContent, IonFooter, IonIcon, IonModal, IonInput, NoNegativeDirective, HeaderComponent, NotificationPanelComponent],
})
export class DashboardPage implements OnInit, OnDestroy {
  // ── Member Info ──────────────────────────────────────
  memberName      = '';
  initials        = '';
  profileImage    = '';

  get timeGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }
  planName        = '';
  expiryDate      = '';
  daysLeft        = 0;
  progressPercent = 0;

  // ── Stats ────────────────────────────────────────────
  sessionsThisMonth = 0;
  dayStreak         = 0;
  avgMinutes        = 0;
  upcomingCount     = 0;
  totalMinutesThisMonth = 0;

  // ── Stat Card Detail Panel ───────────────────────────
  // Tapping a "This Month" stat card opens a themed detail panel.
  // null = closed, otherwise identifies which panel is showing.
  statDetailOpen: 'sessions' | 'streak' | 'avg' | 'upcoming' | null = null;
  completedSessionsList: CompletedSessionItem[] = [];
  upcomingSessionsList: UpcomingScheduleItem[] = [];

  openStatDetail(type: 'sessions' | 'streak' | 'avg' | 'upcoming'): void {
    this.statDetailOpen = type;
  }

  closeStatDetail(): void {
    this.statDetailOpen = null;
  }

  // Motivational copy shown inside the Day Streak detail panel.
  get streakMotivation(): string {
    if (this.dayStreak === 0) {
      return 'No active streak yet — complete a workout today to light the fire!';
    }
    if (this.dayStreak < 3) {
      return `${this.dayStreak}-day streak! Hit today's workout to keep it going.`;
    }
    if (this.dayStreak < 7) {
      return `${this.dayStreak} days strong! You're building a real habit — don't stop now.`;
    }
    return `${this.dayStreak} days on fire! One missed day resets it to zero, so keep showing up.`;
  }

  // ── Today's Workout ──────────────────────────────────
  // HOW THIS WORKS:
  // In a real app, inject your ScheduleService and call
  // getTodayWorkout(memberId) which queries the schedule
  // collection in your backend for today's date.
  // For now, this is hardcoded sample data.
  //
  // When a workout is fetched, it auto-populates exercises.
  // The member taps each exercise row to mark it done.
  todayWorkouts: TodayWorkout[] = [];
  private trackerSubscription?: Subscription;
  private userSubscription?: Subscription;

  // Tap an exercise item to mark it done/undone and persist immediately
  toggleExercise(workoutIndex: number, exerciseIndex: number): void {
    const workout = this.todayWorkouts[workoutIndex];
    if (!workout) return;
    if (workout.status === 'missed' || !this.isWorkoutStillActive(workout.time)) return;
    workout.exercises[exerciseIndex].done = !workout.exercises[exerciseIndex].done;
    this.persistTodayWorkoutStatus(workout);
  }

  isWorkoutStillActive(timeLabel: string): boolean {
    const scheduled = this.parse12HourTimeToDate(timeLabel, new Date());
    return scheduled.getTime() > Date.now();
  }

  private parse12HourTimeToDate(timeLabel: string, baseDate: Date): Date {
    const match = timeLabel.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    const parsed = new Date(baseDate);

    if (!match) {
      parsed.setHours(0, 0, 0, 0);
      return parsed;
    }

    const hour12 = Number(match[1]);
    const minute = Number(match[2]);
    const ampm = match[3].toUpperCase();
    const hour24 = (hour12 % 12) + (ampm === 'PM' ? 12 : 0);

    parsed.setHours(hour24, minute, 0, 0);
    return parsed;
  }

  private sessionScheduledAt(session: PersistedScheduleSession, baseDate: Date): Date {
    const timeLabel = `${session.timeVal} ${session.timeAmpm}`;
    return this.parse12HourTimeToDate(timeLabel, baseDate);
  }

  private persistTodayWorkoutStatus(workout: TodayWorkout): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.workoutTracker.updateSessionExercises(today, workout.sessionId, workout.exercises);
    this.refreshDashboardFromSchedule();
  }

  // How many exercises are checked off
  getCompletedExercises(workout: TodayWorkout): number {
    return workout.exercises.filter(e => e.done).length;
  }

  // Progress bar % for today's workout
  getWorkoutCompletionPercent(workout: TodayWorkout): number {
    if (workout.exercises.length === 0) return 0;
    return (this.getCompletedExercises(workout) / workout.exercises.length) * 100;
  }

  // ── Activity Heatmap ─────────────────────────────────
  // HOW THIS WORKS:
  // Each cell = one day. The grid is anchored to the member's signup date
  // and covers exactly one 4-week (28-day) CYCLE at a time -- it does NOT
  // roll forward day by day. Once a cycle's 28 days are up, the very next
  // day starts a brand-new cycle: the grid resets to blank at the top and
  // begins filling in again from its own top-left cell. This is by design
  // (product decision) -- prior cycles are intentionally not preserved in
  // this view. See getHeatmapCycleAnchor() / generateHeatmap().
  //
  // INTENSITY RULES (set by your backend/service):
  //   0 = No session recorded for that day (rest day)
  //   1 = Member was scheduled but only partially completed workout
  //   2 = Member scanned QR (checked in) but no workout tracked
  //   3 = Member scanned QR + completed all/most exercises
  //
  // In a real app, query your attendance/session collection
  // for the member's window (see above) and map each date to an
  // intensity value based on the rules above.
  //
  // Example backend query (pseudo):
  //   sessions = await SessionService.getSessionsInWindow(memberId, windowStart, today)
  //   heatmapData = sessions.map(s => ({
  //     date: s.date,
  //     intensity: s.checkedIn && s.completed ? 3
  //              : s.checkedIn              ? 2
  //              : s.scheduled              ? 1
  //              :                            0
  //   }))

  dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  heatmapData: HeatmapCell[] = this.generateHeatmap();

  // Generates 28 days of sample data working backwards from today.
  // Replace this with real data from your SessionService.
  // Attendance dates loaded from backend (ISO date strings)
  private attendanceDates = new Set<string>();

  private toLocalDateKey(value: Date | string | number): string {
    const date = value instanceof Date ? value : new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadAttendanceDates(): void {
    if (!this.auth.token) return;
    this.http.get<any[]>(`${this.api}/attendance/my`, {
      headers: { Authorization: `Bearer ${this.auth.token}` }
    }).subscribe({
      next: (records) => {
        this.attendanceDates = new Set(
          records.map(r => this.toLocalDateKey(r.check_in_time))
        );
        this.heatmapData = this.generateHeatmap();
      },
      error: () => {}
    });
  }

  /** One heatmap cycle = 4 weeks. Once a cycle finishes, the grid resets to
   *  blank at the top instead of continuing to roll forward like a GitHub-
   *  style trailing window (product decision -- old cycles are not kept). */
  private static readonly HEATMAP_CYCLE_DAYS = 28;

  /**
   * Anchor date for cycle #0. Prefers the member's real signup date (see
   * getAccountCreatedDate()) so their first day as a member is always the
   * top-left cell of their first cycle. Falls back to 27 days before today
   * if the signup date is ever unavailable/unparseable, which reproduces
   * the old "trailing last 28 days" window as a single cycle instead of
   * crashing or rendering an empty grid -- and self-corrects automatically
   * once created_at loads.
   */
  private getHeatmapCycleAnchor(today: Date): Date {
    const accountCreatedAt = this.getAccountCreatedDate();
    if (accountCreatedAt) return accountCreatedAt;

    const fallback = new Date(today);
    fallback.setDate(fallback.getDate() - (DashboardPage.HEATMAP_CYCLE_DAYS - 1));
    return fallback;
  }

  private generateHeatmap(): HeatmapCell[] {
    const store = this.workoutTracker.syncStoreStatuses();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cycleAnchor = this.getHeatmapCycleAnchor(today);

    // Reset-every-4-weeks: figure out which cycle "today" currently falls
    // into (counted from cycleAnchor), then anchor the grid to the START
    // of THAT cycle -- not to "today minus 27 days". Once a cycle's 28 days
    // are up, the next day rolls into a new cycle index, so the grid goes
    // blank and starts filling again from its own top-left cell. Clamped
    // to >= 0 to guard against clock skew (e.g. created_at slightly in the
    // future) corrupting the division below.
    const daysSinceAnchor = Math.max(
      Math.floor((today.getTime() - cycleAnchor.getTime()) / 86400000),
      0
    );
    const cycleIndex = Math.floor(daysSinceAnchor / DashboardPage.HEATMAP_CYCLE_DAYS);

    const windowStart = new Date(cycleAnchor);
    windowStart.setDate(windowStart.getDate() + cycleIndex * DashboardPage.HEATMAP_CYCLE_DAYS);
    windowStart.setHours(0, 0, 0, 0);

    // Days elapsed within the CURRENT cycle only. Clamped to never exceed
    // HEATMAP_CYCLE_DAYS as a defensive guard (should be unreachable given
    // how windowStart is derived above, but protects the cell-builder below
    // from ever rendering more than one full cycle's worth of cells).
    const daysInWindow = Math.min(
      Math.round((today.getTime() - windowStart.getTime()) / 86400000) + 1,
      DashboardPage.HEATMAP_CYCLE_DAYS
    );

    // Every day gets a REAL, visible cell — buildHeatmapCell() naturally
    // returns intensity 0 ("Rest day") when there's no session history for
    // that day, which paints as the normal grey "no activity" tile. Only the
    // leading alignment cells below (for weekday alignment) are isPadding
    // (fully transparent, see .heat-pad in dashboard.page.scss).
    const realCells: HeatmapCell[] = Array.from({ length: daysInWindow }, (_, i) => {
      const d = new Date(windowStart);
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);

      return this.buildHeatmapCell(d, store);
    });

    // Stage 4 (Activity Heatmap alignment fix): `dayLabels` below is a
    // FIXED Monday-first header row (M T W T F S S) rendered once above the
    // grid, while the grid itself just lays cells left-to-right, 7 per row,
    // via CSS `grid-template-columns: repeat(7, 1fr)`. That only lines up
    // correctly if the very first cell happens to fall on a Monday — any
    // other weekday and every subsequent box is shifted under the wrong
    // letter.
    //
    // Fix: figure out which weekday windowStart actually falls on and
    // insert that many blank/disabled padding cells before it, so the first
    // real box lands under its true weekday column and every later row
    // follows real calendar weeks from there.
    // Date.getDay() is Sunday-first (0=Sun..6=Sat); dayLabels is
    // Monday-first, so remap to a Monday-first index (0=Mon..6=Sun).
    const mondayFirstIndex = (windowStart.getDay() + 6) % 7;

    const paddingCells: HeatmapCell[] = Array.from({ length: mondayFirstIndex }, () => ({
      date: '',
      intensity: 0,
      label: '',
      isPadding: true,
    }));

    return [...paddingCells, ...realCells];
  }

  /**
   * Reads the member's account creation date from the logged-in user object
   * (backend returns a real `created_at`, see AuthController::login()),
   * normalized to local midnight so it compares cleanly against the
   * midnight-normalized dates generateHeatmap() builds. Returns null if the
   * field is missing/unparseable so callers (see getHeatmapCycleAnchor())
   * fall back to a sane default instead of crashing or hiding the heatmap.
   */
  private getAccountCreatedDate(): Date | null {
    const raw = this.auth.user?.created_at;
    if (!raw) return null;

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return null;

    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  /** Builds one real (non-padding) heatmap cell for the given local calendar day. */
  private buildHeatmapCell(d: Date, store: Record<string, StoredWorkoutSession[]>): HeatmapCell {
    // Weekday included (e.g. "Tue, Aug 11") so the long-press popup shows a
    // fully self-explanatory date without needing to cross-reference the
    // M/T/W/T/F/S/S header row above the grid.
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    const key = this.getDateKey(d);
    const sessions = store[key] ?? [];
    const completionSummaries = sessions.map((session) => this.workoutTracker.getCompletionSummary(session));
    const hasDone = sessions.some((session) => session.status === 'done') || completionSummaries.some((summary) => summary.allDone);
    const hasPartial = completionSummaries.some((summary) => summary.hasPartial);
    const hasMissed = sessions.some(session => session.status === 'missed');
    const hasCheckin = this.attendanceDates?.has(this.toLocalDateKey(d)) ?? false;

    let intensity: 0 | 1 | 2 | 3 = 0;
    let label = 'Rest day';

    if (hasDone && hasCheckin) {
      intensity = 3;
      label = 'Full session (QR + workout done)';
    } else if (hasDone) {
      intensity = 3;
      label = 'Workout completed';
    } else if (hasPartial && hasCheckin) {
      intensity = 2;
      label = 'Checked in and partially completed workout';
    } else if (hasPartial) {
      intensity = 1;
      label = 'Partially completed workout';
    } else if (hasCheckin) {
      intensity = 2;
      label = 'Checked in (QR scan)';
    } else if (hasMissed) {
      intensity = 1;
      label = 'Missed workout';
    }

    return {
      date: dateStr,
      intensity,
      label,
    };
  }

  private getDateKey(date: Date): string {
    return this.workoutTracker.getDateKey(date);
  }

  // ── Heatmap long-press popup ──────────────────────────
  // Long-pressing (or click-and-hold on desktop) a single day box shows a
  // small popup with that day's date + status, replacing the old `title`
  // hover tooltip which mobile touch can't trigger. Releasing the press
  // (pointerup/leave/cancel) hides it immediately — nothing is pinned open.
  private static readonly HEATMAP_LONG_PRESS_MS = 400;
  private heatmapLongPressTimer: ReturnType<typeof setTimeout> | null = null;
  activeHeatmapPopup: { cell: HeatmapCell; x: number; y: number } | null = null;

  onHeatCellPressStart(cell: HeatmapCell, event: PointerEvent): void {
    // Padding cells (leading alignment filler only) have no real date/label
    // to show, so there's nothing to pop up.
    if (cell.isPadding) return;

    this.clearHeatmapLongPressTimer();
    const targetElement = event.currentTarget as HTMLElement;
    const targetRect = targetElement.getBoundingClientRect();

    // Pointer capture keeps this element receiving pointer events for the
    // whole gesture even if the finger drifts a few pixels while held —
    // without it, a slight tremor during a real long-press fires
    // pointerleave and cancels the popup before it ever appears. Wrapped in
    // try/catch since setPointerCapture can throw for an already-released
    // or invalid pointerId, which must never block showing the popup.
    try {
      targetElement.setPointerCapture(event.pointerId);
    } catch {
      // Non-fatal: popup still works, it just won't survive minor drift.
    }

    this.heatmapLongPressTimer = setTimeout(() => {
      this.activeHeatmapPopup = {
        cell,
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top,
      };
    }, DashboardPage.HEATMAP_LONG_PRESS_MS);
  }

  onHeatCellPressEnd(event?: PointerEvent): void {
    this.clearHeatmapLongPressTimer();
    this.activeHeatmapPopup = null;

    if (!event) return;
    const targetElement = event.currentTarget as HTMLElement | null;
    if (targetElement?.hasPointerCapture?.(event.pointerId)) {
      targetElement.releasePointerCapture(event.pointerId);
    }
  }

  private clearHeatmapLongPressTimer(): void {
    if (!this.heatmapLongPressTimer) return;
    clearTimeout(this.heatmapLongPressTimer);
    this.heatmapLongPressTimer = null;
  }

  private durationToMinutes(duration: string): number {
    const match = duration.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  // Prefers real tracked minutes from the Start/Stop session timer; falls
  // back to the scheduled duration preset for sessions that were never
  // timed (e.g. marked done manually, or logged before this feature shipped).
  private sessionMinutes(session: PersistedScheduleSession): number {
    return typeof session.actualMinutes === 'number' && session.actualMinutes > 0
      ? session.actualMinutes
      : this.durationToMinutes(session.duration);
  }

  private buildExerciseColor(index: number): string {
    const palette = ['#FFD600', '#FF9500', '#4A9EFF', '#00D68F', '#FF4461'];
    return palette[index % palette.length];
  }

  private buildTodayWorkoutFromSession(session: PersistedScheduleSession): TodayWorkout {
    const exercises = (session.exercises ?? []).map((exercise, index) => ({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      color: this.buildExerciseColor(index),
      done: session.status === 'done' || Boolean(exercise.done),
    }));

    return {
      sessionId: session.id ?? `${session.title}-${session.timeVal}-${session.timeAmpm}`,
      name: session.title,
      focus: session.customTarget || '',
      time: `${session.timeVal} ${session.timeAmpm}`,
      exercises,
      status: session.status,
      actualMinutes: session.actualMinutes,
      startedAt: session.startedAt ?? null,
    };
  }

  private refreshDashboardFromSchedule(): void {
    const store = this.workoutTracker.syncStoreStatuses() as Record<string, PersistedScheduleSession[]>;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = this.getDateKey(today);
    const todaySessions = [...(store[todayKey] ?? [])].sort((left, right) => {
      const leftValue = `${left.timeAmpm}-${left.timeVal}`;
      const rightValue = `${right.timeAmpm}-${right.timeVal}`;
      return leftValue.localeCompare(rightValue);
    });

    const now = new Date();

    // Keep only sessions that should stay visible in Today's Workout.
    // Missed sessions are removed; only future sessions or done sessions remain.
    const filteredSessions = todaySessions.filter((session) => {
      if (session.status === 'missed') {
        return false;
      }

      if (session.status === 'done') {
        return true;
      }

      return this.sessionScheduledAt(session, now).getTime() > now.getTime();
    });

    this.todayWorkouts = filteredSessions.map((session) => this.buildTodayWorkoutFromSession(session));

    const allSessions: Array<{ sessionDate: Date; session: PersistedScheduleSession }> = [];
    Object.keys(store).forEach((key) => {
      const sessions = store[key] ?? [];
      const [year, month, day] = key.split('-').map(Number);
      const sessionDate = new Date(year, month, day);
      sessions.forEach((session: PersistedScheduleSession) => {
        allSessions.push({ sessionDate, session });
      });
    });

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const completedThisMonth = allSessions.filter((item: { sessionDate: Date; session: PersistedScheduleSession }) =>
      item.session.status === 'done' &&
      item.sessionDate.getMonth() === currentMonth &&
      item.sessionDate.getFullYear() === currentYear
    );

    this.sessionsThisMonth = completedThisMonth.length;
    const completedMinutes = completedThisMonth.reduce((total: number, item: { sessionDate: Date; session: PersistedScheduleSession }) => total + this.sessionMinutes(item.session), 0);
    this.avgMinutes = completedThisMonth.length ? Math.round(completedMinutes / completedThisMonth.length) : 0;
    this.totalMinutesThisMonth = completedMinutes;

    // Most recent completed session first, for the "Sessions This Month" detail panel.
    this.completedSessionsList = [...completedThisMonth]
      .sort((a, b) => b.sessionDate.getTime() - a.sessionDate.getTime())
      .map((item) => ({
        title: item.session.title,
        date: item.sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        time: `${item.session.timeVal} ${item.session.timeAmpm}`,
        duration: typeof item.session.actualMinutes === 'number' && item.session.actualMinutes > 0
          ? `${item.session.actualMinutes} min`
          : item.session.duration,
      }));

    // Streak counts backward from today. A day with a completed session
    // extends the streak; an explicit rest day (isRestDay) is skipped
    // without breaking or extending it; anything else — a missed session,
    // or a blank day with no record at all — ends the streak here.
    // (Stage 3: streak logic fix so rest days no longer reset progress.)
    let streak = 0;
    const cursor = new Date(today);
    while (true) {
      const cursorKey = this.getDateKey(cursor);
      const daySessions = store[cursorKey] ?? [];

      if (daySessions.some(session => session.status === 'done')) {
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }

      if (daySessions.some(session => session.isRestDay)) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }

      break;
    }
    this.dayStreak = streak;

    this.heatmapData = this.generateHeatmap();

    // Keep (or stop) the live ticking clock in sync with whether any of
    // today's workouts actually have a running timer right now.
    if (this.todayWorkouts.some((workout) => !!workout.startedAt)) {
      this.ensureTimerTicking();
    } else {
      this.stopTimerTickingIfIdle();
    }
  }

  // ── Live Session Timer ───────────────────────────────
  // A member taps "Start Session" when they actually begin a workout, and
  // "Stop" when they finish. We persist `startedAt` to the tracker store
  // (not just component state) so the timer survives navigation and app
  // relaunch — elapsed time is always recomputed from that timestamp, never
  // trusted from a client-side counter alone.
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  activeTimerNow = Date.now();

  private ensureTimerTicking(): void {
    if (this.timerInterval) return;
    this.timerInterval = setInterval(() => {
      this.activeTimerNow = Date.now();
    }, 1000);
  }

  private stopTimerTickingIfIdle(): void {
    if (!this.timerInterval) return;
    clearInterval(this.timerInterval);
    this.timerInterval = null;
  }

  isSessionTimerActive(workout: TodayWorkout): boolean {
    return !!workout.startedAt;
  }

  getElapsedLabel(workout: TodayWorkout): string {
    if (!workout.startedAt) return '00:00';
    const startedMs = new Date(workout.startedAt).getTime();
    const totalSeconds = Number.isNaN(startedMs) ? 0 : Math.max(0, Math.floor((this.activeTimerNow - startedMs) / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  startWorkoutSession(workout: TodayWorkout): void {
    if (workout.status === 'missed' || workout.status === 'done') return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.workoutTracker.startSession(today, workout.sessionId);
    this.ensureTimerTicking();
    this.refreshDashboardFromSchedule();
  }

  stopWorkoutSession(workout: TodayWorkout): void {
    if (!workout.startedAt) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.workoutTracker.stopSession(today, workout.sessionId);
    this.refreshDashboardFromSchedule();
  }

  // ── Personal Records ─────────────────────────────────
  // HOW THIS WORKS:
  // PRs are MANUALLY entered by the member.
  // There is no auto-detection — the member inputs their
  // new best after achieving it in the gym.
  //
  // The "+ Add PR" button and tapping an existing record
  // both open the prModal, where they type the value.
  //
  // isNew = true if the PR was set within the last 7 days.
  // The "New PR" badge shows automatically based on that.
  //
  // In a real app, save/load from your backend:
  //   PrService.getPRs(memberId) → populate personalRecords[]
  //   PrService.savePR(memberId, prForm) → on save

  personalRecords: PersonalRecord[] = [];

  private get prStorageKey(): string {
    const userId = this.auth.user?.id ?? 'guest';
    return `fordago_personal_records_${userId}`;
  }

  /** Maps a backend personal_records row into the frontend's display shape (relative date + "New PR" badge). */
  private mapServerPr(row: any): PersonalRecord {
    const createdAt = row?.created_at ? new Date(row.created_at) : new Date();
    const daysAgo = Math.floor((Date.now() - createdAt.getTime()) / 86400000);
    const dateLabel =
      daysAgo <= 0 ? 'Just now' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;

    return {
      id: Number(row.id),
      exercise: row.exercise,
      icon: this.normalizeStoredIcon(row.icon),
      value: row.value,
      unit: row.unit || '',
      date: dateLabel,
      isNew: daysAgo <= 7,
    };
  }

  /**
   * Loads PRs from the backend (source of truth) and caches the result to
   * localStorage. If the request fails (offline, server down), falls back
   * to whatever was last cached so the UI still has something to show.
   */
  private loadPersonalRecords(): void {
    if (!this.auth.token) {
      this.loadPersonalRecordsFromCache();
      return;
    }

    this.http
      .get<any[]>(`${this.api}/personal-records`, {
        headers: { Authorization: `Bearer ${this.auth.token}` },
      })
      .subscribe({
        next: (rows) => {
          this.personalRecords = (rows || []).map((row) => this.mapServerPr(row));
          this.savePersonalRecordsToCache();
        },
        error: () => {
          this.loadPersonalRecordsFromCache();
        },
      });
  }

  private loadPersonalRecordsFromCache(): void {
    try {
      const raw = localStorage.getItem(this.prStorageKey);
      const records = raw ? JSON.parse(raw) : [];
      this.personalRecords = Array.isArray(records)
        ? records.map((record) => ({
            ...record,
            icon: this.normalizeStoredIcon(record?.icon),
          }))
        : [];
    } catch {
      this.personalRecords = [];
    }
  }

  private savePersonalRecordsToCache(): void {
    localStorage.setItem(this.prStorageKey, JSON.stringify(this.personalRecords));
  }

  exerciseOptions = [
    { name: 'Bench Press',    icon: 'barbell-outline' },
    { name: 'Squat',          icon: 'body-outline' },
    { name: 'Deadlift',       icon: 'fitness-outline' },
    { name: '5km Run',        icon: 'walk-outline' },
    { name: 'Overhead Press', icon: 'barbell-outline' },
    { name: 'Pull-Up',        icon: 'trending-up-outline' },
    { name: 'Row',            icon: 'boat-outline' },
  ];

  // ── PR Modal State ───────────────────────────────────
  prModalOpen  = false;
  editingPr: PersonalRecord | null = null; // null = adding new, set = editing existing

  prForm: PrForm = { exercise: '', value: '', unit: '' };

  // Open modal for NEW pr
  openPrModal(): void {
    this.editingPr = null;
    this.prForm = { exercise: '', value: '', unit: '' };
    this.prModalOpen = true;
  }

  // Open modal for EDITING existing pr — triggered by tapping a pr row
  editPr(pr: PersonalRecord): void {
    this.editingPr = pr;
    this.prForm = {
      exercise: pr.exercise,
      value: pr.value,
      unit: pr.unit,
    };
    this.prModalOpen = true;
  }

  closePrModal(): void {
    this.prModalOpen = false;
    this.editingPr   = null;
  }

  savePr(): void {
    const normalizedExercise = String(this.prForm.exercise || '').trim();
    const normalizedValue = String(this.prForm.value || '').trim();
    const normalizedUnit = this.normalizePrUnit(this.prForm.unit);
    if (!normalizedExercise || !normalizedValue) return;

    const icon = this.resolveExerciseIcon(normalizedExercise);
    const authHeaders = this.auth.token ? { Authorization: `Bearer ${this.auth.token}` } : undefined;

    if (this.editingPr) {
      // UPDATE existing record
      const idx = this.personalRecords.findIndex(p => p.id === this.editingPr!.id);
      if (idx !== -1) {
        const updatedRecord: PersonalRecord = {
          ...this.personalRecords[idx],
          exercise: normalizedExercise,
          value: normalizedValue,
          unit: normalizedUnit,
          icon,
          date: 'Just now',
          isNew: true,
        };

        this.personalRecords = this.personalRecords.map((record) =>
          record.id === updatedRecord.id ? updatedRecord : record
        );

        if (authHeaders) {
          this.http
            .put(`${this.api}/personal-records/${updatedRecord.id}`, {
              exercise: normalizedExercise, value: normalizedValue, unit: normalizedUnit, icon,
            }, { headers: authHeaders })
            .subscribe({ error: (err) => console.warn('[Dashboard] failed to sync PR update to server', err) });
        }
      }
    } else {
      // ADD new record — optimistic local id first (Date.now()), replaced
      // with the real server id once the create request resolves, so later
      // edits/deletes target the correct backend row.
      const localId = Date.now();
      const newPr: PersonalRecord = {
        id:       localId,
        exercise: normalizedExercise,
        icon,
        value:    normalizedValue,
        unit:     normalizedUnit,
        date:     'Just now',
        isNew:    true,
      };
      this.personalRecords.unshift(newPr); // add to top of list

      if (authHeaders) {
        this.http
          .post<any>(`${this.api}/personal-records`, {
            exercise: normalizedExercise, value: normalizedValue, unit: normalizedUnit, icon,
          }, { headers: authHeaders })
          .subscribe({
            next: (row) => {
              this.personalRecords = this.personalRecords.map((record) =>
                record.id === localId ? { ...record, id: Number(row.id) } : record
              );
              this.savePersonalRecordsToCache();
            },
            error: (err) => console.warn('[Dashboard] failed to sync new PR to server', err),
          });
      }
    }

    this.savePersonalRecordsToCache();
    this.closePrModal();
  }
  private normalizePrUnit(unitValue: string | number): string {
    const unit = String(unitValue || '').trim().toLowerCase();
    if (!unit) return '';

    const aliases: Record<string, string> = {
      kg: 'kg',
      kilo: 'kg',
      kilos: 'kg',
      kilogram: 'kg',
      kilograms: 'kg',
      lb: 'lbs',
      lbs: 'lbs',
      pound: 'lbs',
      pounds: 'lbs',
      rep: 'reps',
      reps: 'reps',
      min: 'min',
      mins: 'min',
      minute: 'min',
      minutes: 'min',
      sec: 'sec',
      secs: 'sec',
      second: 'sec',
      seconds: 'sec',
    };

    if (aliases[unit]) return aliases[unit];

    return unit.slice(0, 12);
  }

  private resolveExerciseIcon(exerciseName: string): string {
    const exact = this.exerciseOptions.find((exercise) => exercise.name.toLowerCase() === exerciseName.toLowerCase());
    if (exact) return exact.icon;

    const key = exerciseName.toLowerCase();
    if (key.includes('bench')) return 'barbell-outline';
    if (key.includes('squat') || key.includes('leg')) return 'body-outline';
    if (key.includes('deadlift') || key.includes('lift')) return 'fitness-outline';
    if (key.includes('run') || key.includes('jog')) return 'walk-outline';
    if (key.includes('press')) return 'barbell-outline';
    if (key.includes('pull')) return 'trending-up-outline';
    if (key.includes('row')) return 'boat-outline';
    return 'fitness-outline';
  }

  private normalizeStoredIcon(icon: unknown): string {
    const value = String(icon || '').trim();
    if (!value) return 'fitness-outline';

    const emojiToIcon: Record<string, string> = {
      '🏋️': 'barbell-outline',
      '🦵': 'body-outline',
      '💪': 'fitness-outline',
      '🏃': 'walk-outline',
      '🙌': 'barbell-outline',
      '🔝': 'trending-up-outline',
      '🚣': 'boat-outline',
    };

    return emojiToIcon[value] || value;
  }

  deletePr(): void {
    if (!this.editingPr) return;
    const deletedId = this.editingPr.id;
    this.personalRecords = this.personalRecords.filter(p => p.id !== deletedId);
    this.savePersonalRecordsToCache();
    this.closePrModal();

    if (this.auth.token) {
      this.http
        .delete(`${this.api}/personal-records/${deletedId}`, {
          headers: { Authorization: `Bearer ${this.auth.token}` },
        })
        .subscribe({ error: (err) => console.warn('[Dashboard] failed to sync PR delete to server', err) });
    }
  }

  // ── Notifications panel ───────────────────────────────
  notifPanelOpen = false;
  unreadCount = 0;

  openNotifPanel(): void {
    this.notifPanelOpen = true;
  }

  closeNotifPanel(): void {
    this.notifPanelOpen = false;
  }

  onUnreadCountChange(count: number): void {
    this.unreadCount = count;
  }

  private closeOverlaysForNavigation(): void {
    this.notifPanelOpen = false;
    this.prModalOpen = false;
    this.statDetailOpen = null;
  }

  // ── Navigation ───────────────────────────────────────
  constructor(
    private router: Router,
    private auth: AuthService,
    private http: HttpClient,
    private workoutTracker: WorkoutTrackerService
  ) {}

  onLogoError(event: Event): void {
    const image = event.target as HTMLImageElement | null;
    if (!image) return;

    const fallbackPath = '/assets/icon/fordago-logo.svg';

    // Prevent an endless error loop if the fallback image is also missing.
    if (image.src.endsWith(fallbackPath)) return;

    image.src = fallbackPath;
  }

  onProfileImageError(): void {
    // Return to the initials avatar when the saved profile image cannot load.
    this.profileImage = '';
  }

  private readonly api = this.resolveApiBase();

  private resolveApiBase(): string {
    return API_BASE_URL;
  }

  ngOnInit(): void {
    // Redirect to login if not authenticated
    if (!this.auth.user) {
      this.router.navigate(['/login']);
      return;
    }
    this.workoutTracker.startAutoSync();
    this.userSubscription = this.auth.user$.subscribe((user) => {
      if (!user) return;
      this.applyUserContext(user);
    });
    this.trackerSubscription = this.workoutTracker.updates$.subscribe(() => {
      if (!this.auth.user) {
        return;
      }
      this.loadUpcomingSessions();
    });
    this.applyUserContext(this.auth.user);
    void this.workoutTracker.pullFromServer();

    this.loadPersonalRecords();
    this.loadAttendanceDates();
    this.loadUpcomingSessions();
    this.refreshDashboardFromSchedule();
    this.loadEquipment();
  }

  ionViewWillEnter(): void {
    if (!this.auth.user) {
      return;
    }

    this.applyUserContext(this.auth.user);
    this.workoutTracker.syncStoreStatuses();
    void this.workoutTracker.pullFromServer();

    this.loadPersonalRecords();
    this.loadAttendanceDates();
    this.loadUpcomingSessions();
    this.refreshDashboardFromSchedule();
  }

  ngOnDestroy(): void {
    this.trackerSubscription?.unsubscribe();
    this.userSubscription?.unsubscribe();
    this.stopTimerTickingIfIdle();
    this.clearHeatmapLongPressTimer();
  }

  private applyUserContext(user: any): void {
    this.memberName = user?.username || '';
    this.initials = this.memberName
      ? this.memberName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
      : '';
    this.profileImage = (user as any)?.profile_image || '';

    const membershipType = (user as any)?.membership_type || 'premium';
    const expiryRaw = (user as any)?.membership_expiry || null;

    this.planName = membershipType === 'premium' ? 'Premium Membership' : 'Daily Pass';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (membershipType === 'premium') {
      const expiryDate = expiryRaw
        ? new Date(expiryRaw)
        : new Date(today.getFullYear(), today.getMonth(), today.getDate() + 30);

      expiryDate.setHours(0, 0, 0, 0);
      const diff = Math.ceil((expiryDate.getTime() - today.getTime()) / 86400000);
      const boundedDaysLeft = Math.max(diff, 0);

      this.daysLeft = boundedDaysLeft;
      this.expiryDate = expiryDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

      const totalDays = 30;
      const consumedDays = Math.min(Math.max(totalDays - boundedDaysLeft, 0), totalDays);
      this.progressPercent = Math.round((consumedDays / totalDays) * 100);
    } else {
      this.daysLeft = 0;
      this.expiryDate = 'Pay per visit';
      this.progressPercent = 0;
    }
  }

  private loadUpcomingSessions(): void {
    // Count + list upcoming sessions from the local tracker store, scoped to THIS MONTH only
    // (the stat card lives under the "This Month" section, so it must match that scope).
    // NOTE: this reflects the TRUE number of sessions in the month regardless of whether
    // the Schedule page has ever been opened — WorkoutTrackerService.startAutoSync()
    // (called above, in ngOnInit) self-seeds the whole current month on its own.
    // See WorkoutTrackerService.seedCurrentMonthIfNeeded().
    const store = this.workoutTracker.readStore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    let upcoming = 0;
    const upcomingEntries: Array<{ sortDate: Date; entry: UpcomingScheduleItem }> = [];

    Object.keys(store).forEach(key => {
      const [year, month, day] = key.split('-').map(Number);
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);

      const isTodayOrLater = d.getTime() >= today.getTime();
      const isThisMonth = d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      if (!isTodayOrLater || !isThisMonth) return;

      // Exclude rest-day placeholders (Stage 3) — they're seeded with
      // status 'optional' so they're not auto-flagged missed, but they
      // aren't a workout to do and shouldn't inflate this count/list.
      const daySessions = (store[key] ?? []).filter(
        s => !s.isRestDay && (s.status === 'upcoming' || s.status === 'optional')
      );
      upcoming += daySessions.length;

      daySessions.forEach((session) => {
        upcomingEntries.push({
          sortDate: this.sessionScheduledAt(session, d),
          entry: {
            title: session.title,
            type: session.customTarget || session.title,
            date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            time: `${session.timeVal} ${session.timeAmpm}`,
            status: session.status,
          },
        });
      });
    });

    upcomingEntries.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
    this.upcomingCount = upcoming;
    this.upcomingSessionsList = upcomingEntries.map((entry) => entry.entry);
    this.refreshDashboardFromSchedule();
  }

  goToDashboard(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard']);  }
  goToQr():        void { this.closeOverlaysForNavigation(); this.router.navigate(['/qr-scanner']); }
  goToSchedule():  void { this.closeOverlaysForNavigation(); this.router.navigate(['/schedule']);   }
  goToInventory(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/inventory']);  }
  goToProfile():   void { this.closeOverlaysForNavigation(); this.router.navigate(['/profile']);    }
  goToEquipment(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/equipment']); }

  // ── Equipment ───────────────────────────────────────
  equipmentList: any[] = [];

  loadEquipment() {
    if (!this.auth.token) return;
    this.http.get(`${this.api}/equipment`, {
      headers: { Authorization: `Bearer ${this.auth.token}` }
    }).subscribe((data: any) => {
      this.equipmentList = data;
    });
  }
}