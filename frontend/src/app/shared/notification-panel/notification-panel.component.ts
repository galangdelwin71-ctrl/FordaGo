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
import { IonContent, IonIcon, IonModal } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { NotificationCenterService, AppNotificationItem } from '../../services/notification-center.service';

@Component({
  selector: 'app-notification-panel',
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonModal],
  templateUrl: './notification-panel.component.html',
  styleUrls: ['./notification-panel.component.scss'],
})
export class NotificationPanelComponent implements OnInit, OnDestroy, OnChanges {
  /** Whether the overlay is visible. Parent owns this — set true from the header bell's (notifClick). */
  @Input() isOpen = false;

  /** Emitted when the panel should close (backdrop tap, close button). Parent should set isOpen = false. */
  @Output() closed = new EventEmitter<void>();

  /**
   * Emitted when a device notification tap (see NotificationCenterService.
   * pendingOpen$) wants this panel shown, but the parent currently has it
   * closed (isOpen = false). The parent should respond by setting its own
   * `notifPanelOpen`-equivalent flag to true -- this component cannot open
   * itself since visibility is fully owned by the parent's [isOpen] input,
   * by design (see the isOpen doc comment above).
   */
  @Output() requestOpen = new EventEmitter<void>();

  /** Emitted whenever the notification set (re)loads or read-state changes, so the parent page's
   *  own header [unreadCount] input stays accurate without re-implementing fetch/merge logic. */
  @Output() unreadCountChange = new EventEmitter<number>();

  notifications: AppNotificationItem[] = [];
  view: 'list' | 'detail' = 'list';
  selectedNotification: AppNotificationItem | null = null;

  // Subscribes to NotificationCenterService's single shared poll/publish
  // stream instead of running its own setInterval + loadNotifications()
  // call. This component is embedded on nearly every page (dashboard,
  // schedule, equipment, inventory, profile, qr-scanner), and since Ionic
  // doesn't always fully destroy a previous page's component when
  // navigating, an independent per-instance timer here meant several
  // overlapping 15s polls could be live at once — each resolving at a
  // slightly different time and racing to overwrite `notifications`,
  // which is what made the list appear to reorder itself (an entry
  // "jumping" from the middle to the edge, or splitting apart from a
  // duplicate) between refreshes. One shared BehaviorSubject means every
  // instance renders the exact same list at the exact same time.
  private subscription?: Subscription;

  // Consume-once target set by a device-notification tap (see
  // NotificationCenterService.pendingOpen$) -- once the matching item is
  // found in `notifications` and opened, this is cleared so a later,
  // unrelated refresh doesn't try to re-open it again.
  private pendingTargetId: string | null = null;
  private pendingOpenSubscription?: Subscription;

  // Set for exactly one ngOnChanges pass: true right after
  // tryOpenPendingTarget() has already switched `view` to 'detail' for a
  // device-notification tap. The parent flipping [isOpen] false→true in
  // response to requestOpen (see above) fires ngOnChanges on the SAME
  // logical open, which would otherwise unconditionally reset view back
  // to 'list' a tick later and silently undo the detail view we just
  // opened. This flag tells that ngOnChanges pass to skip the reset
  // exactly once, then clears itself (see ngOnChanges and the isOpen→
  // false branch below, which also clears it so it can never leak into a
  // later, unrelated manual open).
  private skipNextViewReset = false;

  get unreadCount(): number {
    return this.notifications.filter((item) => item.unread).length;
  }

  constructor(private notificationCenter: NotificationCenterService) {}

  ngOnInit(): void {
    // Safe to call from every instance — only the first call actually
    // starts the timer (see NotificationCenterService.startPolling()).
    this.notificationCenter.startPolling();
    this.subscription = this.notificationCenter.notifications$.subscribe((data) => {
      this.notifications = data;
      this.unreadCountChange.emit(this.unreadCount);
      this.tryOpenPendingTarget();
    });

    this.pendingOpenSubscription = this.notificationCenter.pendingOpen$.subscribe((id) => {
      // `null` is the BehaviorSubject's resting state (nothing pending, or
      // already consumed by clearPendingOpenNotification()) -- every panel
      // instance receives that on subscribe by construction, and must NOT
      // treat it as a real request.
      if (id === null) {
        return;
      }

      this.pendingTargetId = id;
      // Consume immediately (not after opening) so a second panel instance
      // mounting shortly after (e.g. navigating tabs) never re-fires this
      // same request a second time.
      this.notificationCenter.clearPendingOpenNotification();
      this.requestOpen.emit();
      this.tryOpenPendingTarget();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.pendingOpenSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isOpen']) {
      return;
    }

    if (this.isOpen) {
      if (this.skipNextViewReset) {
        this.skipNextViewReset = false;
      } else {
        this.view = 'list';
        this.selectedNotification = null;
      }
      void this.notificationCenter.refreshNotifications();
    } else {
      // Closed -- never let a stale flag from this session leak into a
      // later, unrelated manual open.
      this.skipNextViewReset = false;
    }
  }

  close(): void {
    this.closed.emit();
  }

  // NotificationCenterService.markAllRead()/markRead() now publish the
  // updated read-state to the shared notifications$ stream themselves (see
  // the service), so this component no longer needs to hand-mutate its own
  // `notifications` array afterward — the subscription in ngOnInit() picks
  // up the change automatically. Keeping a second, separate mutation here
  // was itself a source of drift: if this local copy and the service's
  // published copy ever disagreed (e.g. a poll landing in between), the
  // panel could flash stale read/unread state for a tick.
  async markAllRead(): Promise<void> {
    await this.notificationCenter.markAllRead(this.notifications);
  }

  async openNotification(notification: AppNotificationItem): Promise<void> {
    this.selectedNotification = notification;
    this.view = 'detail';

    if (!notification.unread) {
      return;
    }

    await this.notificationCenter.markRead(notification);

    // Keep the open detail view's own local copy in sync (it's a snapshot
    // captured above, not part of the `notifications` array reference).
    if (
      this.selectedNotification &&
      this.selectedNotification.id === notification.id &&
      this.selectedNotification.source === notification.source
    ) {
      this.selectedNotification = { ...this.selectedNotification, unread: false };
    }
  }

  backToList(): void {
    this.view = 'list';
    this.selectedNotification = null;
  }

  /**
   * Tries to resolve a pending device-notification-tap target (see
   * ngOnInit's pendingOpen$ subscription) against the currently loaded
   * `notifications` list. Called both right after a tap request comes in
   * AND every time the list itself refreshes, because the two can race:
   * the tap can arrive before this panel's own notifications$ has loaded
   * the target item yet (e.g. right after a cold start), in which case
   * this quietly no-ops here and succeeds on the next refresh instead.
   */
  private tryOpenPendingTarget(): void {
    if (!this.pendingTargetId) {
      return;
    }

    const match = this.notifications.find((item) => item.id === this.pendingTargetId);
    if (!match) {
      return;
    }

    this.pendingTargetId = null;
    this.skipNextViewReset = true;
    void this.openNotification(match);
  }
}
