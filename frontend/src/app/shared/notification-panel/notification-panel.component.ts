// notification-panel.component.ts
//
// Single shared "Notifications" dropdown (list view + detail view), backed
// entirely by NotificationCenterService.
//
// WHY THIS EXISTS:
// Every page (dashboard, schedule, equipment, inventory, profile,
// qr-scanner) used to duplicate this overlay's markup, CSS, AND its
// open/list/detail component state independently. Several pages also
// fetched notifications via their own raw `this.http.get(...)` call
// instead of going through NotificationCenterService. That's why the
// unread count and panel appearance drifted between pages -- each page ran
// its own timing/logic. This component is now the ONLY place that
// markup/state should live: a page just toggles [isOpen] from its header
// bell button and listens to (unreadCountChange) to keep its own header
// badge in sync, without touching HttpClient directly.
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { NotificationCenterService, AppNotificationItem } from '../../services/notification-center.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss'],
})
export class NotificationPanelComponent implements OnInit, OnDestroy, OnChanges {
  /** Whether the overlay is visible. Parent owns this — set true from the header bell's (notifClick). */
  @Input() isOpen = false;

  /** Emitted when the panel should close (backdrop tap, close button). Parent should set isOpen = false. */
  @Output() closed = new EventEmitter<void>();

  /** Emitted whenever the notification set (re)loads or read-state changes, so the parent page's
   *  own header [unreadCount] input stays accurate without re-implementing fetch/merge logic. */
  @Output() unreadCountChange = new EventEmitter<number>();

  notifications: AppNotificationItem[] = [];
  view: 'list' | 'detail' = 'list';
  selectedNotification: AppNotificationItem | null = null;

  private refreshTimer: ReturnType<typeof setInterval> | null = null;
  private isDestroyed = false;

  get unreadCount(): number {
    return this.notifications.filter((item) => item.unread).length;
  }

  constructor(private notificationCenter: NotificationCenterService) {}

  ngOnInit(): void {
    // Load immediately (so the header badge is correct even before the
    // panel is ever opened) and keep polling in the background, same
    // cadence the dashboard previously used on its own.
    void this.refresh();
    this.refreshTimer = setInterval(() => {
      void this.refresh();
    }, 15000);
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.view = 'list';
      this.selectedNotification = null;
      void this.refresh();
    }
  }

  private async refresh(): Promise<void> {
    try {
      const data = await this.notificationCenter.loadNotifications();
      if (this.isDestroyed) return;
      this.notifications = data;
    } catch {
      // Keep whatever was last loaded if a refresh fails; the badge/panel
      // simply won't reflect brand-new notifications until the next tick.
    }
    this.unreadCountChange.emit(this.unreadCount);
  }

  close(): void {
    this.closed.emit();
  }

  async markAllRead(): Promise<void> {
    await this.notificationCenter.markAllRead(this.notifications);
    this.notifications = this.notifications.map((item) => ({ ...item, unread: false }));
    this.unreadCountChange.emit(this.unreadCount);
  }

  async openNotification(notification: AppNotificationItem): Promise<void> {
    this.selectedNotification = notification;
    this.view = 'detail';

    if (!notification.unread) {
      return;
    }

    await this.notificationCenter.markRead(notification);

    this.notifications = this.notifications.map((item) => (
      item.id === notification.id && item.source === notification.source
        ? { ...item, unread: false }
        : item
    ));

    if (
      this.selectedNotification &&
      this.selectedNotification.id === notification.id &&
      this.selectedNotification.source === notification.source
    ) {
      this.selectedNotification = { ...this.selectedNotification, unread: false };
    }

    this.unreadCountChange.emit(this.unreadCount);
  }

  backToList(): void {
    this.view = 'list';
    this.selectedNotification = null;
  }
}
