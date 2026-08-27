import { Component, NgZone, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet, ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { addIcons } from 'ionicons';
import {
  addOutline,
  alarmOutline,
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  bagHandleOutline,
  barChartOutline,
  barbellOutline,
  bodyOutline,
  boatOutline,
  calendar,
  calendarNumberOutline,
  calendarOutline,
  callOutline,
  cameraOutline,
  cardOutline,
  cartOutline,
  cashOutline,
  chatbubbleEllipsesOutline,
  chatbubblesOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  clipboardOutline,
  closeCircleOutline,
  closeOutline,
  cloudOfflineOutline,
  createOutline,
  cube,
  cubeOutline,
  diamondOutline,
  ellipseOutline,
  eyeOffOutline,
  eyeOutline,
  fitnessOutline,
  flame,
  flameOutline,
  flashOutline,
  giftOutline,
  home,
  homeOutline,
  hourglassOutline,
  informationCircleOutline,
  keyOutline,
  keypadOutline,
  locateOutline,
  lockClosedOutline,
  logOutOutline,
  mailOutline,
  megaphoneOutline,
  moonOutline,
  notifications,
  notificationsOffOutline,
  notificationsOutline,
  peopleOutline,
  person,
  personAddOutline,
  personCircleOutline,
  personOutline,
  phonePortraitOutline,
  playOutline,
  qrCodeOutline,
  receiptOutline,
  refreshOutline,
  scan,
  scanOutline,
  searchOutline,
  sendOutline,
  shieldCheckmarkOutline,
  starOutline,
  statsChartOutline,
  stopCircleOutline,
  stopOutline,
  time,
  timeOutline,
  todayOutline,
  trashOutline,
  trendingUpOutline,
  trophyOutline,
  walkOutline,
  warningOutline,
} from 'ionicons/icons';

import { WorkoutTrackerService } from './services/workout-tracker.service';
import { ThemeService } from './services/theme.service';
import { NotificationCenterService } from './services/notification-center.service';
import { CoachingService } from './services/coaching.service';
import { AuthService } from './services/auth.service';
import { FcmService } from './services/fcm.service';
import { ChatToastService } from './services/chat-toast.service';
import { EchoService } from './services/echo.service';
import { firstValueFrom } from 'rxjs';

// Shape of the handle Capacitor's App.addListener() resolves to — declared
// locally instead of importing PluginListenerHandle so this file doesn't
// depend on an internal @capacitor/core type path that may move between
// major versions; the only member actually used (remove()) is pinned here.
interface BackButtonListenerHandle {
  remove(): Promise<void>;
}

// Stage 5: routes with no "back" to go to — hitting the hardware back
// button here should minimize the app, not fall through to browser history
// (which, pre-fix, is exactly what kept bouncing logged-in members back to
// /login). Kept as a Set for O(1) lookup and to make the "what counts as
// root" policy explicit and easy to extend later.
// /admin is included alongside /dashboard/login: it's the entry point of
// the admin side, so back-button-ing from there must never fall through to
// plain browser history — that history can still contain a stale /login
// entry from before the admin/staff account signed in, which is exactly
// what let repeated back presses bounce an already-logged-in admin back to
// the login screen.
//
// /schedule, /equipment, /inventory, /profile, /qr-scanner, and /coaching
// are included alongside /dashboard because they're the app's bottom-nav /
// header-icon TAB pages, not drill-in pages -- every goTo*() method on
// each of those pages now navigates with { replaceUrl: true } (see e.g.
// dashboard.page.ts's goToSchedule()), so switching tabs never pushes a
// new history entry; there is only ever ONE "current tab" entry at a time.
// That means a tab page has nothing meaningful to Location.back() into --
// falling through to plain history from here used to walk back through
// whichever tab happened to be visited earlier (e.g. Home), which read as
// the back button randomly "jumping" to an unrelated screen instead of
// exiting the app like a normal Android root screen. Treating every tab
// page as a root page (double-press-to-exit, see handleRootBackPress())
const BACK_BUTTON_ROOT_PATHS = new Set([
  '/dashboard',
  '/admin',
  '/login',
]);

const TAB_NAVIGATION_PATHS = new Set([
  '/schedule',
  '/equipment',
  '/inventory',
  '/profile',
  '/qr-scanner',
  '/coaching',
]);

// Double-press-to-exit window: a second back press on a root page within
// this many ms actually exits the app; otherwise we just show a warning
// toast and arm the timer. 2s matches the platform-typical Android pattern.
import { OnboardingGuideComponent } from './shared/onboarding-guide/onboarding-guide.component';

const EXIT_CONFIRM_WINDOW_MS = 2000;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, OnboardingGuideComponent],
})
export class AppComponent implements OnDestroy {
  // Populated once Capacitor resolves the listener registration (see
  // registerHardwareBackButton()). Nullable because that resolution is
  // async and ngOnDestroy can in principle run before it settles.
  private backButtonListener: BackButtonListenerHandle | null = null;

