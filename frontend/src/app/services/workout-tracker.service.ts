import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { NotificationCenterService } from './notification-center.service';
import { API_URL } from '../config/api.config';
import { defaultSessionsByDayIdx, buildExercisesFromTemplate, buildGoalWeekPlan } from '../data/workout-templates';

export type SessionStatus = 'upcoming' | 'optional' | 'missed' | 'done';

/** Shape of one day inside the member's saved custom week-plan template (see SchedulePage's Week Plan editor). Exported so callers (e.g. SchedulePage) can type their own template arrays against it instead of duplicating the shape. */
export interface WeekPlanTemplateDay {
  title: string;
  customTarget: string;
  duration: string;
  coach: string;
  location: string;
  time: string; // 24h "HH:MM"
  isRest: boolean;
  exercises: Array<{ name: string; sets: number | null; reps: string }>;
}

export interface StoredExercise {
  name: string;
  sets: number | null;
  reps: string | number;
  done?: boolean;
}

export interface StoredWorkoutSession {
  id?: string;
  timeVal: string;
  timeAmpm: string;
  title: string;
  duration: string;
  location: string;
  coach: string;
  membersCount: number;
  status: SessionStatus;
  customTarget?: string;
  isCustom?: boolean;
  exercises?: StoredExercise[];
  /** Actual tracked minutes from the Start/Stop session timer (falls back to `duration` when unset). */
  actualMinutes?: number;
  /** ISO timestamp set while the session timer is running; null/undefined when not tracking. */
  startedAt?: string | null;
  /** Explicit "no workout needed today" flag (Stage 3). Drives streak-skip and missed-notification exemption — do not infer this from title text elsewhere. */
  isRestDay?: boolean;
}

@Injectable({ providedIn: 'root' })
export class WorkoutTrackerService {
  private readonly storageKey = 'fordago_schedule_sessions_v2';
  private readonly legacyStorageKey = 'fordago_schedule_sessions_v1';
  // Must stay in sync with SchedulePage.WEEK_PLAN_KEY — same localStorage entry, written by the Week Plan editor there.
  private readonly weekPlanStorageKey = 'fordago_week_plan_v1';
  private readonly homeWorkoutMap: Record<string, string[]> = {
    'Upper Body': ['3 x 15 Push-ups', '3 x 12 Tricep Dips', '3 x 10 Pike Push-ups', '2 x 15 Diamond Push-ups'],
    'Lower Body / Leg Day': ['3 x 15 Squats', '3 x 12 Lunges each leg', '3 x 20 Calf Raises', '2 x 30s Wall Sit'],
    'Cardio & Core': ['3 x 20 Mountain Climbers', '3 x 15 Burpees', '3 x 30 Bicycle Crunches', '2 min High Knees'],
    'Full Body': ['3 x 10 Burpees', '3 x 12 Push-ups', '3 x 15 Squats', '3 x 20 Jumping Jacks'],
    'Mobility & Stretch': ['2 min Hip Flexor Stretch', '2 min Hamstring Stretch', '90s Shoulder Mobility', '2 min Cat-Cow Flow'],
    'Rest Day': ['10 min Light Walk', '5 min Deep Breathing', '15 min Gentle Stretching', 'Hydrate and rest'],
  };
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  // Precise per-session timers (see scheduleMissedChecks()) so a session
  // flips to 'missed' and fires its notification the INSTANT its scheduled
  // time passes, instead of waiting for the next periodic syncStoreStatuses()
  // poll below.
  private missedCheckTimers: ReturnType<typeof setTimeout>[] = [];
  // Guard: if a pullFromServer() is already in flight, subsequent callers
  // wait on the same promise instead of firing a second HTTP request.
  private _pullInFlight: Promise<void> | null = null;
  // Precise per-session timers that fire BEFORE the session (30 min ahead)
  // to send the upcoming-workout reminder notification — mirrors the exact
  // same design as missedCheckTimers above.
  private upcomingReminderTimers: ReturnType<typeof setTimeout>[] = [];
  private alarmSchedulingInProgress = false;
  private alarmScheduleQueued = false;
  private updatesSubject = new BehaviorSubject<number>(Date.now());


  /**
   * Day keys that seedCurrentMonthIfNeeded() just filled with a BLIND
   * default placeholder because the local store had absolutely nothing
   * for that day — the normal case being a fresh install/reinstall,
   * since localStorage does not survive that on Android/iOS (Capacitor
   * WebView storage lives inside the app's private data directory, which
   * an uninstall wipes). Each placeholder gets a brand-new random id
   * (see buildSeededSession()), so on its own, pullFromServer()'s normal
   * id-matched merge can never find it and would just PUSH the member's
   * real synced history in ALONGSIDE the placeholder instead of
   * replacing it — leaving two sessions for that day and making the
   * dashboard/schedule appear to have "reverted to default" even though
   * the real data was safely on the server the whole time.
   *
   * The next pullFromServer() call checks this set and REPLACES (not
   * appends) local sessions for these specific days before falling back
   * to normal per-id merge behavior. Cleared once a pull has resolved
   * (successfully) so it never affects unrelated future syncs.
   */
  private pendingServerReconcileKeys = new Set<string>();

  readonly updates$ = this.updatesSubject.asObservable();

  constructor(
    private auth: AuthService,
    private notificationCenter: NotificationCenterService,
    private http: HttpClient
  ) {}

