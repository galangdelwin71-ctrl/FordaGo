import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { NotificationCenterService } from './notification-center.service';
import { API_BASE_URL } from '../config/api.config';
import { defaultSessionsByDayIdx, buildExercisesFromTemplate } from '../data/workout-templates';

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
  exercises: Array<{ name: string; sets: number; reps: string }>;
}

export interface StoredExercise {
  name: string;
  sets: number;
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
    'Cardio & Core': ['3 x 20 Mountain Climbers', '3 x 15 Burpees', '3 x 30 Bicycle Crunches', '2 min Jump Rope'],
    'Full Body': ['3 x 10 Burpees', '3 x 12 Push-ups', '3 x 15 Squats', '3 x 20 Jumping Jacks'],
    'Mobility & Stretch': ['2 min Hip Flexor Stretch', '2 min Hamstring Stretch', '90s Shoulder Mobility', '2 min Cat-Cow Flow'],
    'Rest Day': ['10 min Light Walk', '5 min Deep Breathing', 'Foam Roll 15 min', 'Hydrate and rest'],
  };
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  private updatesSubject = new BehaviorSubject<number>(Date.now());

  readonly updates$ = this.updatesSubject.asObservable();

  constructor(
    private auth: AuthService,
    private notificationCenter: NotificationCenterService,
    private http: HttpClient
  ) {}

  startAutoSync(): void {
    // Seed BEFORE syncing statuses so a freshly-seeded month's sessions get
    // their status computed immediately, and so any caller reading the
    // store right after this returns (e.g. Dashboard's stat cards) sees
    // the full month — not just whatever days happened to already exist.
    this.seedCurrentMonthIfNeeded();
    this.syncStoreStatuses();
    if (this.syncTimer) {
      return;
    }

    this.syncTimer = setInterval(() => {
      this.syncStoreStatuses();
    }, 60000);
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
  buildDaySessions(dayIdx: number, template: WeekPlanTemplateDay[] | null): StoredWorkoutSession[] {
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

      return [this.buildSeededSession({
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
      })];
    }

    const defaultDaySessions = defaultSessionsByDayIdx[dayIdx] ?? [];
    if (defaultDaySessions.length === 0) {
      return [this.buildRestDaySession()];
    }

    return defaultDaySessions.map((day) => this.buildSeededSession({
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
    }));
  }

  /** Builds a fully-formed, uniquely-id'd session ready to write into the store. */
  private buildSeededSession(base: Omit<StoredWorkoutSession, 'id'>): StoredWorkoutSession {
    return this.normalizeSession({
      ...base,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    });
  }

  /**
   * Builds the explicit rest-day placeholder session used whenever a day
   * has no workout scheduled (template day marked isRest, or a day with no
   * default template entry at all). Replaces the old behavior of leaving
   * the day's session array empty, which was indistinguishable from a
   * blank/unseeded day and broke streak counting (Stage 3 fix).
   */
  private buildRestDaySession(): StoredWorkoutSession {
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
    });
  }

  private loadWeekPlanTemplate(): WeekPlanTemplateDay[] | null {
    try {
      const raw = localStorage.getItem(this.weekPlanStorageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as WeekPlanTemplateDay[]) : null;
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
        return this.normalizeStore(JSON.parse(raw));
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
  }

  // ── Backend sync (Stage 2) ───────────────────────────────────────────
  // localStorage stays as the source the UI reads from synchronously (so
  // nothing here changes) — these methods make it a CACHE instead of the
  // source of truth: pull on load merges in whatever the server already
  // has (so a different device's progress shows up here), and every local
  // mutation pushes to the server in the background so it's never the
  // only place the data lives.

  /**
   * Fetches this user's sessions from the backend and merges them into the
   * local store, filling in status/exercises/actualMinutes/startedAt for
   * any session the server already knows about. Silently keeps the local
   * store as-is if the request fails (offline-safe) — this is a best-
   * effort enrichment, never a hard dependency for the UI to render.
   */
  async pullFromServer(): Promise<void> {
    if (!this.auth.token) return;

    try {
      const rows = await firstValueFrom(
        this.http.get<any[]>(`${API_BASE_URL}/workout-sessions`, {
          headers: { Authorization: `Bearer ${this.auth.token}` },
        })
      );

      if (!Array.isArray(rows) || rows.length === 0) return;

      const store = this.readStore();

      rows.forEach((row) => {
        const isoDate = String(row.session_date || '').slice(0, 10);
        const [y, m, d] = isoDate.split('-').map(Number);
        if (!y || !m || !d) return;
        // Rebuild the internal 0-indexed-month key from the real date.
        const key = `${y}-${m - 1}-${d}`;

        const daySessions = store[key] ?? [];
        const idx = daySessions.findIndex((s) => s.id === row.client_session_id);

        const merged: StoredWorkoutSession = {
          ...(idx !== -1 ? daySessions[idx] : {}),
          id: row.client_session_id,
          title: row.title ?? daySessions[idx]?.title ?? '',
          timeVal: row.time_val ?? daySessions[idx]?.timeVal ?? '',
          timeAmpm: row.time_ampm ?? daySessions[idx]?.timeAmpm ?? '',
          location: row.location ?? daySessions[idx]?.location ?? '',
          coach: row.coach ?? daySessions[idx]?.coach ?? '',
          customTarget: row.custom_target ?? daySessions[idx]?.customTarget,
          status: row.status ?? daySessions[idx]?.status ?? 'upcoming',
          // Stage 3 fix: this was missing entirely, so a session pulled
          // fresh from the server (e.g. first login on a new device) never
          // got its rest-day flag — silently breaking streak-skip and the
          // missed-notification exemption for that device until the day
          // was re-seeded locally. Falls back to whatever the local copy
          // already had so an existing local flag is never clobbered by an
          // absent field on a partial server row.
          isRestDay: typeof row.is_rest_day === 'boolean' ? row.is_rest_day : daySessions[idx]?.isRestDay,
          exercises: Array.isArray(row.exercises) ? row.exercises : daySessions[idx]?.exercises,
          actualMinutes: row.actual_minutes ?? daySessions[idx]?.actualMinutes,
          startedAt: row.started_at ?? daySessions[idx]?.startedAt ?? null,
          duration: daySessions[idx]?.duration ?? '60 min',
          membersCount: daySessions[idx]?.membersCount ?? 0,
        };

        if (idx === -1) {
          daySessions.push(merged);
        } else {
          daySessions[idx] = merged;
        }
        store[key] = daySessions;
      });

      this.writeStore(store);
    } catch {
      // Offline or server unreachable — local cache is still usable.
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
      .post(`${API_BASE_URL}/workout-sessions`, body, {
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
      .delete(`${API_BASE_URL}/workout-sessions/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${this.auth.token}` },
        params: { session_date: isoDate },
      })
      .subscribe({
        error: (err) => console.warn('[WorkoutTracker] failed to delete session on server', err),
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

    sessions[sessionIndex] = {
      ...existingSession,
      exercises: normalizedExercises,
      status: nextStatus,
    };
    store[key] = sessions;
    this.writeStore(store);
    this.pushSession(dayDate, sessions[sessionIndex]);

    return sessions[sessionIndex];
  }

  /**
   * Starts the live session timer: stamps `startedAt` so elapsed time can be
   * computed later (and resumed correctly even if the app is closed/reopened
   * mid-session, since we always recompute elapsed time from this timestamp
   * rather than trusting client-side interval state alone).
   */
  startSession(dayDate: Date, sessionId: string): StoredWorkoutSession | null {
    const store = this.readStore();
    const key = this.getDateKey(dayDate);
    const sessions = store[key] ?? [];
    const sessionIndex = sessions.findIndex((session) => session.id === sessionId);

    if (sessionIndex === -1) {
      return null;
    }

    sessions[sessionIndex] = {
      ...this.normalizeSession(sessions[sessionIndex]),
      startedAt: new Date().toISOString(),
    };
    store[key] = sessions;
    this.writeStore(store);
    this.pushSession(dayDate, sessions[sessionIndex]);

    return sessions[sessionIndex];
  }

  /**
   * Stops the live session timer, records the elapsed minutes (minimum 1 to
   * avoid a meaningless 0-minute entry from an accidental instant stop), and
   * marks the session done so it's counted in monthly stats. Safe to call
   * even if no timer was running (e.g. double-tap) — returns the session
   * unchanged in that case instead of throwing.
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
    if (!existingSession.startedAt) {
      return { session: existingSession, elapsedMinutes: existingSession.actualMinutes ?? 0 };
    }

    const startedMs = new Date(existingSession.startedAt).getTime();
    const elapsedMinutes = Number.isNaN(startedMs)
      ? 0
      : Math.max(1, Math.round((Date.now() - startedMs) / 60000));

    sessions[sessionIndex] = {
      ...existingSession,
      startedAt: null,
      actualMinutes: elapsedMinutes,
      status: existingSession.status === 'missed' ? existingSession.status : 'done',
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
      if (nowMinutes > sessionMinutes + 30) {
        return 'missed';
      }
    }

    return session.status === 'optional' ? 'optional' : 'upcoming';
  }

  syncStoreStatuses(): Record<string, StoredWorkoutSession[]> {
    const store = this.readStore();
    let changed = false;

    Object.keys(store).forEach((key) => {
      const [year, month, day] = key.split('-').map(Number);
      const sessionDate = new Date(year, month, day);
      store[key] = (store[key] ?? []).map((session) => {
        const normalizedSession = this.normalizeSession(session);
        const computedStatus = this.autoComputeStatus(normalizedSession, sessionDate);

        if (computedStatus === 'missed' && normalizedSession.status !== 'done' && normalizedSession.status !== 'missed') {
          changed = true;
          const homeAlternatives = normalizedSession.exercises?.length
            ? normalizedSession.exercises.slice(0, 6).map((exercise) => `${exercise.sets} x ${exercise.reps} ${exercise.name}`)
            : (this.homeWorkoutMap[normalizedSession.title] || this.homeWorkoutMap['Full Body']);
          void this.notificationCenter.notifyMissedWorkout(
            normalizedSession.title,
            sessionDate,
            `${key}-${normalizedSession.id || normalizedSession.title}`,
            homeAlternatives
          );
          const updated = { ...normalizedSession, status: 'missed' as SessionStatus };
          this.pushSession(sessionDate, updated);
          return updated;
        }

        if (normalizedSession.status !== 'done' && normalizedSession.status !== computedStatus) {
          changed = true;
          const updated = { ...normalizedSession, status: computedStatus };
          this.pushSession(sessionDate, updated);
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

  private getScopedStorageKey(): string {
    const userId = this.auth.user?.id ? String(this.auth.user.id) : 'guest';
    return `${this.storageKey}_${userId}`;
  }

  private normalizeStore(store: Record<string, StoredWorkoutSession[]>): Record<string, StoredWorkoutSession[]> {
    return Object.keys(store ?? {}).reduce<Record<string, StoredWorkoutSession[]>>((accumulator, key) => {
      accumulator[key] = (store[key] ?? []).map((session) => this.normalizeSession(session));
      return accumulator;
    }, {});
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
