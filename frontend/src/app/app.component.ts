import { Component, OnDestroy } from '@angular/core';
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
// fixes that. A drill-in page reached FROM a tab (chat, coach profile,
// transactions, admin-reports) is deliberately NOT listed here -- those
// still fall through to Location.back() below, which correctly returns to
// whichever tab pushed them.
const BACK_BUTTON_ROOT_PATHS = new Set([
  '/dashboard',
  '/admin',
  '/login',
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
const EXIT_CONFIRM_WINDOW_MS = 2000;

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
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
    private router: Router,
    private location: Location,
    private toastController: ToastController,
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
    void this.registerNotificationTapListener();
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
      await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
        const notificationId = action.notification?.extra?.['notificationId'];
        this.notificationCenter.openFromDeviceNotification(
          notificationId ? String(notificationId) : null
        );
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
  private registerHardwareBackButton(): void {
    App.addListener('backButton', () => {
      const currentPath = this.router.url.split('?')[0].split('#')[0];

      if (BACK_BUTTON_ROOT_PATHS.has(currentPath)) {
        void this.handleRootBackPress();
        return;
      }

      // Plain history navigation for every other route, including a chat
      // thread (/chat/:conversationId) or a coach profile (/coach/:id).
      // Any "reopen the coaching panel on the right tab" instruction was
      // already recorded via CoachingNavService BEFORE that route was
      // ever pushed — see CoachingPanelComponent.navigateAway() — so this
      // handler doesn't need to (and must not) special-case any path or
      // guess a tab itself; it just mirrors what the on-screen back arrow
      // already does via ChatPage.goBack() / CoachDetailPage.goBack().
      this.location.back();
    })
      .then((handle) => {
        this.backButtonListener = handle;
      })
      .catch(() => {
        // Non-fatal: this listener only ever fires on Android via Capacitor.
        // On web/iOS builds (or if native registration itself fails) the app
        // must keep starting up normally rather than crash on this call.
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
