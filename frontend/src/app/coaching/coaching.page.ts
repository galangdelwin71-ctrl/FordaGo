import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonFooter,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  homeOutline,
  calendarOutline,
  scanOutline,
  bagHandleOutline,
} from 'ionicons/icons';
import { AuthService } from '../services/auth.service';
import { HeaderComponent } from '../shared/header/header.component';
import { NotificationPanelComponent } from '../shared/notification-panel/notification-panel.component';
import { CoachingPanelComponent } from '../shared/coaching-panel/coaching-panel.component';
import { CoachingNavService, CoachingPanelTab } from '../services/coaching-nav.service';

@Component({
  selector: 'app-coaching',
  templateUrl: './coaching.page.html',
  styleUrls: ['./coaching.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonFooter,
    IonIcon,
    HeaderComponent,
    NotificationPanelComponent,
    CoachingPanelComponent,
  ],
})
export class CoachingPage implements OnInit {
  // Notification panel state
  notifPanelOpen = false;
  unreadNotifCount = 0;

  /**
   * Coaching panel state. Also forced open on init for coach accounts --
   * see ngOnInit() -- since they have no separate landing screen to fall
   * back to when closed.
   */
  coachingPanelOpen = false;
  /** Set from CoachingNavService.consumeReopen() in ngOnInit() when this page is reached via a back-navigation from chat/coach-profile -- see coaching-nav.service.ts. Cleared whenever the panel closes (closeCoachingPanel()) so it never silently re-applies to a later, unrelated open. */
  coachingPanelInitialTab: CoachingPanelTab | null = null;

  constructor(
    private router: Router,
    private auth: AuthService,
    private coachingNav: CoachingNavService,
  ) {
    addIcons({
      personOutline,
      homeOutline,
      calendarOutline,
      scanOutline,
      bagHandleOutline,
    });
  }

  ngOnInit() {
    // Reopen straight to Messages if we landed here via ChatPage's back
    // button (see coaching-nav.service.ts) -- checked first since it's a
    // more specific instruction than the coach-account default below, and
    // both branches just result in the panel opening either way.
    this.applyPendingCoachingReopen();
    if (this.coachingPanelOpen) {
      return;
    }

    // A coach account has no member-facing "Browse Coaches" landing here --
    // the coaching panel (rendered as app-coach-dashboard content, see
    // CoachingPanelComponent) IS this account's coaching management
    // screen, so skip straight to it instead of showing the member-only
    // "Ready to Level Up? / Browse Coaches" card, which never applied to a
    // coach in the first place.
    if (this.auth.isCoachAccount()) {
      this.coachingPanelOpen = true;
    }
  }

  /**
   * Re-applies a pending coaching-panel reopen on every re-entry into this
   * page, not just its first creation. Ionic's router-outlet caches
   * previously-visited pages, so navigating Coaching -> Chat -> back
   * reuses the SAME CoachingPage instance instead of destroying/
   * recreating it -- ngOnInit() never runs again on that path, only
   * ionViewWillEnter() does. Without this hook, requestReopen('conversations')
   * set by ChatPage.goBack() (see coaching-nav.service.ts) was silently
   * dropped and the panel never reopened, stranding the member on a blank
   * Coaching page instead of back in Personal Coaches/Messages.
   */
  ionViewWillEnter(): void {
    this.applyPendingCoachingReopen();
  }

  /** One-shot: consumeReopen() clears itself, so a normal visit/re-entry to this page is completely unaffected. */
  private applyPendingCoachingReopen(): void {
    const pendingTab = this.coachingNav.consumeReopen('coaching');
    if (pendingTab) {
      this.coachingPanelInitialTab = pendingTab;
      this.coachingPanelOpen = true;
    }
  }

  get profileImage() {
    return this.auth.user?.profile_image || '';
  }

  get initials(): string {
    const u = this.auth.user;
    if (!u) return 'U';
    const f = (u.first_name || u.username || '').charAt(0);
    const l = (u.last_name || '').charAt(0);
    return (f + l).toUpperCase() || 'U';
  }

