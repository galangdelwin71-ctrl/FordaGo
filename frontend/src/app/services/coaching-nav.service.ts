import { Injectable } from '@angular/core';

/**
 * Every real, selectable tab inside CoachingPanelComponent -- the member
 * side ('explore' | 'conversations' | 'classes') and the coach side
 * ('clients' | 'requests' | 'messages'). Shared here (rather than each
 * consumer redeclaring its own copy of this union) so the panel and every
 * host page it can reopen on can never drift out of sync with each other.
 */
export type CoachingPanelTab = 'explore' | 'conversations' | 'classes' | 'clients' | 'requests' | 'messages';
/**
 * Every page that mounts <app-coaching-panel>. Dashboard, Schedule,
 * Coaching, Profile, Equipment, Inventory, and QR Scanner all actively
 * consume reopen requests (see consumeReopen() below) via each page's own
 * applyPendingCoachingReopen() helper, called from both ngOnInit() (first
 * mount) and ionViewWillEnter() (every re-entry -- Ionic's router-outlet
 * caches previously-visited pages, so ngOnInit() never runs again on a
 * revisit). Listed here so CoachingPanelComponent.navigateAway() tags its
 * reopen request with the CORRECT originating page instead of silently
 * defaulting to 'dashboard' (see hostPage's default on
 * CoachingPanelComponent). Without an accurate tag here, a reopen
 * requested from e.g. Equipment would incorrectly be attributed to
 * Dashboard and could pop the panel open there on a later, unrelated
 * visit -- the exact stale-flag leak this service exists to prevent.
 */
export type CoachingPanelHost = 'dashboard' | 'schedule' | 'coaching' | 'profile' | 'equipment' | 'inventory' | 'qr-scanner';

/**
 * Coordinates "reopen the coaching panel on the tab it was actually on"
 * between CoachingPanelComponent (the moment it navigates away to a full
 * page -- chat, coach profile, schedule) and whichever host page
 * (Dashboard, Schedule, or the Coaching page) the browser/router lands on
 * next when the member/coach navigates back.
 *
 * WHY THIS EXISTS: the coaching panel's open/closed state (and which tab
 * it's on) lives as plain component state on each host page, not in the
 * URL. Angular's Router destroys and recreates a page component on every
 * navigation -- including Location.back() -- so that state can never
 * survive a round trip through /chat/:id or /coach/:id on its own. This
 * service is the one small piece of shared, in-memory state that bridges
 * that gap: CoachingPanelComponent.navigateAway() records the CURRENT tab
 * right before pushing the new route, and the host page's ngOnInit/
 * ionViewWillEnter consumes it once, then it's gone.
 *
 * IMPORTANT: this always records the tab the panel was ACTUALLY showing --
 * never a hardcoded guess -- so a plain back button (on-screen arrow or
 * the Android hardware back button, both of which now just walk browser
 * history) restores the exact screen the member left, the same way a
 * normal web app's back button does. Nothing downstream of a
 * navigateAway() call should override this with its own tab.
 *
 * Deliberately NOT persisted (no localStorage) -- this only needs to
 * survive the single back-navigation it's set for. Deliberately a
 * one-shot consume() (not a BehaviorSubject) -- a page that opens for any
 * OTHER reason (bottom-nav tap, deep link, pull-to-refresh) must never
 * pick up a stale flag left over from an unrelated visit.
 */
@Injectable({ providedIn: 'root' })
export class CoachingNavService {
  private pendingTab: CoachingPanelTab | null = null;
  /**
   * The page that called requestReopen() -- only the matching host page
   * may consume this flag. Prevents Ionic's cached-page lifecycle from
   * letting Dashboard steal a reopen that was set for Schedule (or vice
   * versa) when multiple host pages are alive in the router outlet at once.
   */
  private pendingHost: CoachingPanelHost | null = null;

  /**
   * Called by CoachingPanelComponent.navigateAway() right before pushing
   * a route away from the panel. `host` identifies which page the panel
   * was mounted on so consumeReopen() can enforce page-scoped delivery.
   */
  requestReopen(tab: CoachingPanelTab, host: CoachingPanelHost): void {
    this.pendingTab = tab;
    this.pendingHost = host;
  }

  /**
   * Called once by a host page's ngOnInit()/ionViewWillEnter(). Returns
   * the pending tab only when `caller` matches the page that originally
   * called requestReopen(), then immediately clears both fields so the
   * flag can never leak to a later, unrelated navigation.
   * Returns null -- without clearing -- when called by a different page,
   * leaving the flag intact for the correct page to pick up.
   */
  consumeReopen(caller: CoachingPanelHost): CoachingPanelTab | null {
    if (this.pendingHost !== caller) return null;
    const tab = this.pendingTab;
    this.pendingTab = null;
    this.pendingHost = null;
    return tab;
  }
}