  startAutoSync(): void {
    // CRITICAL: NEVER run auto-sync or missed-session notifications if user is not logged in
    if (!this.auth.token || !this.auth.user) {
      return;
    }

    // CRITICAL: Staff accounts (admin, super_admin, employee) do not participate in member workout tracking
    if (['admin', 'super_admin', 'employee'].includes(this.auth.user.role)) {
      return;
    }

    // Seed BEFORE syncing statuses so a freshly-seeded month's sessions get
    // their status computed immediately, and so any caller reading the
    // store right after this returns (e.g. Dashboard's stat cards) sees
    // the full month — not just whatever days happened to already exist.
    this.seedCurrentMonthIfNeeded();
    this.syncStoreStatuses();
    // Explicit call (not just relying on writeStore()'s own call below):
    // if every session was already correctly seeded/synced on this boot,
    // syncStoreStatuses() never calls writeStore() at all (nothing
    // `changed`), so nothing would otherwise schedule today's precise
    // missed-check timers on a fresh app launch.
    void this.scheduleMissedChecks();
    void this.scheduleUpcomingReminders();
    if (this.syncTimer) {
      return;
    }

    this.syncTimer = setInterval(() => {
      if (!this.auth.token || !this.auth.user) {
        this.stopAutoSync();
        return;
      }
      this.syncStoreStatuses();
    }, 15000);
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    this.missedCheckTimers.forEach((timer) => clearTimeout(timer));
    this.missedCheckTimers = [];
    this.upcomingReminderTimers.forEach((timer) => clearTimeout(timer));
    this.upcomingReminderTimers = [];
  }

  /**
   * Ensures every day of the given month (defaults to the current month)
   * has a stored session list, seeding from the member's saved Week Plan
   * template when present, otherwise the app default weekly template.
   * Days with no workout scheduled get an explicit rest-day placeholder
   * session (isRestDay: true) rather than an empty array, so streak and
   * missed-notification logic can tell "nothing to do today" apart from
   * "not seeded yet" (Stage 3). This is the single source of truth for
   * month-seeding — both DashboardPage and SchedulePage call this
   * indirectly via startAutoSync(), so the dashboard's "Upcoming
   * Schedules" stat is correct even when the member never opens the
   * Schedule page.
   *
   * Idempotent and non-destructive: a day already present in the store is
   * left untouched, so this never clobbers progress or manual edits.
   *
   * @returns true if any new day was written to storage.
   */
  seedCurrentMonthIfNeeded(referenceDate: Date = new Date()): boolean {
    const store = this.readStore();
    const template = this.loadWeekPlanTemplate();
    let changed = false;

    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const key = this.getDateKey(date);
      if (store[key]) continue; // already seeded elsewhere, or has real data — never overwrite

      // Convert JS's Sunday-first getDay() (0=Sun..6=Sat) into the
      // Monday-first index (0=Mon..6=Sun) that the shared template data uses.
      const jsDay = date.getDay();
      const dayIdx = jsDay === 0 ? 6 : jsDay - 1;

      store[key] = this.buildDaySessions(dayIdx, template);
      changed = true;
      this.pendingServerReconcileKeys.add(key);
    }

    if (changed) {
      this.writeStore(store);
    }

