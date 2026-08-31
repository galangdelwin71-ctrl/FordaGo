// equipment.page.ts

import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonFooter,
  IonIcon,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { HeaderComponent } from '../shared/header/header.component';
import { NotificationPanelComponent } from '../shared/notification-panel/notification-panel.component';
import { CoachingPanelComponent } from '../shared/coaching-panel/coaching-panel.component';
import { CoachingNavService, CoachingPanelTab } from '../services/coaching-nav.service';
import { CoachingService } from '../services/coaching.service';
import { PullToRefreshComponent } from '../shared/pull-to-refresh/pull-to-refresh.component';
import { OnboardingService, TourStep } from '../services/onboarding.service';
import { API_URL, resolveImageUrl } from '../config/api.config';
import { getCachedData, setCachedData } from '../utils/local-cache.util';
import { CACHE_KEYS } from '../utils/cache-keys';
import { EquipmentGuideService } from '../services/equipment-guide.service';
import { EquipmentFullGuide, ExerciseVariation } from '../data/equipment-guides.data';
import { getExerciseSvgHtml } from '../data/exercise-svgs.data';

export type EquipmentCategory = 'All' | 'Strength' | 'Cardio' | 'Machines' | 'Free Weights' | string;

export interface EquipmentItem {
  id: number;
  name: string;
  icon?: string;
  category?: EquipmentCategory;
  status?: string;
  image_url?: string;
  // Stage 6 (Loading Speed Plan): small (~300px) rendition for the grid --
  // falls back to image_url in loadEquipment() below when an item has no
  // thumbnail yet (older row not re-saved since the migration).
  thumbnail_url?: string;
  description?: string;
  weight_scale?: string;
}

@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.page.html',
  styleUrls: ['./equipment.page.scss'],
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
    PullToRefreshComponent,
  ],
})
export class EquipmentPage implements OnInit {

  /** Resolves relative /storage/... paths to full backend URL. */
  resolveImg(path: string | null | undefined): string {
    return resolveImageUrl(path);
  }

  handleRefresh(event: any): void {
    try {
      this.loadEquipment();
    } finally {
      setTimeout(() => {
        event?.target?.complete();
      }, 700);
    }
  }

  // ── Search & Filter ──────────────────────────────────
  searchQuery    = '';
  activeCategory: EquipmentCategory = 'All';

  categories: EquipmentCategory[] = ['All', 'Strength', 'Cardio', 'Machines', 'Free Weights'];

  // ── Equipment List ───────────────────────────────────
  equipmentList: EquipmentItem[] = [];
  // Stage 4: fixed-length dummy array purely to repeat the skeleton card
  // markup N times in the template (*ngFor needs something to iterate --
  // the values themselves are never read). 6 matches roughly one
  // above-the-fold screen at the grid's 2-column layout.
  readonly skeletonPlaceholders: ReadonlyArray<number> = [1, 2, 3, 4, 5, 6];

  // ── Modal ─────────────────────────────────────────────
  modalOpen    = false;
  selectedItem: EquipmentItem | null = null;
  isLoading    = false;
  errorMsg     = '';

  private readonly api = API_URL;

  selectedGuide: EquipmentFullGuide | null = null;
  activeVariationIndex = 0;

  get activeVariation(): ExerciseVariation | null {
    if (!this.selectedGuide || !this.selectedGuide.variations?.length) return null;
    return this.selectedGuide.variations[this.activeVariationIndex] || this.selectedGuide.variations[0];
  }

  selectVariation(idx: number): void {
    this.activeVariationIndex = idx;
  }

  logWorkoutFromGuide(): void {
    const equipName = this.selectedGuide?.name || this.selectedItem?.name || 'Workout';
    this.closeModal();
    this.router.navigate(['/profile'], {
      queryParams: { tab: 'records', log: equipName }
    });
  }

