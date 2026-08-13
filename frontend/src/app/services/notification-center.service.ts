import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { API_BASE_URL } from '../config/api.config';

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
  private readonly readServerNotificationsKey = 'fordago_read_server_notifications_v1';

  constructor(private http: HttpClient, private auth: AuthService) {}

  private resolveApiBase(): string {
    return API_BASE_URL;
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
    const title = `⚠️ Missed Workout: ${sessionTitle}`;
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
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );
    } catch {
      // Keep local and device alerts even if backend save/SMS fails.
    }
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
      new Notification(notification.title, { body: webBody });
      return;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification(notification.title, { body: webBody });
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