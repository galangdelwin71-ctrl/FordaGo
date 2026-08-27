import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { EchoService } from './echo.service';
import { API_URL } from '../config/api.config';

export interface AppNotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  unread: boolean;
  source: 'local' | 'server';
  homeExercises?: string[];
}

interface StoredNotificationItem extends AppNotificationItem {
  key?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private readonly api = this.resolveApiBase();
  private readonly localNotificationsKey = 'fordago_local_notifications_v1';
  private readonly notifiedMissedKey = 'fordago_notified_missed_v1';
  private readonly notifiedDurationKey = 'fordago_notified_duration_v1';
  private readonly notifiedUpcomingKey = 'fordago_notified_upcoming_v1';
  private readonly readServerNotificationsKey = 'fordago_read_server_notifications_v1';
  private readonly deliveredServerNotificationsKey = 'fordago_delivered_server_notifications_v1';

  // Shared poll state (providedIn: 'root' — one instance for the whole
  // app). NotificationPanelComponent is embedded on nearly every page
  // (dashboard, schedule, equipment, inventory, profile, qr-scanner) and
  // used to run its OWN setInterval in ngOnInit(). Since Ionic doesn't
  // always fully destroy a previous page's components when navigating,
  // every page visited in a session could leave behind another live
  // 15s polling loop — several of them firing independently is exactly
  // what produced the burst of near-simultaneous GET /api/notifications
  // calls. Owning the single timer here instead means it's started once
  // (guarded by pollTimer below) no matter how many panel instances call
  // startPolling().
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private focusListenerRegistered = false;
  private focusDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  // In-flight deduplication: if a refreshNotifications() call is already
  // in progress, every subsequent call reuses that same Promise instead of
  // firing another HTTP request. This eliminates the burst of 5+ simultaneous
  // GET /api/notifications requests that appear in the network tab when
  // multiple page components call startPolling() on mount.
  private inFlightRefresh: Promise<void> | null = null;
  private lastRefreshAt = 0;
  private readonly MIN_REFRESH_INTERVAL_MS = 10_000; // 10 seconds minimum between refreshes
  private notificationsSubject = new BehaviorSubject<AppNotificationItem[]>([]);
  readonly notifications$ = this.notificationsSubject.asObservable();

