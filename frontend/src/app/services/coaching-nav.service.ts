import { Injectable } from '@angular/core';

/**
 * Coordinates "reopen the coaching panel" between ChatPage's back button
 * and whichever host page (Dashboard, Schedule, or the Coaching page) the
 * browser/router lands on next.
 *
 * WHY THIS EXISTS: the coaching panel's open/closed state (and which tab
 * it's on) lives as plain component state on each host page, not in the
 * URL. Angular's Router destroys and recreates a page component on every
 * navigation -- including Location.back() -- so that state can never
 * survive a round trip through /chat/:id on its own. This service is the
 * one small piece of shared, in-memory state that bridges that gap:
 * ChatPage.goBack() sets a pending tab right before navigating back, and
 * the host page's ngOnInit consumes it once, then it's gone.
 *
 * Deliberately NOT persisted (no localStorage) -- this only needs to
 * survive the single back-navigation it's set for. Deliberately a
 * one-shot consume() (not a BehaviorSubject) -- a page that opens for any
 * OTHER reason (bottom-nav tap, deep link, pull-to-refresh) must never
 * pick up a stale flag left over from an unrelated chat visit.
 */
@Injectable({ providedIn: 'root' })
export class CoachingNavService {
  private pendingTab: 'conversations' | 'clients' | 'explore' | null = null;

  /** Called by ChatPage.goBack() right before navigating back. */
  requestReopen(tab: 'conversations' | 'clients' | 'explore'): void {
    this.pendingTab = tab;
  }

  /**
   * Called once by a host page's ngOnInit(). Returns the pending tab (if
   * any) and immediately clears it, so it can never be re-applied to a
   * later, unrelated navigation into that same page.
   */
  consumeReopen(): 'conversations' | 'clients' | 'explore' | null {
    const tab = this.pendingTab;
    this.pendingTab = null;
    return tab;
  }
}