  // ── Coaching Panel ────────────────────────────────────
  // Routes through open/closeCoachingPanel() rather than flipping
  // coachingPanelOpen directly -- closeCoachingPanel() also resets
  // coachingPanelInitialTab, so a header-icon close after a deep-linked
  // Messages open (see ngOnInit()) doesn't leave a stale override that
  // silently reopens on Messages next time.
  onCoachingClick() {
    if (this.coachingPanelOpen) {
      this.closeCoachingPanel();
    } else {
      this.openCoachingPanel();
    }
  }

  openCoachingPanel() {
    this.coachingPanelOpen = true;
  }

  closeCoachingPanel() {
    // A coach account has no landing screen to close BACK to (see
    // ngOnInit()) -- closing here would otherwise strand the coach on a
    // blank/member-only view with no way back into their own dashboard
    // except the header icon, so immediately reopen instead of closing.
    if (this.auth.isCoachAccount()) {
      this.coachingPanelInitialTab = null;
      return;
    }
    this.coachingPanelOpen = false;
    this.coachingPanelInitialTab = null;
  }

  /**
   * Bound to CoachingPanelComponent's (navigated) output -- fired right
   * before the panel sends the user to a full page (chat, coach profile,
   * schedule, settings). Unlike closeCoachingPanel(), this always
   * unmounts the panel, including for a coach account: the destination
   * route IS the next screen, so there's no "blank page" to strand the
   * coach on, and leaving the panel mounted here was what corrupted the
   * page transition on the way back from a chat (see the `navigated`
   * doc-comment on CoachingPanelComponent for the full freeze writeup).
   */
  onCoachingPanelNavigated() {
    this.coachingPanelOpen = false;
    this.coachingPanelInitialTab = null;
  }

  // ── Navigation ───────────────────────────────────────
  // Every bottom-nav / header destination unmounts the coaching panel
  // FIRST via onCoachingPanelNavigated() (same unconditional unmount used
  // for in-panel links -- see that method's doc-comment). Without this, a
  // coach tapping Home/Schedule/Shop/Profile while inside the dashboard
  // left app-coaching-panel mounted underneath the new route: its HTTP
  // subscriptions, ion-modals, and document:click listener kept running
  // against a page the coach could no longer see, which intermittently ate
  // touch input on the destination page and made later taps look like they
  // "went back" or closed instead of navigating. Mirrors
  // closeOverlaysForNavigation() in dashboard.page.ts, which never had this gap.
  // NOTE: replaceUrl: true — see the matching note in dashboard.page.ts.
  // Bottom-nav tab switches must REPLACE the current history entry, not
  // push a new one, or Location.back() (on-screen arrow / hardware back)
  // from a later drill-in page (e.g. chat) walks past several stale tab
  // visits instead of returning to whichever tab was actually active.
  goToDashboard() { this.onCoachingPanelNavigated(); this.router.navigate(['/dashboard'], { replaceUrl: true }); }
  goToSchedule() { this.onCoachingPanelNavigated(); this.router.navigate(['/schedule'], { replaceUrl: true }); }
  goToQr() { this.onCoachingPanelNavigated(); this.router.navigate(['/qr-scanner'], { replaceUrl: true }); }
  goToInventory() { this.onCoachingPanelNavigated(); this.router.navigate(['/inventory'], { replaceUrl: true }); }
  goToProfile() { this.onCoachingPanelNavigated(); this.router.navigate(['/profile'], { replaceUrl: true }); }
  goToEquipment() { this.onCoachingPanelNavigated(); this.router.navigate(['/equipment'], { replaceUrl: true }); }

  // ── Notification Panel ────────────────────────────────
  openNotifPanel() { this.notifPanelOpen = true; }
  closeNotifPanel() { this.notifPanelOpen = false; }
  onUnreadCountChange(count: number) { this.unreadNotifCount = count; }
}
