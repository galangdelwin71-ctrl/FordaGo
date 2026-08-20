import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
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
  private readonly readServerNotificationsKey = 'fordago_read_server_notifications_v1';

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

  constructor(private http: HttpClient, private auth: AuthService, private router: Router) {}

  /**
   * Called when the person taps a device notification (native OS tray via
   * Capacitor LocalNotifications, or a web Notification) — see
   * app.component.ts's registerNotificationTapListener() for native, and
   * sendDeviceNotification() below for web. Always routes to /dashboard
   * first (the one page guaranteed to embed the shared notifications
   * panel and to exist for every logged-in member) so tapping a
   * notification behaves the same way regardless of which page the app
   * happened to resume on, or whether it was cold-started by the tap.
   */
  openFromDeviceNotification(notificationId: string | null): void {
    this.pendingOpenSubject.next(notificationId);
    void this.router.navigate(['/dashboard']);
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
   * Starts the ONE shared background poll. Safe to call from every page —
   * only the first call actually does anything; subsequent calls
   * (e.g. every time a page's NotificationPanelComponent mounts) are
   * no-ops thanks to the pollTimer guard.
   */
  startPolling(): void {
    if (this.pollTimer) {
      return;
    }

    void this.refreshNotifications();
    this.pollTimer = setInterval(() => {
      void this.refreshNotifications();
    }, 15000);
  }

  /** Fetches the latest notification list and publishes it to every subscriber (all open panel instances update together). */
  async refreshNotifications(): Promise<void> {
    const data = await this.loadNotifications();
    this.notificationsSubject.next(data);
  }

  /** Publishes an already-computed list without re-fetching from the server — used after a local mark-as-read mutation so every panel instance reflects it immediately instead of waiting for the next poll. */
  publishNotifications(data: AppNotificationItem[]): void {
    this.notificationsSubject.next(data);
  }

  async notifyMissedWorkout(sessionTitle: string, dayDate: Date, uniqueKey: string, homeExercises: string[] = []): Promise<void> {
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
      void this.refreshNotifications();
    } catch {
      // Keep local and device alerts even if backend save/SMS fails.
    }
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

      const readServerIds = new Set(this.readReadServerNotifications());
      const serverNotifications: AppNotificationItem[] = response.map((item) => ({
        id: `server-${item.id}`,
        title: item.title || 'Notice',
        message: item.message,
        createdAt: item.created_at || new Date().toISOString(),
        unread: !item.is_read && !readServerIds.has(item.id),
        source: 'server',
        homeExercises: this.extractHomeExercises(item.message),
      }));

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
    if (!token || serverIds.length === 0) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.patch(
          `${this.api}/notifications/read`,
          { ids: serverIds },
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

  private async sendDeviceNotification(notification: StoredNotificationItem): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
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
          schedule: { at: new Date(Date.now() + 1000) },
          extra: { notificationId: notification.id },
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
      webNotification.onclick = () => {
        window.focus();
        this.openFromDeviceNotification(notification.id);
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
          this.openFromDeviceNotification(notification.id);
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