  // Timestamp (ms) of the last back-button press made while sitting on a
  // root page. null means "not armed" — the next root-page back press will
  // show the exit-confirmation toast rather than exit immediately.
  private lastRootBackPressAt: number | null = null;

  constructor(
    private workoutTracker: WorkoutTrackerService,
    private themeService: ThemeService,
    private notificationCenter: NotificationCenterService,
    private coachingService: CoachingService,
    private auth: AuthService,
    private fcmService: FcmService,
    private chatToastService: ChatToastService,
    private echoService: EchoService,
    private router: Router,
    private location: Location,
    private toastController: ToastController,
    private zone: NgZone,
  ) {
    addIcons({
      addOutline,
      alarmOutline,
      alertCircleOutline,
      arrowBackOutline,
      arrowForwardOutline,
      bagHandleOutline,
      barChartOutline,
      barbellOutline,
      bodyOutline,
      boatOutline,
      calendar,
      calendarNumberOutline,
      calendarOutline,
      callOutline,
      cameraOutline,
      cardOutline,
      cartOutline,
      cashOutline,
      chatbubbleEllipsesOutline,
      chatbubblesOutline,
      checkmarkCircle,
      checkmarkCircleOutline,
      checkmarkDoneOutline,
      checkmarkOutline,
      chevronBackOutline,
      chevronDownOutline,
      chevronForwardOutline,
      clipboardOutline,
      closeCircleOutline,
      closeOutline,
      cloudOfflineOutline,
      createOutline,
      cube,
      cubeOutline,
      diamondOutline,
      ellipseOutline,
      eyeOffOutline,
      eyeOutline,
      fitnessOutline,
      flame,
      flameOutline,
      flashOutline,
      giftOutline,
      home,
      homeOutline,
      hourglassOutline,
      informationCircleOutline,
      keyOutline,
      keypadOutline,
      locateOutline,
      lockClosedOutline,
      logOutOutline,
      mailOutline,
      megaphoneOutline,
      moonOutline,
      notifications,
      notificationsOffOutline,
      notificationsOutline,
      peopleOutline,
      person,
      personAddOutline,
      personCircleOutline,
      personOutline,
      phonePortraitOutline,
      playOutline,
      qrCodeOutline,
      receiptOutline,
      refreshOutline,
      scan,
      scanOutline,
      searchOutline,
      sendOutline,
      shieldCheckmarkOutline,
      starOutline,
      statsChartOutline,
      stopCircleOutline,
      stopOutline,
      time,
      timeOutline,
      todayOutline,
      trashOutline,
      trendingUpOutline,
      trophyOutline,
      walkOutline,
      warningOutline,
    });

    this.themeService.initTheme();
    this.workoutTracker.startAutoSync();
    this.registerHardwareBackButton();
    void this.notificationCenter.initNativeNotificationChannels();
    void this.registerNotificationTapListener();
    void this.fcmService.init();

    // Automatically poll and listen for real-time notifications for any logged-in user.
    // Also register FCM token on login so backend can send background push notifications.
    this.auth.user$.subscribe(user => {
      if (user) {
        this.notificationCenter.startPolling();
        // Register FCM token with backend — runs async, non-blocking
        void this.fcmService.registerFcmToken();

        // Listen for real-time incoming chat messages anywhere in the app (Coach or Member)
        const userChannel = this.echoService.privateChannel(`user.${user.id}`);
        if (userChannel) {
          userChannel.listen('.message.sent', (data: any) => {
            const msg = data?.message;
            if (!msg || Number(msg.sender_id) === Number(user.id)) return;

            this.zone.run(() => {
              this.coachingService.incrementUnreadCount(1);

              const senderName = `${msg.sender?.first_name || ''} ${msg.sender?.last_name || ''}`.trim() || msg.sender?.username || 'New Message';
              const convo = {
                id: Number(data.conversation_id),
                partnerName: senderName,
                partnerAvatar: msg.sender?.profile_image,
              };
              this.chatToastService.showIncomingMessage(convo, msg.body, msg.id);
            });
          });
        }
      } else {
        this.notificationCenter.stopPolling();
      }
    });
  }