  // Fires when a device notification (native OS tray, or a web Notification)
  // is tapped, so it re-opens directly inside the app's own Notifications
  // panel instead of just bringing the app to the foreground on whatever
  // page happened to be open. `null` payload means "open the panel, no
  // specific target" (e.g. we couldn't identify which item was tapped);
  // a string payload is the AppNotificationItem.id to jump straight to its
  // detail view. BehaviorSubject (not Subject) so a late-mounting panel
  // instance -- e.g. the app was cold-started by the tap and Dashboard's
  // NotificationPanelComponent hasn't constructed yet when this first
  // fires -- still picks up the pending request once it does mount.
  private pendingOpenSubject = new BehaviorSubject<string | null>(null);
  readonly pendingOpen$ = this.pendingOpenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private echoService: EchoService,
    private zone: NgZone,
  ) {}

  /**
   * Called when the person taps a device notification (native OS tray via
   * Capacitor LocalNotifications, or a web Notification) — see
   * app.component.ts's registerNotificationTapListener() for native, and
   * sendDeviceNotification() below for web.
   *
   * `targetRoute` lets individual notification types choose where they land:
   * - Workout reminders pass '/schedule' so the member lands directly on
   *   the Schedule page for that session.
   * - All other notifications omit it and fall back to '/dashboard' (the
   *   one page guaranteed to embed the shared notifications panel).
   */
  openFromDeviceNotification(notificationId: string | null, targetRoute?: string | null): void {
    this.pendingOpenSubject.next(notificationId);
    void this.router.navigate([targetRoute ?? '/dashboard']);
  }

  /**
   * Consumed by NotificationPanelComponent once it has acted on a pending
   * open request — resets the BehaviorSubject back to its "nothing
   * pending" state so it doesn't re-fire and re-open the panel again the
   * next time an unrelated panel instance subscribes (e.g. navigating to
   * a different tab that also embeds the panel).
   */
  clearPendingOpenNotification(): void {
    this.pendingOpenSubject.next(null);
  }

  private resolveApiBase(): string {
    return API_URL;
  }

  /**
   * Starts the ONE shared background poll AND the WebSocket listener.
   * Safe to call from every page — only the first call actually does
   * anything; subsequent calls (e.g. every time a page's
   * NotificationPanelComponent mounts) are no-ops thanks to the
   * pollTimer guard.
   *
   * Strategy:
   *  1. WebSocket (instant): Listen on user.{id} private channel for
   *     `notification.sent` events. When the backend broadcasts a new
   *     notification it arrives here in <50ms — no polling needed.
   *  2. Fallback HTTP poll every 5 minutes: Catches notifications the
   *     user missed while the socket was disconnected (e.g. app was
   *     backgrounded) and keeps the list eventually consistent.
   */
  /**
   * Starts real-time WebSocket listeners and background poll.
   */
  startPolling(): void {
    // DO NOT start polling or WebSocket listeners if user is not logged in
    if (!this.auth.token || !this.auth.user) {
      return;
    }

    if (this.pollTimer) {
      return;
    }

    // Initialize Android Notification Channels with high importance (heads-up banners)
    void this.initNativeNotificationChannels();

    // Immediate first load
    void this.refreshNotifications();

    // WebSocket real-time listener (Private user channel + Global announcements)
    this.listenWebSocket();

    // Gentle 5-minute fallback HTTP sync for background consistency
    this.pollTimer = setInterval(() => {
      if (!this.auth.token || !this.auth.user) {
        this.stopPolling();
        return;
      }
      void this.refreshNotifications();
    }, 5 * 60 * 1000);

    // Sync when app/tab regains focus
    if (typeof window !== 'undefined' && !this.focusListenerRegistered) {
      this.focusListenerRegistered = true;
      window.addEventListener('focus', () => {
        if (!this.auth.token || !this.auth.user) return;
        if (this.focusDebounceTimer) clearTimeout(this.focusDebounceTimer);
        this.focusDebounceTimer = setTimeout(() => {
          void this.refreshNotifications();
        }, 2000);
      });
    }
  }

  /** Stop all notification polling and WebSocket listeners (called on logout). */
  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    const userId = this.auth.user?.id;
    if (userId) {
      this.echoService.leaveChannel(`user.${userId}`);
    }
    this.echoService.leaveChannel('notifications.global');
    this.notificationsSubject.next([]);
  }

  /**
   * Initializes native Android notification channels with High Importance so Android
   * displays incoming notifications as Heads-Up banners on top of the screen.
   *
   * Sound behavior follows the device's ringer mode automatically:
   *  - Ring mode   → default notification sound plays
   *  - Vibrate mode → vibrates only, no sound
   *  - Silent mode  → no sound, no vibration (system override)
   *
   * NOTE: Android channel settings are locked after the first creation on a given device.
   * If the user has customized sound/vibration in Settings → Apps → FordaGO → Notifications,
   * those preferences take priority (this is correct Android behaviour).
   */
  private channelsInitialized = false;
  public async initNativeNotificationChannels(): Promise<void> {
    if (!Capacitor.isNativePlatform() || this.channelsInitialized) {
      return;
    }
    this.channelsInitialized = true;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      // Request permission on init if needed
      await LocalNotifications.requestPermissions();

      // Delete legacy channels if existing to avoid stale sound config
      try {
        await LocalNotifications.deleteChannel({ id: 'fordago-alerts' });
        await LocalNotifications.deleteChannel({ id: 'fordago-reminders' });
      } catch {}

      // fordago-alerts-v2: Admin announcements / incoming alerts
      // Omitting sound property uses Android's native system default notification ringtone
      // vibration: true ensures device vibrates in Ring or Vibrate mode, and stays silent in Mute mode
      await LocalNotifications.createChannel({
        id: 'fordago-alerts-v2',
        name: 'FordaGO Alerts & Announcements',
        description: 'Admin announcements, check-in confirmations, and gym notifications',
        importance: 5,       // IMPORTANCE_HIGH (5 is MAX — shows as heads-up banner)
        visibility: 1,       // VISIBILITY_PUBLIC — shows on lock screen
        vibration: true,
        lights: true,
        lightColor: '#FFD700',
      });

      // fordago-reminders-v2: Workout reminders (30-min before session & duration alarm)
      await LocalNotifications.createChannel({
        id: 'fordago-reminders-v2',
        name: 'Workout Reminders & Alarms',
        description: '30-minute reminders before workout sessions and duration alarms',
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#FFD700',
      });
    } catch (err) {
      this.channelsInitialized = false;
      console.warn('Failed to initialize native notification channels:', err);
    }
  }

  /**
   * Subscribe to the current user's private WebSocket channel and the global announcements
   * channel so new notifications arrive in real-time instantly.
   */
  private listenWebSocket(): void {
    const userId = this.auth.user?.id;
    if (!userId) return;

    const handleIncomingNotification = (incoming: any) => {
      this.zone.run(() => {
        if (!incoming) return;

        // Map backend shape to AppNotificationItem
        const item: AppNotificationItem = {
          id: `server-${incoming.id}`,
          title: incoming.title || 'Notice',
          message: incoming.message,
          createdAt: incoming.created_at || new Date().toISOString(),
          unread: !incoming.is_read,
          source: 'server' as const,
          homeExercises: this.extractHomeExercises(incoming.message),
        };

        // Prepend to current list (deduplicate by id)
        const current = this.notificationsSubject.value;
        const deduped = [item, ...current.filter((n) => n.id !== item.id)];
        this.publishNotifications(this.sortNotifications(deduped));

        // Send a native device notification banner with High Importance
        void this.sendDeviceNotification({ ...item, key: undefined }, undefined, 'fordago-alerts');
      });
    };

    // 1. User-specific private channel
    const userChannel = this.echoService.privateChannel(`user.${userId}`);
    if (userChannel) {
      userChannel.listen('.notification.sent', (data: any) => {
        handleIncomingNotification(data?.notification);
      });
    }

    // 2. Global announcements public channel
    const globalChannel = this.echoService.channel('notifications.global');
    if (globalChannel) {
      globalChannel.listen('.notification.sent', (data: any) => {
        handleIncomingNotification(data?.notification);
      });
    }
  }

  /**
   * Fetches the latest notification list and publishes it to every subscriber.
   * Deduplicates in-flight requests: if a fetch is already running, the same
   * Promise is returned so multiple callers never trigger parallel HTTP calls.
   * Also enforces a minimum 10-second interval to prevent hammering the backend
   * on rapid page navigations.
   */
  async refreshNotifications(force = false): Promise<void> {
    const now = Date.now();
    // Skip if last refresh was too recent (unless forced by a real-time event)
    if (!force && (now - this.lastRefreshAt) < this.MIN_REFRESH_INTERVAL_MS) {
      return;
    }
    // Deduplicate: reuse existing in-flight promise
    if (this.inFlightRefresh) {
      return this.inFlightRefresh;
    }
    this.lastRefreshAt = now;
    this.inFlightRefresh = this.loadNotifications()
      .then((data) => { this.notificationsSubject.next(data); })
      .finally(() => { this.inFlightRefresh = null; });
    return this.inFlightRefresh;
  }

  /** Publishes an already-computed list without re-fetching from the server — used after a local mark-as-read mutation so every panel instance reflects it immediately instead of waiting for the next poll. */
  publishNotifications(data: AppNotificationItem[]): void {
    this.notificationsSubject.next(data);
  }

  async notifyMissedWorkout(sessionTitle: string, dayDate: Date, uniqueKey: string, homeExercises: string[] = []): Promise<void> {
    // CRITICAL: NEVER fire missed workout notifications if user is not logged in
    if (!this.auth.token || !this.auth.user) {
      return;
    }

    const notified = this.readNotifiedMissed();
    if (notified.includes(uniqueKey)) {
      return;
    }

    // Skip notifications for sessions that occurred before the user created their account
    const accountCreatedAt = this.auth.user?.created_at ? new Date(this.auth.user.created_at) : null;
    if (accountCreatedAt) {
      const sessionDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
      accountCreatedAt.setHours(0, 0, 0, 0);
      if (sessionDay < accountCreatedAt) {
        return;
      }
    }

    const createdAt = new Date().toISOString();
    const normalizedDay = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 12, 0, 0, 0);
    const dayLabel = normalizedDay.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    // Was `⚠️ Missed Workout: ...` -- the warning emoji made this read as
    // an alarm/error rather than a gentle reminder, and it never matched
    // the backend's own clean title format anyway (see
    // NotificationController::missedWorkoutAlert(), which has never used
    // an emoji). Once the backend confirms this alert, this local stand-in
    // is deleted and replaced by the server copy -- so keeping them
    // visually consistent means the title no longer visibly changes/
    // "downgrades" a few seconds after it first appears.
    const title = `Missed Workout: ${sessionTitle}`;
    const normalizedExercises = (homeExercises || [])
      .map((item) => String(item || '').trim())
      .filter(Boolean)
      .slice(0, 8);
    const homeGuide = normalizedExercises.length
      ? ` | Home workout: ${normalizedExercises.join(' • ')}`
      : '';
    const message = `You missed ${sessionTitle} on ${dayLabel}.${homeGuide}`;
    const localNotification: StoredNotificationItem = {
      id: `missed-${uniqueKey}`,
      key: uniqueKey,
      title,
      message,
      createdAt,
      unread: true,
      source: 'local',
      homeExercises: normalizedExercises,
    };

    notified.push(uniqueKey);
    this.writeNotifiedMissed(notified);
    this.writeLocalNotifications([localNotification, ...this.readLocalNotifications()]);
    await this.sendDeviceNotification(localNotification);

    // Publish immediately so every open panel/badge reflects this the
    // instant it happens instead of waiting for the next 15s poll tick —
    // this is what makes "missed workout" notifications feel real-time.
    this.publishNotifications(
      this.sortNotifications([localNotification, ...this.notificationsSubject.value])
    );

    const token = this.auth.token;
    if (!token) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.post(
          `${this.api}/notifications/missed-workout-alert`,
          {
            sessionTitle,
            dayLabel,
            homeExercises: normalizedExercises,
            // Lets the backend dedup on (user_id, session_key) — see
            // NotificationController::missedWorkoutAlert() — so a cleared
            // localStorage / reinstall / different device re-reporting this
            // same missed session updates the existing notification instead
            // of creating a duplicate row.
            sessionKey: uniqueKey,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      // The backend now has its own canonical copy of this notification
      // (with its own server-assigned id/timestamp). Drop the local stand-in
      // so the next refresh shows ONE entry from the server instead of a
      // local+server duplicate pair with two slightly different timestamps
      // — that mismatch was what made the same missed-workout alert appear
      // to "jump around" in the list (sometimes adjacent, sometimes split
      // apart by whatever else sorted between their two createdAt values).
      this.writeLocalNotifications(
        this.readLocalNotifications().filter((item) => item.id !== localNotification.id)
      );
      void this.refreshNotifications(true); // force — new data was just written to the server
    } catch {
      // Keep local and device alerts even if backend save/SMS fails.
    }
  }

  /**
   * Fires a "starting soon" reminder notification 30 minutes before a
   * scheduled workout session. Called by WorkoutTrackerService's
   * scheduleUpcomingReminders() timers — one precise setTimeout per
   * upcoming today-session — so the notification fires exactly 30 minutes
   * before the session's scheduled time.
   *
   * Dedupes via localStorage so re-runs of scheduleUpcomingReminders()
   * (e.g. app reopened near the reminder window, store written while the
   * member is on schedule page) never fire a second banner for the same
   * session. `uniqueKey` must encode both the session id and its scheduled
   * time so that editing a session's time clears the old dedupe record and
   * the rescheduled timer can notify again at the new time.
   *
   * Tapping this notification navigates to /schedule (not /dashboard)
   * because the reminder is session-specific and the Schedule page is
   * where the member can see, start, or edit that session directly.
   */
  async notifyUpcomingWorkout(sessionTitle: string, sessionTime: string, uniqueKey: string): Promise<void> {
    const notified = this.readNotifiedUpcoming();
    if (notified.includes(uniqueKey)) {
      return;
    }

    const createdAt = new Date().toISOString();
    const title = `⏰ Upcoming Workout: ${sessionTitle}`;
    const message = `Your ${sessionTitle} session starts in 30 minutes (${sessionTime}). Get ready!`;
    const localNotification: StoredNotificationItem = {
      id: `upcoming-${uniqueKey}`,
      key: uniqueKey,
      title,
      message,
      createdAt,
      unread: true,
      source: 'local',
    };

    notified.push(uniqueKey);
    this.writeNotifiedUpcoming(notified);
    this.writeLocalNotifications([localNotification, ...this.readLocalNotifications()]);

    // Send device notification with targetRoute so tapping it opens /schedule
    await this.sendDeviceNotification(localNotification, '/schedule');

    // Publish immediately so the badge and panel reflect it in real-time
    this.publishNotifications(
      this.sortNotifications([localNotification, ...this.notificationsSubject.value])
    );
  }

  /**
   * Fires the "session duration reached" ring/notification once a running
   * Start/Stop session timer (see DashboardPage.checkDurationAlerts()) has
   * run at least as long as the session's scheduled duration. This is
   * purely informational — it never stops the timer or marks the session
   * done; the member keeps going (or taps Stop) on their own, and actual
   * tracked minutes / session history / averages are unaffected.
   *
   * `uniqueKey` should embed the session's startedAt timestamp (not just
   * its id) so a later Start→Stop→Start cycle for the same session can
   * alert again instead of being silently swallowed by the dedupe list
   * below, which persists indefinitely like notifyMissedWorkout's does.
   */
  async notifyDurationReached(sessionTitle: string, uniqueKey: string): Promise<void> {
    const notified = this.readNotifiedDuration();
    if (notified.includes(uniqueKey)) {
      return;
    }

    const createdAt = new Date().toISOString();
    const title = `⏰ Duration Complete: ${sessionTitle}`;
    const message = `Your set duration for ${sessionTitle} is up. Keep going if you're not done, or tap Stop to end the session.`;
    const localNotification: StoredNotificationItem = {
      id: `duration-${uniqueKey}`,
      key: uniqueKey,
      title,
      message,
      createdAt,
      unread: true,
      source: 'local',
    };

    notified.push(uniqueKey);
    this.writeNotifiedDuration(notified);
    this.writeLocalNotifications([localNotification, ...this.readLocalNotifications()]);
    await this.sendDeviceNotification(localNotification);

    // Duration-reached alerts are local-only (no backend call), so this is
    // the only publish point for them — without it, the panel/badge would
    // wait for the next 15s poll to show it, same real-time gap as the
    // missed-workout alert had.
    this.publishNotifications(
      this.sortNotifications([localNotification, ...this.notificationsSubject.value])
    );
  }

  async loadNotifications(): Promise<AppNotificationItem[]> {
    const localNotifications = this.readLocalNotifications();
    const token = this.auth.token;

    if (!token) {
      return this.sortNotifications(localNotifications);
    }

    try {
      const response = await firstValueFrom(
        this.http.get<Array<{ id: number; title?: string; message: string; created_at?: string; is_read?: boolean }>>(
          `${this.api}/notifications`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      const list = Array.isArray(response) ? response : [];
      const readServerIds = new Set(this.readReadServerNotifications());
      const deliveredIds = new Set(this.readDeliveredServerNotifications());
      const isStaff = this.auth.hasAdminAccess();
      const defaultTargetRoute = isStaff ? '/admin' : '/dashboard';
      let hasNewDelivered = false;

      const serverNotifications: AppNotificationItem[] = list.map((item) => {
        const unread = !item.is_read && !readServerIds.has(item.id);
        const appItem: AppNotificationItem = {
          id: `server-${item.id}`,
          title: item.title || (isStaff ? 'FordaGO Admin Alert' : 'Notice'),
          message: item.message,
          createdAt: item.created_at || new Date().toISOString(),
          unread,
          source: 'server',
          homeExercises: this.extractHomeExercises(item.message),
        };

        // If this unread notification hasn't been delivered as a native device banner yet
        if (unread && !deliveredIds.has(item.id)) {
          deliveredIds.add(item.id);
          hasNewDelivered = true;
          // Trigger native notification with sound & vibration
          void this.sendDeviceNotification(appItem, defaultTargetRoute, 'fordago-alerts');
        }

        return appItem;
      });

      if (hasNewDelivered) {
        this.writeDeliveredServerNotifications(Array.from(deliveredIds));
      }

      return this.sortNotifications([...localNotifications, ...serverNotifications]);
    } catch {
      return this.sortNotifications(localNotifications);
    }
  }

  async markRead(notification: AppNotificationItem): Promise<void> {
    await this.markAllRead([notification]);
  }

  async markAllRead(notifications: AppNotificationItem[]): Promise<void> {
    const localIds = new Set(
      notifications
        .filter((item) => item.source === 'local')
        .map((item) => item.id)
    );
    const serverIds = notifications
      .filter((item) => item.source === 'server')
      .map((item) => Number(item.id.replace('server-', '')))
      .filter((value) => !Number.isNaN(value));

    const updatedLocal = this.readLocalNotifications().map((item) => (
      localIds.has(item.id) ? { ...item, unread: false } : item
    ));

    this.writeLocalNotifications(updatedLocal);

    const readServerIds = new Set(this.readReadServerNotifications());
    serverIds.forEach((id) => readServerIds.add(id));
    this.writeReadServerNotifications(Array.from(readServerIds));

    // Publish the now-read state immediately so every open panel/badge
    // (and the header's unread count) reflects it without waiting for the
    // next poll — mirrors the same real-time fix applied to new
    // notifications above.
    this.publishNotifications(
      this.sortNotifications(
        this.notificationsSubject.value.map((item) => {
          const isTargeted = notifications.some(
            (target) => target.id === item.id && target.source === item.source
          );
          return isTargeted ? { ...item, unread: false } : item;
        })
      )
    );

    const token = this.auth.token;
    if (!token) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.patch(
          `${this.api}/notifications/read`,
          { all: true, ids: serverIds },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    } catch {
      // Keep local unread state in sync even if backend persistence fails.
    }
  }

  private readLocalNotifications(): StoredNotificationItem[] {
    try {
      const raw = localStorage.getItem(this.getScopedStorageKey(this.localNotificationsKey));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeLocalNotifications(notifications: StoredNotificationItem[]): void {
    const deduped = notifications.reduce<StoredNotificationItem[]>((accumulator, current) => {
      if (accumulator.some((item) => item.id === current.id)) {
        return accumulator;
      }
      accumulator.push(current);
      return accumulator;
    }, []);

    localStorage.setItem(this.getScopedStorageKey(this.localNotificationsKey), JSON.stringify(deduped.slice(0, 50)));
  }

  private readNotifiedMissed(): string[] {
    try {
      const raw = localStorage.getItem(this.getScopedStorageKey(this.notifiedMissedKey));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeNotifiedMissed(keys: string[]): void {
    localStorage.setItem(this.getScopedStorageKey(this.notifiedMissedKey), JSON.stringify(Array.from(new Set(keys))));
  }

  private readNotifiedDuration(): string[] {
    try {
      const raw = localStorage.getItem(this.getScopedStorageKey(this.notifiedDurationKey));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeNotifiedDuration(keys: string[]): void {
    localStorage.setItem(this.getScopedStorageKey(this.notifiedDurationKey), JSON.stringify(Array.from(new Set(keys))));
  }

  private readNotifiedUpcoming(): string[] {
    try {
      const raw = localStorage.getItem(this.getScopedStorageKey(this.notifiedUpcomingKey));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeNotifiedUpcoming(keys: string[]): void {
    localStorage.setItem(this.getScopedStorageKey(this.notifiedUpcomingKey), JSON.stringify(Array.from(new Set(keys))));
  }

  private readReadServerNotifications(): number[] {
    try {
      const raw = localStorage.getItem(this.getScopedStorageKey(this.readServerNotificationsKey));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeReadServerNotifications(ids: number[]): void {
    localStorage.setItem(this.getScopedStorageKey(this.readServerNotificationsKey), JSON.stringify(Array.from(new Set(ids))));
  }

  private readDeliveredServerNotifications(): number[] {
    try {
      const raw = localStorage.getItem(this.getScopedStorageKey(this.deliveredServerNotificationsKey));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private writeDeliveredServerNotifications(ids: number[]): void {
    localStorage.setItem(this.getScopedStorageKey(this.deliveredServerNotificationsKey), JSON.stringify(Array.from(new Set(ids)).slice(-300)));
  }

  private getScopedStorageKey(baseKey: string): string {
    const userId = this.auth.user?.id ? String(this.auth.user.id) : 'guest';
    return `${baseKey}_${userId}`;
  }

  private sortNotifications(notifications: AppNotificationItem[]): AppNotificationItem[] {
    return [...notifications].sort((left, right) => (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    ));
  }

  private extractHomeExercises(message: string): string[] {
    const text = String(message || '');
    const marker = 'Home workout:';
    const markerIndex = text.indexOf(marker);
    if (markerIndex === -1) {
      return [];
    }

    const section = text.slice(markerIndex + marker.length);
    return section
      .split('\n')
      .map((line) => line.replace(/^\s*\d+\)\s*/, '').trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  /**
   * @param targetRoute Optional route to navigate to when the notification is
   *   tapped (e.g. '/schedule' for upcoming-workout reminders). Stored in the
   *   native notification's `extra` object and read by app.component.ts's
   *   localNotificationActionPerformed handler. For web notifications it is
   *   passed directly to openFromDeviceNotification().
   */
  /**
   * Schedules an exact native notification on Android AlarmManager
   * so it rings and displays on the phone 30 minutes before workout EVEN IF THE APP IS CLOSED.
   */
  public async scheduleNativeUpcomingReminder(sessionTitle: string, sessionTime: string, uniqueKey: string, reminderDate: Date): Promise<void> {
    if (reminderDate.getTime() <= Date.now()) {
      return;
    }

    const title = `⏰ Upcoming Workout: ${sessionTitle}`;
    const message = `Your ${sessionTitle} session starts in 30 minutes (${sessionTime}). Get ready!`;
    const notifId = this.hashNotificationId(uniqueKey);

    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await this.initNativeNotificationChannels();
        await LocalNotifications.schedule({
          notifications: [{
            id: notifId,
            title,
            body: message,
            channelId: 'fordago-reminders-v2',
            smallIcon: 'ic_stat_icon',
            iconColor: '#FFD700',
            schedule: {
              at: reminderDate,
              allowWhileIdle: true,
            },
            extra: {
              targetRoute: '/schedule',
              uniqueKey,
            },
          }],
        });
      } catch (err) {
        console.warn('Failed to schedule native upcoming reminder:', err);
      }
    }
  }

  /**
   * Schedules a native notification for when a workout time has passed and becomes missed,
   * so it rings and sends home workout alternative suggestions even if the app is closed.
   */
  public async scheduleNativeMissedAlert(
    sessionTitle: string,
    uniqueKey: string,
    missedDate: Date,
    homeExercises?: string[]
  ): Promise<void> {
    // Skip only if the target time is meaningfully in the past (>5s).
    // Allowing near-exact times through so the alarm fires even if there's
    // slight latency between scheduling and the OS registering the alarm.
    if (missedDate.getTime() < Date.now() - 5000) {
      return;
    }


    const title = `Missed Workout: ${sessionTitle}`;
    const normalizedExercises = (homeExercises || []).slice(0, 6);
    const body = normalizedExercises.length
      ? `You missed your scheduled ${sessionTitle} session today.\n\n🏠 Suggested Home Workout:\n${normalizedExercises.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}`
      : `You missed your scheduled ${sessionTitle} session today. Tap to view home alternative exercises!`;

    const notifId = this.hashNotificationId(`missed-${uniqueKey}`);

    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await this.initNativeNotificationChannels();
        await LocalNotifications.schedule({
          notifications: [{
            id: notifId,
            title,
            body,
            channelId: 'fordago-reminders-v2',
            smallIcon: 'ic_stat_icon',
            iconColor: '#FFD700',
            schedule: {
              at: missedDate,
              allowWhileIdle: true,
            },
            extra: {
              type: 'missed_workout',
              targetRoute: '/schedule',
              uniqueKey,
            },
          }],
        });
      } catch (err) {
        console.warn('Failed to schedule native missed alert:', err);
      }
    }
  }

  /**
   * Cancels any scheduled native reminders / missed alerts for a given workout session key.
   * Called when a workout is completed or actively started.
   */
  public async cancelNativeWorkoutAlerts(uniqueKey: string): Promise<void> {
    if (!uniqueKey || !Capacitor.isNativePlatform()) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      const upcomingId = this.hashNotificationId(uniqueKey);
      const missedId = this.hashNotificationId(`missed-${uniqueKey}`);
      await LocalNotifications.cancel({
        notifications: [{ id: upcomingId }, { id: missedId }],
      });
    } catch {}
  }

  /**
   * Schedules an exact native notification on Android AlarmManager
   * so it rings and vibrates when the workout duration is reached,
   * EVEN IF THE APP IS CLOSED OR THE PHONE IS SLEEPING.
   */
  public async scheduleNativeDurationAlarm(sessionTitle: string, durationMinutes: number, sessionId: string): Promise<void> {
    if (durationMinutes <= 0) {
      return;
    }

    const triggerAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    const title = `⏰ Workout Duration Reached: ${sessionTitle}`;
    const message = `You've reached your scheduled ${durationMinutes} min workout. Tap to complete or view your session.`;
    const notifId = this.hashNotificationId(`duration-${sessionId}`);

    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await this.initNativeNotificationChannels();
        await LocalNotifications.schedule({
          notifications: [{
            id: notifId,
            title,
            body: message,
            channelId: 'fordago-reminders-v2',
            smallIcon: 'ic_stat_icon',
            iconColor: '#FFD700',
            schedule: {
              at: triggerAt,
              allowWhileIdle: true,
            },
            extra: {
              type: 'workout_duration',
              sessionId,
              targetRoute: '/dashboard',
            },
          }],
        });
      } catch (err) {
        console.warn('Failed to schedule native duration alarm:', err);
      }
    }
  }

  /**
   * Cancels any scheduled native duration alarm for a given session.
   * Called when session is stopped, completed, or all exercises are checked.
   */
  public async cancelNativeDurationAlarm(sessionId: string): Promise<void> {
    if (!sessionId) return;
    const notifId = this.hashNotificationId(`duration-${sessionId}`);
    if (Capacitor.isNativePlatform()) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        await LocalNotifications.cancel({
          notifications: [{ id: notifId }],
        });
      } catch (err) {
        console.warn('Failed to cancel native duration alarm:', err);
      }
    }
  }

  /**
   * @param targetRoute Optional route to navigate to when the notification is tapped.
   * @param channelId Optional notification channel ID ('fordago-alerts-v2' or 'fordago-reminders-v2').
   */
  private async sendDeviceNotification(
    notification: StoredNotificationItem,
    targetRoute?: string,
    channelId: string = 'fordago-alerts-v2'
  ): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await this.initNativeNotificationChannels();
      const permissions = await LocalNotifications.checkPermissions();
      const granted = permissions.display === 'granted'
        ? permissions
        : await LocalNotifications.requestPermissions();

      if (granted.display !== 'granted') {
        return;
      }

      // Build a detailed body with exercises on separate lines for native platforms
      const exercises = notification.homeExercises ?? [];
      const expandedBody = exercises.length
        ? `${notification.message}\n\n🏠 Home Workout Plan:\n${exercises.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}`
        : notification.message;

      await LocalNotifications.schedule({
        notifications: [{
          id: this.hashNotificationId(notification.id),
          title: notification.title,
          body: expandedBody,
          channelId: channelId,
          smallIcon: 'ic_stat_icon',
          iconColor: '#FFD700',
          schedule: { at: new Date(Date.now() + 500), allowWhileIdle: true },
          extra: {
            notificationId: notification.id,
            targetRoute: targetRoute ?? null,
          },
          largeBody: expandedBody,
          summaryText: exercises.length ? `${exercises.length} exercises to do at home` : undefined,
        }],
      });
      return;
    }

    if (typeof window === 'undefined' || !("Notification" in window)) {
      return;
    }

    const exercises = notification.homeExercises ?? [];
    const webBody = exercises.length
      ? `${notification.message}\n\n🏠 Home Workout:\n${exercises.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}`
      : notification.message;

    if (Notification.permission === 'granted') {
      const webNotification = new Notification(notification.title, { body: webBody });
      // Same "land in the app's own Notifications panel" behavior as the
      // native LocalNotifications tap handler in app.component.ts -- see
      // NotificationCenterService.openFromDeviceNotification(). Without
      // this, clicking a web push notification only focused/opened the
      // tab and left the person wherever the page happened to be, with no
      // way to get back to that specific notification short of manually
      // opening the bell icon and scrolling to find it again.
      // `targetRoute` lets upcoming-workout reminders navigate to /schedule
      // on click instead of the default /dashboard panel.
      webNotification.onclick = () => {
        window.focus();
        this.openFromDeviceNotification(notification.id, targetRoute);
        webNotification.close();
      };
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const webNotification = new Notification(notification.title, { body: webBody });
        webNotification.onclick = () => {
          window.focus();
          this.openFromDeviceNotification(notification.id, targetRoute);
          webNotification.close();
        };
      }
    }
  }

  private hashNotificationId(input: string): number {
    let hash = 0;
    for (let index = 0; index < input.length; index += 1) {
      hash = ((hash << 5) - hash) + input.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash) || Date.now();
  }
}