    return changed;
  }

  /**
   * Builds the session list for a single calendar day (Monday-first index,
   * 0=Mon..6=Sun), given the member's week-plan template (or null to fall
   * back to the app default weekly schedule). Public so every page that
   * seeds a day — Dashboard via seedCurrentMonthIfNeeded(), Schedule's own
   * week/month seeding — shares this ONE implementation instead of each
   * re-deriving rest-day/template logic locally. That duplication used to
   * be exactly how rest days ended up represented two different ways
   * (empty array vs. explicit isRestDay session) depending on which page
   * happened to seed a given day first (Stage 3 follow-up fix).
   */
  buildDaySessions(dayIdx: number, template: WeekPlanTemplateDay[] | null, sessionDate?: Date): StoredWorkoutSession[] {
    if (template) {
      const templateDay = template[dayIdx];
      if (!templateDay || templateDay.isRest) {
        return [this.buildRestDaySession()];
      }

      const { time, ampm } = this.to12(templateDay.time || '07:00');
      const customExercises = (templateDay.exercises ?? [])
        .filter((exercise) => exercise?.name?.trim())
        .map((exercise) => ({ ...exercise }));
      const exercises = customExercises.length > 0
        ? customExercises
        : buildExercisesFromTemplate(templateDay.title, templateDay.customTarget);

      const stableId = sessionDate
        ? `plan_${this.getDateKey(sessionDate)}_${dayIdx}`
        : `plan_tpl_${dayIdx}`;

      const session = this.buildSeededSession({
        timeVal: time,
        timeAmpm: ampm,
        title: templateDay.title,
        duration: templateDay.duration,
        location: templateDay.location,
        coach: templateDay.coach,
        membersCount: 0,
        status: 'upcoming',
        customTarget: templateDay.customTarget || undefined,
        isCustom: false,
        exercises,
      }, stableId);

      // Compute accurate status based on the actual calendar date so that
      // a past day shows 'missed' immediately instead of flip-flopping
      // between 'upcoming' and 'missed' on navigation.
      if (sessionDate) {
        session.status = this.autoComputeStatus(session, sessionDate);
      }

      return [session];
    }

    const defaultDaySessions = defaultSessionsByDayIdx[dayIdx] ?? [];
    if (defaultDaySessions.length === 0) {
      return [this.buildRestDaySession(sessionDate)];
    }

    return defaultDaySessions.map((day, dIdx) => {
      const stableId = sessionDate
        ? `plan_def_${this.getDateKey(sessionDate)}_${dayIdx}_${dIdx}`
        : `plan_def_${dayIdx}_${dIdx}`;
      const s = this.buildSeededSession({
        timeVal: day.timeVal,
        timeAmpm: day.timeAmpm,
        title: day.title,
        duration: day.duration,
        location: day.location,
        coach: day.coach,
        membersCount: day.membersCount,
        status: day.status,
        customTarget: day.customTarget,
        isCustom: false,
        exercises: buildExercisesFromTemplate(day.title, day.customTarget),
      }, stableId);
      if (sessionDate) {
        s.status = this.autoComputeStatus(s, sessionDate);
      }
      return s;
    });
  }

  /** Builds a fully-formed, uniquely-id'd session ready to write into the store. */
  private buildSeededSession(base: Omit<StoredWorkoutSession, 'id'>, explicitId?: string): StoredWorkoutSession {
    return this.normalizeSession({
      ...base,
      id: explicitId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
  }

  /**
   * Builds the explicit rest-day placeholder session used whenever a day
   * has no workout scheduled (template day marked isRest, or a day with no
   * default template entry at all). Replaces the old behavior of leaving
   * the day's session array empty, which was indistinguishable from a
   * blank/unseeded day and broke streak counting (Stage 3 fix).
   */
  private buildRestDaySession(sessionDate?: Date): StoredWorkoutSession {
    const stableId = sessionDate ? `rest_${this.getDateKey(sessionDate)}` : undefined;
    return this.buildSeededSession({
      timeVal: '12:00',
      timeAmpm: 'AM',
      title: 'Rest Day',
      duration: '0 min',
      location: '',
      coach: '',
      membersCount: 0,
      status: 'optional',
      isCustom: false,
      isRestDay: true,
      exercises: buildExercisesFromTemplate('Rest Day'),
    }, stableId);
  }

  private loadWeekPlanTemplate(): WeekPlanTemplateDay[] | null {
    try {
      const raw = localStorage.getItem(this.weekPlanStorageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 7) {
          return parsed as WeekPlanTemplateDay[];
        }
      }
      // If no custom plan saved yet, check if logged-in user has a fitness goal
      const currentUser = this.auth.user;
      if (currentUser?.fitness_goal) {
        const goalPlan = buildGoalWeekPlan(
          currentUser.fitness_goal,
          currentUser.bmi,
          currentUser.preferred_workout_time || '17:00'
        );
        try {
          localStorage.setItem(this.weekPlanStorageKey, JSON.stringify(goalPlan));
        } catch {}
        return goalPlan;
      }
      return null;
    } catch {
      return null;
    }
  }

  private to12(time24: string): { time: string; ampm: 'AM' | 'PM' } {
    if (!time24) return { time: '12:00', ampm: 'AM' };
    const [hoursRaw, minutesRaw] = time24.split(':').map(Number);
    if (Number.isNaN(hoursRaw) || Number.isNaN(minutesRaw)) return { time: '12:00', ampm: 'AM' };
    const ampm: 'AM' | 'PM' = hoursRaw >= 12 ? 'PM' : 'AM';
    const hours12 = hoursRaw > 12 ? hoursRaw - 12 : hoursRaw === 0 ? 12 : hoursRaw;
    return { time: `${hours12}:${String(minutesRaw).padStart(2, '0')}`, ampm };
  }

  getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  /** Converts an internal "year-monthIndex-day" store key into a real YYYY-MM-DD calendar date for the API. */
  private dateKeyToIsoDate(key: string): string | null {
    const parts = key.split('-').map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
      return null;
    }
    const [year, monthIndex, day] = parts;
    const mm = String(monthIndex + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  }

  getCompletionSummary(session: StoredWorkoutSession): { total: number; completed: number; allDone: boolean; hasPartial: boolean } {
    const exercises = session.exercises ?? [];
    const total = exercises.length;
    const completed = exercises.filter((exercise) => exercise.done).length;
    const allDone = session.status === 'done' || (total > 0 && completed === total);
    const hasPartial = !allDone && completed > 0;

    return { total, completed, allDone, hasPartial };
  }

  readStore(): Record<string, StoredWorkoutSession[]> {
    try {
      const scopedKey = this.getScopedStorageKey();
      const raw = localStorage.getItem(scopedKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        const normalized = this.normalizeStore(parsed);
        const rawAfter = JSON.stringify(normalized);
        if (rawAfter !== raw) {
          localStorage.setItem(scopedKey, rawAfter);
        }
        return normalized;
      }

      const legacyRaw = localStorage.getItem(this.legacyStorageKey);
      if (!legacyRaw) {
        return {};
      }

      const legacyStore = this.normalizeStore(JSON.parse(legacyRaw));
      this.writeStore(legacyStore);
      localStorage.removeItem(this.legacyStorageKey);
      return legacyStore;
    } catch {
      return {};
    }
  }

  writeStore(store: Record<string, StoredWorkoutSession[]>): void {
    localStorage.setItem(this.getScopedStorageKey(), JSON.stringify(this.normalizeStore(store)));
    this.updatesSubject.next(Date.now());
    // Re-derive today's precise missed-check AND upcoming-reminder timers from
    // whatever just changed (new session added, time edited, session
    // started/stopped/marked done, a session just flipped to 'missed', etc.)
    // so they never drift out of sync with the actual store contents.
    void this.scheduleMissedChecks();
    void this.scheduleUpcomingReminders();
  }

  /**
   * Fetches this user's sessions from the backend and merges them into the
   * local store, filling in status/exercises/actualMinutes/startedAt for
   * any session the server already knows about.
   */
  async pullFromServer(): Promise<void> {
    if (!this.auth.token) return;

    if (this._pullInFlight) {
      return this._pullInFlight;
    }

    this._pullInFlight = this._doPullFromServer().finally(() => {
      this._pullInFlight = null;
    });
    return this._pullInFlight;
  }

  private async _doPullFromServer(): Promise<void> {
    if (!this.auth.token) return;

    try {
      const rows = await firstValueFrom(
        this.http.get<any[]>(`${API_URL}/workout-sessions`, {
          headers: { Authorization: `Bearer ${this.auth.token}` },
        })
      );

      if (!Array.isArray(rows) || rows.length === 0) {
        this.pendingServerReconcileKeys.clear();
        return;
      }

      const store = this.readStore();
      const replacedThisPass = new Set<string>();

      const serverSessionIdToKey = new Map<string, string>();

      rows.forEach((row) => {
        let y: number, m: number, d: number;
        const rawDateStr = String(row.session_date || '');
        if (rawDateStr.includes('T') || rawDateStr.includes('Z')) {
          const parsed = new Date(rawDateStr);
          if (!Number.isNaN(parsed.getTime())) {
            y = parsed.getFullYear();
            m = parsed.getMonth() + 1;
            d = parsed.getDate();
          } else {
            const parts = rawDateStr.slice(0, 10).split('-').map(Number);
            [y, m, d] = parts;
          }
        } else {
          const parts = rawDateStr.slice(0, 10).split('-').map(Number);
          [y, m, d] = parts;
        }

        if (!y || !m || !d) return;
        const key = `${y}-${m - 1}-${d}`;
        const sessionDate = new Date(y, m - 1, d);

        if (row.client_session_id && !String(row.client_session_id).startsWith('admin_class_')) {
          serverSessionIdToKey.set(row.client_session_id, key);
        }

        if (this.pendingServerReconcileKeys.has(key) && !replacedThisPass.has(key)) {
          store[key] = [];
          replacedThisPass.add(key);
        }

        const daySessions = store[key] ?? [];
        const idx = daySessions.findIndex((s) => s.id === row.client_session_id);

        const serverStatus = row.status ?? daySessions[idx]?.status ?? 'upcoming';
        const isRestDay = typeof row.is_rest_day === 'boolean' ? row.is_rest_day : daySessions[idx]?.isRestDay;
        const startedAt = row.started_at ?? daySessions[idx]?.startedAt ?? null;

        const baseStatus = serverStatus === 'done'
          ? 'done'
          : this.autoComputeStatus({
              title: row.title ?? daySessions[idx]?.title ?? '',
              timeVal: row.time_val ?? daySessions[idx]?.timeVal ?? '',
              timeAmpm: row.time_ampm ?? daySessions[idx]?.timeAmpm ?? '',
              status: serverStatus,
              isRestDay,
              startedAt,
            } as StoredWorkoutSession, sessionDate);

        const merged: StoredWorkoutSession = {
          ...(idx !== -1 ? daySessions[idx] : {}),
          id: row.client_session_id,
          title: row.title ?? daySessions[idx]?.title ?? '',
          timeVal: row.time_val ?? daySessions[idx]?.timeVal ?? '',
          timeAmpm: row.time_ampm ?? daySessions[idx]?.timeAmpm ?? '',
          location: row.location ?? daySessions[idx]?.location ?? '',
          coach: row.coach ?? daySessions[idx]?.coach ?? '',
          customTarget: row.custom_target ?? daySessions[idx]?.customTarget,
          status: baseStatus,
          isRestDay,
          exercises: Array.isArray(row.exercises) ? row.exercises : daySessions[idx]?.exercises,
          actualMinutes: row.actual_minutes ?? daySessions[idx]?.actualMinutes,
          startedAt,
          duration: row.duration ?? daySessions[idx]?.duration ?? '60 min',
          membersCount: daySessions[idx]?.membersCount ?? 0,
        };

        if (idx === -1) {
          if (merged.isRestDay) {
            const localNonRest = daySessions.filter((s) => !s.isRestDay);
            if (localNonRest.length === 0) {
              store[key] = [merged];
            }
          } else {
            const nonRest = daySessions.filter((s) => !s.isRestDay);
            if (this.pendingServerReconcileKeys.has(key)) {
              store[key] = [merged];
              this.pendingServerReconcileKeys.delete(key);
            } else {
              nonRest.push(merged);
              store[key] = nonRest;
            }
          }
        } else {
          daySessions[idx] = merged;
          store[key] = daySessions;
        }
      });

      // Cross-date deduplication: ensure a user workout session only exists on its authoritative server session_date
      serverSessionIdToKey.forEach((correctKey, sessionId) => {
        Object.keys(store).forEach((k) => {
          if (k !== correctKey && Array.isArray(store[k])) {
            const beforeLen = store[k].length;
            store[k] = store[k].filter((s) => s.id !== sessionId);
            if (store[k].length !== beforeLen && store[k].length === 0) {
              store[k] = [this.buildRestDaySession()];
            }
          }
        });
      });

      // Clean up any mixed days: if a day has real workouts, discard rest-day placeholders
      Object.keys(store).forEach((k) => {
        if (Array.isArray(store[k]) && store[k].length > 1) {
          const hasReal = store[k].some((s) => !s.isRestDay);
          if (hasReal) {
            store[k] = store[k].filter((s) => !s.isRestDay);
          }
        }
      });

      // Prune any deleted admin class sessions that are no longer on the server
      const serverAdminSessionIds = new Set(
        rows.map((r) => r.client_session_id).filter((id) => typeof id === 'string' && id.startsWith('admin_class_'))
      );
      Object.keys(store).forEach((k) => {
        if (Array.isArray(store[k])) {
          store[k] = store[k].filter((s) => !s.id?.startsWith('admin_class_') || serverAdminSessionIds.has(s.id));
        }
      });

      // Every key that was pending reconciliation is now settled for this
      // successful pull: either a row replaced its blind placeholder above,
      // or (if the server simply had nothing for that day) the placeholder
      // is correct as-is. Either way, later pulls should go back to normal
      // id-matched merge/append behavior for these days rather than
      // treating them as pending again.
      this.pendingServerReconcileKeys.clear();

      this.writeStore(store);
    } catch {
      // Offline or server unreachable — local cache is still usable.
      // Deliberately NOT clearing pendingServerReconcileKeys here: a day
      // that was blind-seeded but never got a chance to reconcile should
      // still get replaced by the next successful pull (e.g. next page
      // view, or once connectivity returns), not silently treated as
      // final.
    }
  }

  /**
   * Pushes one session's current state to the backend (upsert). Fire-and-
   * forget from the caller's perspective — failures are swallowed here
   * (logged only) so a flaky connection never blocks the UI; the change is
   * already safely in localStorage regardless.
   *
   * Public so pages that mutate a session directly (e.g. SchedulePage's
   * edit/add/status-cycle/Week-Plan flows) can push their own change
   * immediately instead of leaving it local-only. An un-pushed local edit
   * is exactly what let pullFromServer() silently revert Schedule page
   * edits — the server still had the old value, so the next merge wrote it
   * straight back over the local change.
   */
  pushSession(dayDate: Date, session: StoredWorkoutSession): void {
    if (!this.auth.token || !session.id) return;

    const isoDate = this.dateKeyToIsoDate(this.getDateKey(dayDate));
    if (!isoDate) return;

    const body = {
      client_session_id: session.id,
      session_date: isoDate,
      title: session.title,
      // Explicit flag set at seed time (Stage 3); falls back to the old
      // title heuristic only for sessions persisted before that change.
      is_rest_day: session.isRestDay ?? session.title === 'Rest Day',
      status: session.status,
      exercises: session.exercises ?? [],
      actual_minutes: session.actualMinutes ?? null,
      started_at: session.startedAt ?? null,
      time_val: session.timeVal,
      time_ampm: session.timeAmpm,
      location: session.location,
      coach: session.coach,
      custom_target: session.customTarget ?? null,
    };

    this.http
      .post(`${API_URL}/workout-sessions`, body, {
        headers: { Authorization: `Bearer ${this.auth.token}` },
      })
      .subscribe({
        error: (err) => console.warn('[WorkoutTracker] failed to sync session to server', err),
      });
  }

  /**
   * Deletes one session from the backend (delete companion to pushSession).
   * Requires the session's calendar date because the backend's identifying
   * key is (user_id, client_session_id, session_date) — a client-generated
   * id is only guaranteed unique per date, not globally (see
   * WorkoutSessionController::destroy()). Fire-and-forget: failures are
   * logged only, since the session is already removed from localStorage
   * regardless of whether the server is reachable.
   */
  deleteSessionFromServer(dayDate: Date, sessionId: string | undefined | null): void {
    if (!this.auth.token || !sessionId) return;

    const isoDate = this.dateKeyToIsoDate(this.getDateKey(dayDate));
    if (!isoDate) return;

    this.http
      .delete(`${API_URL}/workout-sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${this.auth.token}` },
        params: { session_date: isoDate },
      })
      .subscribe({
        error: () => {},
      });
  }

  /**
   * Deletes all uncompleted (or all) sessions for a specific calendar date
   * from the backend by date in a single call.
   */
  deleteSessionsForDate(dayDate: Date, keepDone: boolean = true): void {
    if (!this.auth.token) return;

    const isoDate = this.dateKeyToIsoDate(this.getDateKey(dayDate));
    if (!isoDate) return;

    this.http
      .delete(`${API_URL}/workout-sessions/date/${isoDate}`, {
        headers: { Authorization: `Bearer ${this.auth.token}` },
        params: { keep_done: keepDone ? '1' : '0' },
      })
      .subscribe({
        error: () => {},
      });
  }

  updateSessionExercises(dayDate: Date, sessionId: string, exercises: StoredExercise[]): StoredWorkoutSession | null {
    const store = this.readStore();
    const key = this.getDateKey(dayDate);
    const sessions = store[key] ?? [];
    const sessionIndex = sessions.findIndex((session) => session.id === sessionId);

    if (sessionIndex === -1) {
      return null;
    }

    const existingSession = this.normalizeSession(sessions[sessionIndex]);
    const normalizedExercises = exercises.map((exercise) => ({
      ...exercise,
      done: Boolean(exercise.done),
    }));
    const summary = this.getCompletionSummary({
      ...existingSession,
      exercises: normalizedExercises,
    });
    const baseStatus = existingSession.status === 'done' ? 'upcoming' : existingSession.status;
    const nextStatus = summary.allDone
      ? 'done'
      : this.autoComputeStatus({ ...existingSession, status: baseStatus }, dayDate);

    let updatedStartedAt = existingSession.startedAt;
    let updatedActualMinutes = existingSession.actualMinutes;

    // If all exercises are done and timer was running, auto-complete the timer and cancel alarm
    if (summary.allDone && existingSession.startedAt) {
      const startedMs = new Date(existingSession.startedAt).getTime();
      updatedActualMinutes = Number.isNaN(startedMs) ? 0 : Math.max(1, Math.round((Date.now() - startedMs) / 60000));
      updatedStartedAt = null;
      void this.notificationCenter.cancelNativeDurationAlarm(existingSession.id || sessionId);
    }

    if (summary.allDone) {
      const todayKey = this.getDateKey(dayDate);
      const uniqueKey = `${todayKey}-${existingSession.id ?? existingSession.title}-${existingSession.timeVal}-${existingSession.timeAmpm}`;
      void this.notificationCenter.cancelNativeWorkoutAlerts(uniqueKey);
    }

    sessions[sessionIndex] = {
      ...existingSession,
      exercises: normalizedExercises,
      status: nextStatus,
      startedAt: updatedStartedAt,
      actualMinutes: updatedActualMinutes,
    };
    store[key] = sessions;
    this.writeStore(store);
    this.pushSession(dayDate, sessions[sessionIndex]);

    return sessions[sessionIndex];
  }

  public durationToMinutes(duration?: string): number {
    if (!duration) return 0;
    const text = duration.toLowerCase();
    if (text.includes('hr') || text.includes('hour')) {
      const match = text.match(/([\d.]+)/);
      return match ? Math.round(parseFloat(match[1]) * 60) : 60;
    }
    const match = text.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
  }

  /**
   * Starts the live session timer: stamps `startedAt` so elapsed time can be
   * computed later (and resumed correctly even if the app is closed/reopened
   * mid-session, since we always recompute elapsed time from this timestamp
   * rather than trusting client-side interval state alone).
   * Also schedules a native exact alarm on Android so the phone rings even if asleep/closed.
   */
  startSession(dayDate: Date, sessionId: string): StoredWorkoutSession | null {
    const store = this.readStore();
    const key = this.getDateKey(dayDate);
    const sessions = store[key] ?? [];
    const sessionIndex = sessions.findIndex((session) => session.id === sessionId);

    if (sessionIndex === -1) {
      return null;
    }

    const sessionObj = sessions[sessionIndex];
    const todayKey = this.getDateKey(dayDate);
    const uniqueKey = `${todayKey}-${sessionObj.id ?? sessionObj.title}-${sessionObj.timeVal}-${sessionObj.timeAmpm}`;
    void this.notificationCenter.cancelNativeWorkoutAlerts(uniqueKey);

    sessions[sessionIndex] = {
      ...this.normalizeSession(sessionObj),
      startedAt: new Date().toISOString(),
    };
    store[key] = sessions;
    this.writeStore(store);
    this.pushSession(dayDate, sessions[sessionIndex]);

    // Schedule exact native AlarmManager notification on device
    const durationMins = this.durationToMinutes(sessionObj.duration);
    if (durationMins > 0) {
      void this.notificationCenter.scheduleNativeDurationAlarm(
        sessionObj.title,
        durationMins,
        sessionObj.id || sessionId
      );
    }

    return sessions[sessionIndex];
  }

  /**
   * Stops the live session timer, records the elapsed minutes (minimum 1 to
   * avoid a meaningless 0-minute entry from an accidental instant stop), and
   * marks the session done so it's counted in monthly stats. Safe to call
   * even if no timer was running (e.g. double-tap) — returns the session
   * unchanged in that case instead of throwing.
   * Cancels any pending native duration alarm.
   */
  stopSession(dayDate: Date, sessionId: string): { session: StoredWorkoutSession; elapsedMinutes: number } | null {
    const store = this.readStore();
    const key = this.getDateKey(dayDate);
    const sessions = store[key] ?? [];
    const sessionIndex = sessions.findIndex((session) => session.id === sessionId);

    if (sessionIndex === -1) {
      return null;
    }

    const existingSession = this.normalizeSession(sessions[sessionIndex]);
    void this.notificationCenter.cancelNativeDurationAlarm(existingSession.id || sessionId);

    if (!existingSession.startedAt) {
      return { session: existingSession, elapsedMinutes: existingSession.actualMinutes ?? 0 };
    }

    const startedMs = new Date(existingSession.startedAt).getTime();
    const elapsedMinutes = Number.isNaN(startedMs)
      ? 0
      : Math.max(1, Math.round((Date.now() - startedMs) / 60000));

    const finalStatus = existingSession.status === 'missed' ? existingSession.status : 'done';
    if (finalStatus === 'done') {
      const todayKey = this.getDateKey(dayDate);
      const uniqueKey = `${todayKey}-${existingSession.id ?? existingSession.title}-${existingSession.timeVal}-${existingSession.timeAmpm}`;
      void this.notificationCenter.cancelNativeWorkoutAlerts(uniqueKey);
    }

    sessions[sessionIndex] = {
      ...existingSession,
      startedAt: null,
      actualMinutes: elapsedMinutes,
      status: finalStatus,
    };
    store[key] = sessions;
    this.writeStore(store);
    this.pushSession(dayDate, sessions[sessionIndex]);

    return { session: sessions[sessionIndex], elapsedMinutes };
  }

  autoComputeStatus(session: StoredWorkoutSession, dayDate: Date): SessionStatus {
    if (session.status === 'done') {
      return 'done';
    }

    // Rest days are never "missed" — there's no workout to fail to do.
    // (Stage 3: exempt is_rest_day sessions from missed auto-flagging.)
    if (session.isRestDay) {
      return 'optional';
    }

    // A session with an active timer is being worked out right now — never
    // auto-flip it to 'missed' out from under the member mid-workout.
    if (session.startedAt) {
      return session.status === 'optional' ? 'optional' : 'upcoming';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const day = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());

    if (day < today) {
      return 'missed';
    }

    if (day.getTime() === today.getTime()) {
      const [hours, minutes] = this.to24(session.timeVal, session.timeAmpm).split(':').map(Number);
      const sessionMinutes = hours * 60 + minutes;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      // Instant miss: a session is 'missed' the moment its scheduled minute arrives.
      if (nowMinutes >= sessionMinutes) {
        return 'missed';
      }
    }

    return session.status === 'optional' ? 'optional' : 'upcoming';
  }

  syncStoreStatuses(): Record<string, StoredWorkoutSession[]> {
    // Staff accounts do not have personal workout schedules
    if (this.auth.user && ['admin', 'super_admin', 'employee'].includes(this.auth.user.role)) {
      return this.readStore();
    }

    const store = this.readStore();
    let changed = false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    Object.keys(store).forEach((key) => {
      const [year, month, day] = key.split('-').map(Number);
      const sessionDate = new Date(year, month, day);
      const sessionDay = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate());

      store[key] = (store[key] ?? []).map((session) => {
        const normalizedSession = this.normalizeSession(session);
        const computedStatus = this.autoComputeStatus(normalizedSession, sessionDate);

        if (computedStatus === 'missed' && normalizedSession.status !== 'done' && normalizedSession.status !== 'missed') {
          changed = true;
          const updated = { ...normalizedSession, status: 'missed' as SessionStatus };

          // STRICTLY ONLY alert and push to server if this session was scheduled for TODAY
          // Never fire notifications for past days (e.g. yesterday or earlier)
          if (sessionDay.getTime() === today.getTime()) {
            const homeAlternatives = this.homeWorkoutMap[normalizedSession.title] || this.homeWorkoutMap['Full Body'];
            void this.notificationCenter.notifyMissedWorkout(
              normalizedSession.title,
              sessionDate,
              `${key}-${normalizedSession.id || normalizedSession.title}`,
              homeAlternatives
            );
            this.pushSession(sessionDate, updated);
          }
          return updated;
        }

        if (normalizedSession.status !== 'done' && normalizedSession.status !== computedStatus) {
          changed = true;
          const updated = { ...normalizedSession, status: computedStatus };
          if (sessionDay.getTime() === today.getTime()) {
            this.pushSession(sessionDate, updated);
          }
          return updated;
        }

        return normalizedSession;
      });
    });

    if (changed) {
      this.writeStore(store);
    }

    return store;
  }

  /** Cancels every pending precise missed-check timer (see scheduleMissedChecks()) without scheduling new ones. */
  private clearMissedCheckTimers(): void {
    this.missedCheckTimers.forEach((timer) => clearTimeout(timer));
    this.missedCheckTimers = [];
  }

  /** Cancels every pending upcoming-reminder timer (see scheduleUpcomingReminders()) without scheduling new ones. */
  private clearUpcomingReminderTimers(): void {
    this.upcomingReminderTimers.forEach((timer) => clearTimeout(timer));
    this.upcomingReminderTimers = [];
  }

  /**
   * Schedules one precise setTimeout per still-upcoming session TODAY,
   * firing exactly when that session's scheduled time arrives so it flips
   * to 'missed' (and its notification sends) the instant the time passes
   * — no waiting for the next periodic syncStoreStatuses() poll in
   * startAutoSync(), which could otherwise add up to that poll interval's
   * worth of visible delay between "time's up" and the notification.
   *
   * The periodic poll is kept running as a safety net on top of this —
   * it still catches: a pending setTimeout getting delayed/dropped by the
   * OS while the app is backgrounded, the day rolling over past midnight,
   * and any session this method skipped for not yet being scheduled. This
   * method is what makes the common case (member actively using / running
   * in the foreground when the clock hits the scheduled time) fire
   * immediately instead of up to ~15s late.
   *
   * Always re-derived from the CURRENT store rather than diffed against
   * the previous schedule, so it's simplest and safest to just clear and
   * rebuild every time it's called (see writeStore(), which calls this on
   * every mutation) — the number of sessions in a single day is always
   * small, so this is cheap.
   */
  /**
   * Unified and thread-safe workout alarm scheduler.
   * Cancels stale alarms once, then schedules native AlarmManager alarms (and foreground timers)
   * for today and all upcoming dates across the next 14 days.
   * Prevents race conditions where concurrent calls wipe out each other's alarms.
   */
  async scheduleAllWorkoutAlarms(): Promise<void> {
    if (this.alarmSchedulingInProgress) {
      this.alarmScheduleQueued = true;
      return;
    }
    this.alarmSchedulingInProgress = true;
    this.alarmScheduleQueued = false;

    try {
      this.clearMissedCheckTimers();
      this.clearUpcomingReminderTimers();

      // Cancel all stale pending workout alarms once cleanly
      await this.notificationCenter.cancelAllPendingWorkoutAlarms();

      const store = this.readStore();
      const now = new Date();
      const todayKey = this.getDateKey(now);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const maxHorizon = new Date(todayStart.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Collect all date keys to process: today plus any stored date up to 14 days ahead
      const dateKeysToProcess = new Set<string>();
      dateKeysToProcess.add(todayKey);
      for (let i = 1; i <= 7; i++) {
        const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
        dateKeysToProcess.add(this.getDateKey(nextDay));
      }
      Object.keys(store).forEach((key) => {
        const parts = key.split('-').map(Number);
        if (parts.length === 3 && !parts.some(Number.isNaN)) {
          // parts[1] is already monthIndex (0-11) from getDateKey
          const d = new Date(parts[0], parts[1], parts[2]);
          if (d >= todayStart && d <= maxHorizon) {
            dateKeysToProcess.add(key);
          }
        }
      });

      dateKeysToProcess.forEach((dateKey) => {
        const sessions = store[dateKey] ?? [];
        const parts = dateKey.split('-').map(Number);
        if (parts.length !== 3 || parts.some(Number.isNaN)) return;
        const [year, monthIndex, day] = parts;

        sessions.forEach((session) => {
          const titleLower = (session.title || '').toLowerCase();
          if (
            session.status === 'done' ||
            session.status === 'missed' ||
            session.status === 'optional' ||
            session.isRestDay ||
            titleLower.includes('rest') ||
            session.startedAt
          ) {
            return;
          }

          const [hours, minutes] = this.to24(session.timeVal, session.timeAmpm).split(':').map(Number);
          if (Number.isNaN(hours) || Number.isNaN(minutes)) {
            return;
          }

          // monthIndex is already 0-indexed from dateKey
          const scheduledAt = new Date(year, monthIndex, day, hours, minutes, 0, 0);
          const msUntilScheduled = scheduledAt.getTime() - now.getTime();

          // If scheduled time has already passed by more than 1 minute, skip
          if (msUntilScheduled <= -60000) {
            return;
          }

          const sessionTime = `${session.timeVal} ${session.timeAmpm}`;
          const uniqueKey = `${dateKey}-${session.id ?? session.title}-${session.timeVal}-${session.timeAmpm}`;
          const missedDedupeKey = `${dateKey}-${session.id || session.title}`;
          const homeAlternatives = this.homeWorkoutMap[session.title] || this.homeWorkoutMap['Full Body'];

          // 1. 30-MINUTE UPCOMING REMINDER (Native AlarmManager + Foreground timer)
          const THIRTY_MIN_MS = 30 * 60 * 1000;
          const reminderDate = new Date(scheduledAt.getTime() - THIRTY_MIN_MS);
          const msUntilReminder = reminderDate.getTime() - now.getTime();

          if (msUntilReminder > 0) {
            void this.notificationCenter.scheduleNativeUpcomingReminder(
              session.title,
              sessionTime,
              uniqueKey,
              reminderDate
            );

            if (dateKey === todayKey) {
              const timer = setTimeout(() => {
                void this.notificationCenter.notifyUpcomingWorkout(session.title, sessionTime, uniqueKey);
              }, msUntilReminder);
              this.upcomingReminderTimers.push(timer);
            }
          }

          // 2. MISSED WORKOUT ALERT (1 MINUTE AFTER SCHEDULED TIME)
          // Fires exactly 1 minute after start time if member has not started the workout
          const missedAt = new Date(scheduledAt.getTime() + 60 * 1000);
          if (missedAt.getTime() > now.getTime()) {
            void this.notificationCenter.scheduleNativeMissedAlert(
              session.title,
              missedDedupeKey,
              missedAt,
              homeAlternatives
            );

            if (dateKey === todayKey) {
              const msUntilMissed = missedAt.getTime() - now.getTime();
              const timer = setTimeout(() => {
                this.syncStoreStatuses();
              }, msUntilMissed + 500);
              this.missedCheckTimers.push(timer);
            }
          }
        });
      });
    } catch (err) {
      console.warn('Error in scheduleAllWorkoutAlarms:', err);
    } finally {
      this.alarmSchedulingInProgress = false;
      if (this.alarmScheduleQueued) {
        this.alarmScheduleQueued = false;
        void this.scheduleAllWorkoutAlarms();
      }
    }
  }

  /** Alias for backwards compatibility with existing callers. */
  async scheduleMissedChecks(): Promise<void> {
    return this.scheduleAllWorkoutAlarms();
  }

  /** Alias for backwards compatibility with existing callers. */
  async scheduleUpcomingReminders(): Promise<void> {
    return this.scheduleAllWorkoutAlarms();
  }

  private getScopedStorageKey(): string {
    const userId = this.auth.user?.id ? String(this.auth.user.id) : 'guest';
    return `${this.storageKey}_${userId}`;
  }

  private normalizeStore(store: Record<string, StoredWorkoutSession[]>): Record<string, StoredWorkoutSession[]> {
    const rawNormalized = Object.keys(store ?? {}).reduce<Record<string, StoredWorkoutSession[]>>((accumulator, key) => {
      accumulator[key] = (store[key] ?? []).map((session) => this.normalizeSession(session));
      return accumulator;
    }, {});

    return this.deduplicateStoreKeys(rawNormalized);
  }

  /**
   * Automatically detects and removes phantom duplicate sessions across date keys
   * (e.g. from previous UTC-to-local timezone shifts).
   */
  private deduplicateStoreKeys(store: Record<string, StoredWorkoutSession[]>): Record<string, StoredWorkoutSession[]> {
    const sessionKeyMap = new Map<string, string[]>();

    Object.keys(store).forEach((key) => {
      (store[key] ?? []).forEach((s) => {
        if (s.id && !s.isRestDay && !s.id.startsWith('admin_class_')) {
          const list = sessionKeyMap.get(s.id) ?? [];
          list.push(key);
          sessionKeyMap.set(s.id, list);
        }
      });
    });

    sessionKeyMap.forEach((keys, sessionId) => {
      if (keys.length > 1) {
        // ID format: ${Date.now()}-${random}
        const ts = Number(sessionId.split('-')[0]);
        let targetKey: string | null = null;
        if (!Number.isNaN(ts) && ts > 1000000000000) {
          targetKey = this.getDateKey(new Date(ts));
        }

        const keepKey = (targetKey && keys.includes(targetKey))
          ? targetKey
          : [...keys].sort().reverse()[0];

        keys.forEach((k) => {
          if (k !== keepKey) {
            store[k] = (store[k] ?? []).filter((s) => s.id !== sessionId);
            if (store[k].length === 0) {
              store[k] = [this.buildRestDaySession()];
            }
          }
        });
      }
    });

    return store;
  }

  private normalizeSession(session: StoredWorkoutSession): StoredWorkoutSession {
    const exercises = session.exercises?.map((exercise) => ({
      ...exercise,
      done: typeof exercise.done === 'boolean' ? exercise.done : session.status === 'done',
    })) ?? [];

    return {
      ...session,
      exercises,
    };
  }

  private to24(time: string, ampm: string): string {
    let [hours, minutes] = time.split(':').map(Number);
    if (ampm === 'PM' && hours !== 12) {
      hours += 12;
    }
    if (ampm === 'AM' && hours === 12) {
      hours = 0;
    }
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}