  ngOnDestroy(): void {
    // Prevent a leaked native listener/closure if the root component is
    // ever torn down (e.g. Angular testing harness, hot-reload scenarios).
    void this.backButtonListener?.remove();
  }

  /**
   * Registered once at app boot (mirrors registerHardwareBackButton()
   * just above) so a tap is caught whether the app was already running,
   * backgrounded, or cold-started BY the tap itself -- Capacitor buffers
   * the launch notification and delivers it to this listener as soon as
   * it's registered. Native-only: LocalNotifications.schedule() (see
   * NotificationCenterService.sendDeviceNotification()) only ever fires
   * on a native platform, so there is nothing to listen for on web here
   * -- the equivalent web-Notification tap handling lives inline in that
   * same method instead, since it has direct access to the Notification
   * object it just created.
   */
  private async registerNotificationTapListener(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.addListener('localNotificationActionPerformed', async (action) => {
        const extra = action.notification?.extra ?? {};
        const type = extra['type'];
        const conversationId = extra['conversationId'];

        // If it is an incoming chat notification
        if (type === 'chat' && conversationId) {
          // Direct / Inline reply from notification drawer
          if (action.actionId === 'reply') {
            const replyText = action.inputValue?.trim();
            if (replyText) {
              try {
                await firstValueFrom(this.coachingService.sendMessage(Number(conversationId), replyText));

                // Clear the notification once replied
                if (action.notification?.id) {
                  await LocalNotifications.removeDeliveredNotifications({
                    notifications: [{
                      id: action.notification.id,
                      title: action.notification.title ?? '',
                      body: action.notification.body ?? '',
                    }],
                  });
                }
              } catch (err) {
                console.error('Failed to send inline reply from notification:', err);
              }
            }
            return;
          }

          // If user tapped notification card or clicked 'open', navigate directly to that chat thread
          this.zone.run(() => {
            void this.router.navigate(['/chat', conversationId]);
          });
          return;
        }

        const notificationId = extra['notificationId'];
        // `targetRoute` is set by notification types that want to land on a
        // specific page — upcoming-workout reminders set '/schedule' so the
        // member is taken directly to the Schedule page for that session
        // instead of the generic /dashboard notification panel.
        const targetRoute: string | null = typeof extra['targetRoute'] === 'string' ? extra['targetRoute'] : null;
        this.zone.run(() => {
          this.notificationCenter.openFromDeviceNotification(
            notificationId ? String(notificationId) : null,
            targetRoute
          );
        });
      });
    } catch {
      // Non-fatal: same reasoning as registerHardwareBackButton()'s catch --
      // must not block app startup if native registration fails for any
      // reason (e.g. plugin unavailable on this build).
    }
  }

  /**
   * Stage 5 fix: without this, Capacitor's default hardware back-button
   * behavior is to walk plain browser history (window.history.back()),
   * which had no concept of "logged in" — so a member could end up back on
   * /login while still holding a valid token, and pressing back again from
   * there did nothing visible, making the app feel stuck/broken.
   *
   * Fix has two parts working together:
   *   1. Here: on a root page (dashboard/login) back button triggers the
   *      double-press-to-exit flow (see handleRootBackPress) instead of
   *      navigating anywhere. On any other page it defers to normal
   *      history navigation via Location.back().
   *   2. In app.routes.ts: guestGuard on /login immediately redirects an
   *      already-authenticated member to /dashboard, so even if step 1's
   *      Location.back() does land on a stale /login history entry, the
   *      guard bounces them straight back out instead of showing the login
   *      screen.
   */
  /**
   * Checks if any modal, sheet, or overlay is currently open in the DOM
   * and dismisses it instead of navigating away.
   */
  private dismissTopOverlay(): boolean {
    if (typeof document === 'undefined') return false;

    // 1. Ionic native overlays / modals
    const openModals = Array.from(document.querySelectorAll('ion-modal, ion-alert, ion-action-sheet, ion-popover')) as any[];
    for (let i = openModals.length - 1; i >= 0; i--) {
      const modal = openModals[i];
      // Check if modal is visible / open
      if (modal && (modal.classList.contains('show-modal') || modal.isOpen || modal.getAttribute('aria-hidden') !== 'true')) {
        if (typeof modal.dismiss === 'function') {
          try {
            void modal.dismiss();
            return true;
          } catch {}
        }
      }
    }

    // 2. Custom overlays, coaching panel, and bottom sheets
    const activeOverlay = document.querySelector(
      '.notif-overlay, .equipment-modal-backdrop, .bottom-sheet-modal, .quick-confirm-sheet, app-coaching-panel'
    );
    if (activeOverlay) {
      const closeBtn = activeOverlay.querySelector(
        '.notif-dismiss-btn, .close-modal-btn, .close-btn, .cancel-btn, .modal-close-btn, .btn-close, .action-btn.cancel, .coaching-header-close, .notif-icon-btn'
      ) as HTMLElement | null;
      if (closeBtn) {
        closeBtn.click();
        return true;
      }
    }

    return false;
  }

  /**
   * Hierarchical Android back-button behavior (Messenger-style):
   * 1. If an overlay/modal/edit panel is open -> dismiss it first.
   * 2. If on a root page (dashboard/admin/login) -> double-press-to-exit.
   * 3. If on another tab (schedule/shop/equipment/profile/qr/coaching) -> navigate to /dashboard.
   * 4. For drill-in sub-routes (chat, coach profile, etc.) -> Location.back().
   */
  private registerHardwareBackButton(): void {
    App.addListener('backButton', () => {
      // 1. Dismiss any open modal/sheet/overlay first
      if (this.dismissTopOverlay()) {
        return;
      }

      const currentPath = this.router.url.split('?')[0].split('#')[0];

      // 2. Double-press-to-exit on true root entry points only (Dashboard, Admin, Login)
      if (BACK_BUTTON_ROOT_PATHS.has(currentPath)) {
        void this.handleRootBackPress();
        return;
      }

      // 3. Tab pages: return to dashboard first
      if (TAB_NAVIGATION_PATHS.has(currentPath)) {
        this.zone.run(() => {
          void this.router.navigate(['/dashboard']);
        });
        return;
      }

      // 4. Drill-in sub-routes: standard history back
      this.location.back();
    })
      .then((handle) => {
        this.backButtonListener = handle;
      })
      .catch(() => {
        // Non-fatal: this listener only ever fires on Android via Capacitor.
      });
  }

  /**
   * Double-press-to-exit on root pages. First press within the confirm
   * window shows a toast and arms the timer; a second press before the
   * window elapses actually exits the app via App.exitApp(). A press after
   * the window has elapsed is treated as a fresh "first press" again.
   */
  private async handleRootBackPress(): Promise<void> {
    const now = Date.now();

    if (this.lastRootBackPressAt !== null && now - this.lastRootBackPressAt <= EXIT_CONFIRM_WINDOW_MS) {
      this.lastRootBackPressAt = null;
      void App.exitApp();
      return;
    }

    this.lastRootBackPressAt = now;
    const toast = await this.toastController.create({
      message: 'Press back again to exit',
      duration: EXIT_CONFIRM_WINDOW_MS,
      position: 'bottom',
    });
    await toast.present();
  }
}