  /** Returns sanitized SVG HTML for native vector rendering. */
  getSafeSvg(variation: ExerciseVariation | null): SafeHtml {
    if (!variation) return '';
    const raw = getExerciseSvgHtml(variation.illustrationUrl || variation.id || variation.title);
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  constructor(
    public router: Router,
    private http: HttpClient,
    private auth: AuthService,
    private coachingNav: CoachingNavService,
    private coachingService: CoachingService,
    public onboardingService: OnboardingService,
    public guideService: EquipmentGuideService,
    private sanitizer: DomSanitizer,
  ) {}

  // ── Header avatar ───────────────────────────────────
  initials     = '';
  profileImage = '';
  /** Coach icon badge — kept in sync via CoachingService.unreadCount$. */
  coachUnreadCount = 0;

  // ── Notifications ─────────────────────────────────────
  notifPanelOpen = false;
  unreadCount = 0;

  openNotifPanel(): void {
    this.notifPanelOpen = true;
  }

  closeNotifPanel(): void { this.notifPanelOpen = false; }

  onUnreadCountChange(count: number): void {
    this.unreadCount = count;
  }

  // ── Coaching screen ────────────────────────────────────────
  // In-flow replacement for ion-content (see equipment.page.html) rather
  // than an overlay -- header and footer are untouched siblings either way.
  coachingPanelOpen = false;
  /** Set from CoachingNavService.consumeReopen() when this page is reached via a back-navigation from chat/coach-profile -- see applyPendingCoachingReopen() and coaching-nav.service.ts. Cleared whenever the panel closes so it never silently re-applies to a later, unrelated open. */
  coachingPanelInitialTab: CoachingPanelTab | null = null;

  onCoachingClick(): void {
    const nextOpen = !this.coachingPanelOpen;
    this.coachingPanelOpen = nextOpen;
    if (!nextOpen) {
      this.coachingPanelInitialTab = null;
    }
  }

  closeCoachingPanel(): void {
    this.coachingPanelOpen = false;
    this.coachingPanelInitialTab = null;
  }

  ngOnInit(): void {
    this.applyPendingCoachingReopen();
    this.coachingService.unreadCount$.subscribe((count) => { this.coachUnreadCount = count; });
    void this.loadEquipmentWithHydration();
  }

  // Guards Stage 3 cache hydration so it only ever runs (reads Preferences)
  // ONCE per page instance, and any caller that shows up before it resolves
  // awaits that SAME read instead of racing it -- mirrors InventoryPage's
  // identical productsHydration guard (see its doc-comment for the full
  // race-condition explanation: ionViewWillEnter() can fire on the very
  // first mount too, not just re-entry).
  private equipmentHydration: Promise<void> | null = null;

  /**
   * Stage 3 (local-first loading) entry point. Waits for the one-time cache
   * hydration to finish -- so `equipmentList` is already populated from the
   * last snapshot BEFORE loadEquipment() decides whether to show the
   * spinner -- then runs the normal network load. Safe to call from
   * multiple lifecycle hooks: hydration itself only ever runs once (see
   * equipmentHydration above), and loadEquipment() already guards against
   * overlapping HTTP requests.
   */
  private async loadEquipmentWithHydration(): Promise<void> {
    this.equipmentHydration ??= this.hydrateEquipmentFromCache();
    await this.equipmentHydration;
    this.loadEquipment();
  }

  /**
   * Reads the last cached equipment list (written by loadEquipment() below)
   * and shows it immediately, before the network request even starts.
   * Purely additive -- if there's no cache yet (first-ever launch) or the
   * read fails for any reason, this is a silent no-op and the page falls
   * back to its normal first-load spinner. Never throws -- see
   * getCachedData()'s own doc-comment in utils/local-cache.util.ts.
   */
  private async hydrateEquipmentFromCache(): Promise<void> {
    const cached = await getCachedData<EquipmentItem[]>(CACHE_KEYS.EQUIPMENT);
    if (Array.isArray(cached) && cached.length > 0) {
      this.equipmentList = cached;
      const cats = Array.from(new Set(cached.map(e => e.category).filter(Boolean))) as string[];
      this.categories = ['All', ...cats];
    }
  }

  ionViewWillEnter(): void {
    // Re-applied on every re-entry, not just first mount -- Ionic's
    // router-outlet caches this page instance, so navigating
    // Equipment -> coach profile/chat -> back reuses the SAME
    // EquipmentPage instance and only fires ionViewWillEnter(), never
    // ngOnInit() again. See applyPendingCoachingReopen() /
    // DashboardPage's identical helper.
    this.applyPendingCoachingReopen();

    void this.loadEquipmentWithHydration();
    const user = this.auth.user;
    const name = String(user?.username || '').trim();
    this.initials = name
      ? name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
    this.profileImage = resolveImageUrl((user as any)?.profile_image);
    this.notifPanelOpen = false;
    this.checkAndStartEquipmentTour();
  }

  private checkAndStartEquipmentTour(): void {
    const user = this.auth.user;
    if (!user || user.role === 'admin' || user.role === 'coach') return;

    setTimeout(() => {
      if (this.onboardingService.isRunning || this.coachingPanelOpen) return;

      const steps: TourStep[] = [
        {
          targetId: '#tour-equip-search',
          title: 'Search Machines & Tools',
          description: 'Type any equipment name (e.g. Treadmill, Bench Press, Dumbbells) to find it immediately.',
          icon: 'search-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-equip-categories',
          title: 'Category Filters',
          description: 'Filter gym gear by Strength, Cardio, Machines, or Free Weights.',
          icon: 'barbell-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-equip-grid',
          title: 'Machine Guide & Tutorials',
          description: 'Tap any equipment card to open step-by-step usage instructions, target muscle groups, and form tips.',
          icon: 'information-circle-outline',
          position: 'top',
        },
      ];

      const available = steps.filter((s) => !!document.querySelector(s.targetId));
      if (available.length > 0) {
        this.onboardingService.startTour('equipment_main', available, false, user.id);
      }
    }, 700);
  }

  /**
   * Reopens the coaching panel to the exact tab it was on if we landed
   * back here via ChatPage's/CoachDetailPage's back button (see
   * coaching-nav.service.ts). One-shot -- consumeReopen() clears itself,
   * so a normal visit to Equipment is completely unaffected.
   */
  trackByEquipment(index: number, item: EquipmentItem): number | string {
    return item.id || item.name || index;
  }

  trackByIndex(index: number): number {
    return index;
  }

  private applyPendingCoachingReopen(): void {
    const pendingTab = this.coachingNav.consumeReopen('equipment');
    if (pendingTab) {
      this.coachingPanelInitialTab = pendingTab;
      this.coachingPanelOpen = true;
    }
  }

  loadEquipment() {
    // Guard against overlapping calls -- ngOnInit() AND ionViewWillEnter()
    // both call loadEquipment() (ionViewWillEnter also fires on first
    // mount, not just re-entry -- see its doc-comment above), so without
    // this guard the very first page load fires TWO simultaneous GET
    // /api/equipment requests. Kept as a general safeguard against
    // wasteful duplicate requests -- but this guard was NOT what actually
    // fixed the intermittent "Could not load equipment." error. That bug
    // was GET /api/equipment's Cache::remember() (file driver) caching raw
    // Eloquent objects, which config/cache.php's 'serializable_classes' =>
    // false silently corrupted into unreadable objects on every cache HIT
    // (fine on write, broken on every read after). Fixed at the source in
    // EquipmentController::index() -- see the comment there for the full
    // explanation. InventoryPage hit the identical backend bug through its
    // own Cache::remember() and now carries the same overlapping-call
    // guard here (productsLoading) for consistency.
    if (this.isLoading) { return; }
    const token = this.auth.token;
    if (!token) { this.router.navigate(['/login']); return; }
    // Stage 3 (local-first / stale-while-revalidate): only show the
    // spinner when there's nothing on screen yet. If hydrateEquipmentFromCache()
    // (or a previous successful fetch this session) already populated
    // `equipmentList`, this request runs silently in the background and the
    // member keeps looking at the last-known list the whole time.
    const hasExistingData = this.equipmentList.length > 0;
    this.isLoading = !hasExistingData;
    this.errorMsg  = '';
    this.http.get<EquipmentItem[]>(`${this.api}/equipment`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        // Defensive: only ever assign a real array. A non-array response body
        // (e.g. an auth/error page served with a 200, or a transient
        // malformed/truncated response from a flaky tunnel/dev server) used
        // to get assigned directly here, which crashed every later
        // `.filter()` read in filteredEquipment and took the whole page
        // down instead of just showing an empty/error state. Mirrors the
        // same guard already used by InventoryPage.loadProducts().
        this.isLoading = false;
        if (!Array.isArray(data)) {
          if (!hasExistingData) {
            this.errorMsg = 'Could not load equipment. Please try again.';
            this.equipmentList = [];
          }
          return;
        }
        // Stage 6: fall back to the full image when an item has no
        // thumbnail yet, mirroring InventoryPage.normalizeApiProduct() --
        // never a broken/blank grid card either way.
        this.equipmentList = data.map(item => ({
          ...item,
          thumbnail_url: item.thumbnail_url || item.image_url,
        }));
        // build dynamic categories from data
        const cats = Array.from(new Set(data.map(e => e.category).filter(Boolean))) as string[];
        this.categories = ['All', ...cats];
        // Snapshot for the next cold start / re-entry. Fire-and-forget --
        // a failed write here must never block or fail the page itself,
        // see setCachedData()'s own doc-comment.
        void setCachedData(CACHE_KEYS.EQUIPMENT, this.equipmentList);
      },
      error: () => {
        this.isLoading = false;
        // A background refresh failing while stale (cached) data is still on
        // screen must NOT blank the page or show the error banner -- the
        // member keeps browsing the last-known list, same as InventoryPage's
        // identical stale-while-revalidate handling. Only surface the error
        // state when there was truly nothing to show to begin with.
        if (!hasExistingData) {
          this.errorMsg  = 'Could not load equipment. Please try again.';
          this.equipmentList = [];
        }
      }
    });
  }

  // ── Filtering ─────────────────────────────────────────
  get filteredEquipment(): EquipmentItem[] {
    // Belt-and-suspenders: loadEquipment() already guarantees equipmentList
    // is always an array, but this getter runs on every change-detection
    // pass, so a bad assignment introduced anywhere in the future would
    // otherwise crash the whole page again instead of just showing nothing.
    if (!Array.isArray(this.equipmentList)) {
      return [];
    }
    return this.equipmentList.filter(item => {
      const matchesCategory =
        this.activeCategory === 'All' || item.category === this.activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  setCategory(cat: EquipmentCategory): void {
    this.activeCategory = cat;
  }

  // ── Modal ─────────────────────────────────────────────
  openModal(item: EquipmentItem): void {
    this.selectedItem = item;
    this.selectedGuide = this.guideService.getGuideById(item.id) || this.guideService.getGuideByName(item.name);
    this.activeVariationIndex = 0;
    this.modalOpen    = true;
  }

  closeModal(): void {
    this.modalOpen    = false;
    this.selectedItem = null;
    this.selectedGuide = null;
    this.activeVariationIndex = 0;
  }

  // ── User Info ─────────────────────────────────────────
  get userInitials(): string {
    const u = this.auth.user;
    if (!u) return '';
    const name: string = u.username || u.first_name || u.email || '';
    return name.slice(0, 2).toUpperCase();
  }

  // ── Navigation ────────────────────────────────────────
  private closeOverlaysForNavigation(): void { this.notifPanelOpen = false; this.coachingPanelOpen = false; this.coachingPanelInitialTab = null; }

  // NOTE: replaceUrl: true — see the matching note in dashboard.page.ts.
  // Bottom-nav tab switches must REPLACE the current history entry, not
  // push a new one, or Location.back() (on-screen arrow / hardware back)
  // from a later drill-in page (e.g. chat) walks past several stale tab
  // visits instead of returning to whichever tab was actually active.
  goBack(): void        { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard'], { replaceUrl: true }); }
  goToDashboard(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard'], { replaceUrl: true }); }
  goToSchedule(): void  { this.closeOverlaysForNavigation(); this.router.navigate(['/schedule'], { replaceUrl: true }); }
  goToQr(): void        { this.closeOverlaysForNavigation(); this.router.navigate(['/qr-scanner'], { replaceUrl: true }); }
  goToInventory(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/inventory'], { replaceUrl: true }); }
  goToEquipment(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/equipment'], { replaceUrl: true }); }
  goToProfile(): void   { this.closeOverlaysForNavigation(); this.router.navigate(['/profile'], { replaceUrl: true }); }
}