// qr-scanner.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { getExerciseSvgHtml } from '../data/exercise-svgs.data';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonModal,
  IonSpinner,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { EchoService } from '../services/echo.service';
import { Html5Qrcode } from 'html5-qrcode';
import { HeaderComponent } from '../shared/header/header.component';
import { CoachingPanelComponent } from '../shared/coaching-panel/coaching-panel.component';
import { CoachingNavService, CoachingPanelTab } from '../services/coaching-nav.service';
import { CoachingService } from '../services/coaching.service';
import { PullToRefreshComponent } from '../shared/pull-to-refresh/pull-to-refresh.component';
import { OnboardingService, TourStep } from '../services/onboarding.service';
import { API_URL, resolveImageUrl } from '../config/api.config';
import { ToastService } from '../services/toast.service';
import { EquipmentGuideService } from '../services/equipment-guide.service';
import { EquipmentFullGuide, ExerciseVariation } from '../data/equipment-guides.data';

// ── Interfaces ────────────────────────────────────────────

export type ScanMode   = 'attendance' | 'equipment';
export type ScanFilter = 'all' | 'attendance' | 'equipment';
export type CameraPermissionState = 'unknown' | 'granted' | 'denied' | 'unsupported';

export interface ScanLogEntry {
  type:  ScanMode;
  label: string;
  time:  string;
  date:  string;
}

export interface EquipmentTutorial {
  id:       string;
  name:     string;
  category: string;
  muscles:  string[];
  warning:  string;
  steps:    string[];
}

// ── Component ─────────────────────────────────────────────

@Component({
  selector: 'app-qr-scanner',
  templateUrl: './qr-scanner.page.html',
  styleUrls: ['./qr-scanner.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    IonContent,
    IonFooter,
    IonIcon,
    IonModal,
    IonSpinner,
    HeaderComponent,
    CoachingPanelComponent,
    PullToRefreshComponent,
  ],
})
export class QrScannerPage implements OnInit, OnDestroy {

  handleRefresh(event: any): void {
    try {
      this.loadMyAttendanceLogs();
    } finally {
      setTimeout(() => {
        event?.target?.complete();
      }, 700);
    }
  }

  private readonly api = API_URL;
  private readonly scannerRegionId = 'fordago-qr-reader';

  // ── Equipment Library ─────────────────────────────────
  readonly equipmentLibrary: EquipmentTutorial[] = [
    {
      id: 'cable',
      name: 'Cable Machine',
      category: 'Strength · Gym Floor B',
      muscles: ['Chest', 'Back', 'Shoulders', 'Arms'],
      warning: 'Always warm up before use. Ask a coach if unsure about the form.',
      steps: [
        'Adjust the pulley height to match your target exercise.',
        'Select the appropriate weight using the pin on the stack.',
        'Attach the correct handle — D-ring for single arm, bar for bilateral.',
        'Stand in a stable athletic stance with feet shoulder-width apart.',
        'Keep your core braced and move only the intended joint through the full range.',
        'Control the return — do not let the weight stack slam down.',
      ],
    },
    {
      id: 'bench',
      name: 'Flat Bench Press',
      category: 'Strength · Weights Area',
      muscles: ['Chest', 'Triceps', 'Front Deltoids'],
      warning: 'Never bench press alone without a spotter. Use collars on all barbell work.',
      steps: [
        'Set the bar at a height you can unrack with arms almost fully extended.',
        'Lie flat — eyes under the bar, feet flat on the floor.',
        'Grip slightly wider than shoulder-width with wrists straight.',
        'Unrack by locking out, then lower the bar to mid-chest.',
        'Press up in a slight arc back toward the rack.',
        'Re-rack safely before releasing your grip.',
      ],
    },
    {
      id: 'treadmill',
      name: 'Treadmill',
      category: 'Cardio · Cardio Area',
      muscles: ['Quads', 'Hamstrings', 'Calves', 'Core'],
      warning: 'Step onto the side rails before starting. Never jump on a moving belt.',
      steps: [
        'Step onto the side rails and press the power button.',
        'Select Quick Start or a preset program on the display.',
        'Start at a slow walk (3–4 km/h) for a 2-minute warm-up.',
        'Gradually increase speed to your target pace.',
        'Keep a natural arm swing and avoid holding the rails unnecessarily.',
        'Cool down at a slow walk for 2 minutes before pressing Stop.',
      ],
    },
    {
      id: 'squat',
      name: 'Squat Rack',
      category: 'Strength · Weights Area',
      muscles: ['Quads', 'Glutes', 'Hamstrings', 'Core'],
      warning: 'Always use safety bars. Load plates evenly on both sides.',
      steps: [
        'Set safety bars just below the depth you plan to squat.',
        'Position the bar across your upper traps (high bar) or rear delts (low bar).',
        'Step back with feet shoulder-width apart, toes slightly out.',
        'Brace your core and take a big breath before each rep.',
        'Descend until thighs are at least parallel to the floor.',
        'Drive through your heels to stand; re-rack with hips forward.',
      ],
    },
    {
      id: 'rowing',
      name: 'Rowing Machine',
      category: 'Cardio · Cardio Area',
      muscles: ['Back', 'Arms', 'Core', 'Legs'],
      warning: 'Do not hunch your back. Stop immediately if you feel lower back pain.',
      steps: [
        'Strap your feet in firmly at the footrest.',
        'Sit tall with a straight back; grab the handle overhand.',
        'Start the drive by pushing with your legs first.',
        'Lean back slightly (about 10°) as your legs straighten.',
        'Pull the handle to your lower ribs with elbows going past your sides.',
        'Reverse the sequence smoothly — arms, then lean, then legs — to return.',
      ],
    },
  ];

  // ── State ─────────────────────────────────────────────
  scanMode:      ScanMode   = 'attendance';
  currentFilter: ScanFilter = 'all';
  isScanning                = false;
  isProcessingScan          = false;
  scanStatusMessage         = 'Use your camera to scan the official gym QR code.';
  cameraPermissionState: CameraPermissionState = 'unknown';

  myLogs: ScanLogEntry[] = [];

  // Attendance modals
  attendanceModalOpen  = false;
  pendingModalOpen     = false;
  scannedTime          = '';
  checkInMessage       = '';

  // Live daily pass payment waiting state
  pendingAttendanceId: number | null = null;
  isPendingPaymentConfirmed = false;
  isVerifyingPayment = false;
  private pendingCheckTimer: ReturnType<typeof setInterval> | null = null;

  // Equipment tutorial modal
  tutorialModalOpen  = false;
  activeEquipment:   EquipmentTutorial | null = null;
  activeFullGuide:   EquipmentFullGuide | null = null;
  activeVariationIndex = 0;
  isVideoPlaying = false;

  get activeVariation(): ExerciseVariation | null {
    if (!this.activeFullGuide || !this.activeFullGuide.variations?.length) return null;
    return this.activeFullGuide.variations[this.activeVariationIndex] || this.activeFullGuide.variations[0];
  }

  selectVariation(index: number): void {
    this.activeVariationIndex = index;
    this.isVideoPlaying = false;
  }

  toggleVideoPlayer(): void {
    this.isVideoPlaying = !this.isVideoPlaying;
  }

  getYoutubeEmbedUrl(videoIdOrUrl: string | undefined | null): SafeResourceUrl {
    if (!videoIdOrUrl) return this.sanitizer.bypassSecurityTrustResourceUrl('');
    let videoId = videoIdOrUrl;
    if (videoIdOrUrl.includes('v=')) {
      videoId = videoIdOrUrl.split('v=')[1].split('&')[0];
    } else if (videoIdOrUrl.includes('youtu.be/')) {
      videoId = videoIdOrUrl.split('youtu.be/')[1].split('?')[0];
    } else if (videoIdOrUrl.includes('embed/')) {
      videoId = videoIdOrUrl.split('embed/')[1].split('?')[0];
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`);
  }

  /** Resolves relative /storage/... paths to full backend URL. */
  resolveImg(path: string | null | undefined): string {
    return resolveImageUrl(path);
  }

  /** Returns sanitized SVG HTML for native vector rendering. */
  getSafeSvg(variation: ExerciseVariation | null): SafeHtml {
    if (!variation) return '';
    const raw = getExerciseSvgHtml(variation.illustrationUrl || variation.id || variation.title);
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  }

  private html5QrCode: Html5Qrcode | null = null;

  // ── Computed ──────────────────────────────────────────
  get filteredLogs(): ScanLogEntry[] {
    if (this.currentFilter === 'all') return this.myLogs;
    return this.myLogs.filter(l => l.type === this.currentFilter);
  }

  get userMembershipType(): string {
    return (this.auth.user as any)?.membership_type || 'premium';
  }

  get currentUserName(): string {
    return this.auth.user?.username || 'Member';
  }

  get anyModalOpen(): boolean {
    return this.attendanceModalOpen || this.pendingModalOpen || this.tutorialModalOpen;
  }

  // ── Lifecycle ─────────────────────────────────────────
  constructor(
    private router: Router,
    private http: HttpClient,
    public auth: AuthService,
    private echoService: EchoService,
    private coachingNav: CoachingNavService,
    private coachingService: CoachingService,
    private toast: ToastService,
    public onboardingService: OnboardingService,
    public guideService: EquipmentGuideService,
    private sanitizer: DomSanitizer,
  ) {}

  // ── Header avatar ─────────────────────────────────────
  initials     = '';
  profileImage = '';
  coachUnreadCount = 0;

  // ── Notifications ─────────────────────────────────────
  notifications: Array<{ title: string; message: string; unread: boolean; createdAt?: string }> = [];
  notifPanelOpen = false;
  notifDetailOpen = false;
  selectedNotification: { title: string; message: string; unread: boolean; createdAt?: string } | null = null;

  get unreadCount(): number { return this.notifications.filter(n => n.unread).length; }

  openNotifPanel(): void {
    this.notifDetailOpen = false;
    this.selectedNotification = null;
    this.notifPanelOpen = true;
    if (!this.auth.token) return;
    this.http.get<any[]>(`${this.api}/notifications`, {
      headers: { Authorization: `Bearer ${this.auth.token}` }
    }).subscribe({
      next: (data) => {
        this.notifications = data.map(n => ({ title: n.title || 'Notice', message: n.message, unread: !n.is_read, createdAt: n.created_at }));
      },
      error: () => {}
    });
  }

  closeNotifPanel(): void { this.notifPanelOpen = false; }

  markAllRead(): void { this.notifications = this.notifications.map(n => ({ ...n, unread: false })); }

  openNotification(n: { title: string; message: string; unread: boolean; createdAt?: string }): void {
    this.notifPanelOpen = false;
    this.selectedNotification = n;
    this.notifDetailOpen = true;
    if (n.unread) {
      this.notifications = this.notifications.map(item => item === n ? { ...item, unread: false } : item);
    }
  }

  closeNotificationDetail(): void { this.notifDetailOpen = false; this.selectedNotification = null; }
  backToNotifList(): void { this.notifDetailOpen = false; this.notifPanelOpen = true; }
  closeAllNotifications(): void { this.notifPanelOpen = false; this.notifDetailOpen = false; this.selectedNotification = null; }

  ngOnInit(): void {
    this.applyPendingCoachingReopen();
    this.coachingService.unreadCount$.subscribe((count) => { this.coachUnreadCount = count; });
    this.loadMyAttendanceLogs();
    const user = this.auth.user;
    const name = String(user?.username || '').trim();
    this.initials = name
      ? name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
    this.profileImage = resolveImageUrl((user as any)?.profile_image);
    void this.checkCameraPermission();
  }

  /**
   * Re-applies a pending coaching-panel reopen on every re-entry into this
   * page, not just first mount -- Ionic's router-outlet caches this page
   * instance, so navigating Scan -> coach profile/chat -> back reuses the
   * SAME QrScannerPage instance and only fires ionViewWillEnter(), never
   * ngOnInit() again (see the ionViewWillEnter() hook below). Without this,
   * the router correctly returned the member to Scan, but the coaching
   * panel itself never reopened -- see coaching-nav.service.ts's
   * CoachingPanelHost doc-comment for the full history of this gap.
   */
  private applyPendingCoachingReopen(): void {
    const pendingTab = this.coachingNav.consumeReopen('qr-scanner');
    if (pendingTab) {
      this.coachingPanelInitialTab = pendingTab;
      this.coachingPanelOpen = true;
    }
  }

  ionViewWillEnter(): void {
    this.applyPendingCoachingReopen();
    this.checkAndStartQrTour();
  }

  private checkAndStartQrTour(): void {
    const user = this.auth.user;
    if (!user || user.role === 'admin' || user.role === 'coach') return;

    setTimeout(() => {
      if (this.onboardingService.isRunning || this.coachingPanelOpen) return;

      const steps: TourStep[] = [
        {
          targetId: '#tour-scanner-modes',
          title: 'Scan Mode Selection',
          description: 'Toggle between Attendance (checking into the gym) and Equipment (scanning machine QR codes for tutorials).',
          icon: 'scan-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-scanner-frame',
          title: 'Camera Viewfinder',
          description: 'Point your camera directly at the gym entrance QR code or machine label to automatically scan.',
          icon: 'camera-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-scanner-action',
          title: 'Start Scanner',
          description: 'Tap to activate the live camera scanner whenever you are ready.',
          icon: 'play-outline',
          position: 'top',
        },
        {
          targetId: '#tour-scanner-history',
          title: 'My Scan Attendance Log',
          description: 'Review all your verified Time In and Time Out timestamps and attendance logs.',
          icon: 'time-outline',
          position: 'top',
        },
      ];

      const available = steps.filter((s) => !!document.querySelector(s.targetId));
      if (available.length > 0) {
        this.onboardingService.startTour('scanner_main', available, false, user.id);
      }
    }, 600);
  }

  // ── Camera permission ──────────────────────────────────
  /**
   * Pre-checks the current camera permission state via the Permissions API
   * (supported on Chromium-based WebViews, which Capacitor Android uses).
   * This lets the UI warn the user up front when the permission was
   * previously denied — in that state Android/Chrome will NOT re-show the
   * native prompt on a plain getUserMedia() call, so a silent retry would
   * otherwise look like nothing happened at all.
   */
  private async checkCameraPermission(): Promise<void> {
    if (!navigator?.mediaDevices?.getUserMedia) {
      this.cameraPermissionState = 'unsupported';
      return;
    }

    if (!navigator.permissions?.query) {
      // Permissions API not available on this WebView — we simply won't know
      // the state until the user taps "Start Camera Scan" and we see how
      // getUserMedia() responds.
      this.cameraPermissionState = 'unknown';
      return;
    }

    try {
      const status = await navigator.permissions.query({ name: 'camera' as PermissionName });
      this.cameraPermissionState = status.state === 'granted'
        ? 'granted'
        : status.state === 'denied'
          ? 'denied'
          : 'unknown';

      status.onchange = () => {
        this.cameraPermissionState = status.state === 'granted'
          ? 'granted'
          : status.state === 'denied'
            ? 'denied'
            : 'unknown';
      };
    } catch {
      // Some WebViews implement navigator.permissions but reject querying
      // 'camera' specifically — fall back to "unknown" so we still let the
      // user attempt a scan instead of blocking them outright.
      this.cameraPermissionState = 'unknown';
    }
  }

  ionViewWillLeave(): void {
    // Ionic caches this page — when the user navigates away the DOM element
    // that html5Qrcode holds is destroyed, so we MUST stop & null the
    // instance here. On re-entry, startScan() will create a fresh one.
    void this.stopCameraScan();
    this.isScanning = false;
    this.isProcessingScan = false;
  }

  ngOnDestroy(): void {
    void this.stopCameraScan();
    this.stopPendingAttendanceWatcher();
  }

  // ── Local Storage Persistence for Scan Logs ──────────
  private getLocalLogsKey(): string {
    const userId = this.auth.user?.id || 'guest';
    return `fordago_scan_logs_${userId}`;
  }

  private getLocalEquipmentLogs(): ScanLogEntry[] {
    try {
      const raw = localStorage.getItem(this.getLocalLogsKey());
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignore JSON parse errors
    }
    return [];
  }

  private persistEquipmentLog(entry: ScanLogEntry): void {
    try {
      const logs = this.getLocalEquipmentLogs();
      const updated = [entry, ...logs.filter(l => !(l.label === entry.label && l.time === entry.time && l.date === entry.date))].slice(0, 50);
      localStorage.setItem(this.getLocalLogsKey(), JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  }

  // ── Load attendance history & combine with equipment logs ────
  loadMyAttendanceLogs(): void {
    const localEquipLogs = this.getLocalEquipmentLogs();

    if (!this.auth.token) {
      this.myLogs = localEquipLogs;
      return;
    }

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.get<any[]>(`${this.api}/attendance/my`, { headers }).subscribe({
      next: (records) => {
        const attendanceLogs: ScanLogEntry[] = records.map(r => {
          const dt = new Date(r.check_in_time);
          return {
            type: 'attendance' as ScanMode,
            label: `Gym Check-in (${r.payment_status === 'pending' ? 'Pending' : 'Confirmed'})`,
            time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: this.formatLogDate(dt),
          };
        });

        // Merge backend attendance logs with persisted local equipment scan logs
        this.myLogs = [...localEquipLogs, ...attendanceLogs];
      },
      error: () => {
        this.myLogs = localEquipLogs;
      }
    });
  }

  // Always show the actual calendar date (e.g. "Aug 9, 2026") instead of a
  // relative "Today" label, so the log stays accurate no matter when it's viewed.
  private formatLogDate(date: Date): string {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ── Mode & Filter ─────────────────────────────────────
  setMode(mode: ScanMode): void {
    this.scanMode = mode;
    this.scanStatusMessage = mode === 'attendance'
      ? 'Use your camera to scan the official gym attendance QR code.'
      : 'Use your camera to scan an equipment QR code to open its guide.';
  }

  setFilter(filter: ScanFilter): void {
    this.currentFilter = filter;
  }

  // ── Scan ──────────────────────────────────────────────
  async startScan(): Promise<void> {
    if (this.isScanning) return;

    if (!navigator?.mediaDevices?.getUserMedia) {
      this.scanStatusMessage = 'Camera scanning is not supported on this device. Use demo scan instead.';
      return;
    }

    this.isScanning = true;
    this.isProcessingScan = false;
    this.scanStatusMessage = 'Starting camera...';

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras.length) {
        throw new Error('No camera detected on this device.');
      }

      const preferredCamera = cameras.find(camera => /back|rear|environment/i.test(camera.label)) || cameras[0];

      // Always create a fresh instance — the Ionic router caches this page
      // and the previous html5QrCode instance may still hold a reference to
      // a DOM element that was torn down when the user navigated away, which
      // causes a hard crash/freeze on re-entry. Null-coalescing (??=) would
      // silently reuse the stale instance, so we always new it up here.
      if (this.html5QrCode) {
        try { await this.html5QrCode.stop(); } catch { /* ignore */ }
        try { await this.html5QrCode.clear(); } catch { /* ignore */ }
        this.html5QrCode = null;
      }
      this.html5QrCode = new Html5Qrcode(this.scannerRegionId);

      await this.html5QrCode.start(
        preferredCamera.id,
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1,
        },
        (decodedText) => {
          void this.handleDecodedQr(decodedText);
        },
        () => {}
      );

      this.scanStatusMessage = this.scanMode === 'attendance'
        ? 'Camera is live. Scan the admin attendance QR now.'
        : 'Camera is live. Scan an equipment QR now.';
      this.cameraPermissionState = 'granted';
    } catch (error) {
      this.isScanning = false;
      this.scanStatusMessage = this.describeCameraError(error);
      await this.stopCameraScan();
    }
  }

  /**
   * Maps getUserMedia()/Html5Qrcode failures to a message that actually
   * tells the user what to do next, instead of a raw browser error string.
   * NotAllowedError specifically means the permission prompt will NOT
   * reappear on its own — the user must re-enable it from device Settings.
   */
  private describeCameraError(error: unknown): string {
    const name = error instanceof DOMException ? error.name : '';

    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      this.cameraPermissionState = 'denied';
      return 'Camera access is blocked for FordaGO. Open Settings \u2192 Apps \u2192 FordaGO \u2192 Permissions and enable Camera, then come back and try again.';
    }

    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return 'No camera was detected on this device.';
    }

    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return 'The camera is currently in use by another app. Close it and try again.';
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return 'Unable to access the camera for QR scanning.';
  }

  /**
   * Cancels an in-progress camera scan. Exposed so the scan button can act
   * as a Start/Stop toggle instead of the previous "disabled while
   * scanning" state, which gave the user no way to back out once the
   * camera was live.
   */
  async stopScan(): Promise<void> {
    if (!this.isScanning) return;

    await this.stopCameraScan();
    this.isScanning = false;
    this.isProcessingScan = false;
    this.scanStatusMessage = this.scanMode === 'attendance'
      ? 'Use your camera to scan the official gym attendance QR code.'
      : 'Use your camera to scan an equipment QR code to open its guide.';
  }

  private async handleDecodedQr(decodedText: string): Promise<void> {
    if (this.isProcessingScan) return;
    this.isProcessingScan = true;

    await this.stopCameraScan();

    const raw = String(decodedText || '').trim();
    const isExplicitEquipment = raw.toLowerCase().startsWith('equipment:');
    const normalizedCode = raw.toLowerCase().replace(/^equipment:/, '').trim();

    // 1. Check if the scanned QR matches an equipment guide
    const guide = this.guideService.getGuideById(normalizedCode) || this.guideService.getGuideByName(normalizedCode);
    
    if (guide || isExplicitEquipment) {
      if (guide) {
        const now = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newLogEntry: ScanLogEntry = { type: 'equipment', label: guide.name, time, date: this.formatLogDate(now) };
        
        this.myLogs = [newLogEntry, ...this.myLogs];
        this.persistEquipmentLog(newLogEntry);
        this.saveEquipmentScanLog({ id: String(guide.equipmentId), name: guide.name }, decodedText);

        this.activeFullGuide = guide;
        this.activeVariationIndex = 0;
        this.activeEquipment = {
          id: String(guide.equipmentId),
          name: guide.name,
          category: guide.category,
          muscles: guide.muscles || [],
          warning: guide.warning || '',
          steps: guide.variations[0]?.steps || []
        };
        this.tutorialModalOpen = true;
        this.isScanning = false;
        this.isProcessingScan = false;
        this.scanStatusMessage = `Equipment guide opened for ${guide.name}.`;
        return;
      }
    }

    // 2. If it's an attendance scan or not recognized as equipment
    if (this.scanMode === 'attendance' || raw.toLowerCase().startsWith('attendance:') || raw.toLowerCase().startsWith('gym:')) {
      await this.doCheckIn(decodedText);
      return;
    }

    // 3. Fallback to basic equipment library
    const equipment = this.equipmentLibrary.find(item =>
      item.id === normalizedCode || item.name.toLowerCase() === normalizedCode
    );

    if (!equipment) {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const fallbackName = `Equipment (${normalizedCode || 'Unknown'})`;
      const newLogEntry: ScanLogEntry = { type: 'equipment', label: fallbackName, time, date: this.formatLogDate(now) };
      
      this.myLogs = [newLogEntry, ...this.myLogs];
      this.persistEquipmentLog(newLogEntry);
      this.saveEquipmentScanLog({ id: normalizedCode || 'unknown', name: fallbackName }, decodedText);
      
      this.isProcessingScan = false;
      this.isScanning = false;
      this.scanStatusMessage = 'QR detected. Usage was recorded, but no tutorial is mapped yet for this equipment.';
      this.toast.info('Equipment usage recorded, but no tutorial is linked to this QR yet.');
      return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLogEntry: ScanLogEntry = { type: 'equipment', label: equipment.name, time, date: this.formatLogDate(now) };
    
    this.myLogs = [newLogEntry, ...this.myLogs];
    this.persistEquipmentLog(newLogEntry);
    this.saveEquipmentScanLog(equipment, decodedText);
    
    this.activeEquipment = equipment;
    this.activeFullGuide = this.guideService.getGuideByName(equipment.name);
    this.activeVariationIndex = 0;
    this.tutorialModalOpen = true;
    this.isScanning = false;
    this.isProcessingScan = false;
    this.scanStatusMessage = `Equipment guide opened for ${equipment.name}.`;
  }

  private saveEquipmentScanLog(equipment: { id: string; name: string }, rawQr: string): void {
    if (!this.auth.token) return;

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.post(
      `${this.api}/equipment/scan`,
      {
        equipment_code: equipment.id,
        equipment_name: equipment.name,
        raw_qr: rawQr,
      },
      { headers }
    ).subscribe({
      error: () => {
        // Keep the local scan UX even if backend logging fails.
      }
    });
  }

  async stopCameraScan(): Promise<void> {
    if (!this.html5QrCode) {
      return;
    }

    try {
      await this.html5QrCode.stop();
    } catch {
      // Ignore stop errors when the scanner is not running.
    }

    try {
      await this.html5QrCode.clear();
    } catch {
      // Ignore clear errors from partially initialized scanner instances.
    }

    // Null the reference so the next startScan() always creates a clean
    // instance bound to the current (live) DOM element.
    this.html5QrCode = null;
  }

  // ── Real check-in API call ────────────────────────────
  private async doCheckIn(qrPayload: string): Promise<void> {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.post<any>(
      `${this.api}/attendance/checkin`,
      { qr_code: qrPayload },
      { headers }
    ).subscribe({
      next: (res) => {
        const now  = new Date();
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.scannedTime = time;
        this.isScanning = false;
        this.isProcessingScan = false;
        this.scanStatusMessage = 'Scan complete. You can scan again anytime.';

        if (res.payment_status === 'pending') {
          this.pendingAttendanceId = res.attendance_id || null;
          this.isPendingPaymentConfirmed = false;
          this.checkInMessage = res.message || 'Please proceed to the cashier counter to pay your ₱100 Daily Pass fee.';
          this.pendingModalOpen = true;

          this.myLogs = [
            {
              type: 'attendance',
              label: 'Gym Check-in (Pending Payment)',
              time,
              date: this.formatLogDate(now),
            },
            ...this.myLogs,
          ];

          this.startPendingAttendanceWatcher(res.attendance_id);
        } else {
          this.checkInMessage = res.message || 'You\'re checked in! Welcome to FordaGO 💪';
          this.attendanceModalOpen = true;

          this.myLogs = [
            {
              type: 'attendance',
              label: 'Gym Check-in (Confirmed)',
              time,
              date: this.formatLogDate(now),
            },
            ...this.myLogs,
          ];
        }
      },
      error: (err) => {
        this.isScanning = false;
        this.isProcessingScan = false;
        this.scanStatusMessage = 'Scan failed. Check the QR code and try again.';
        const msg = err.error?.message || 'Check-in failed. Please try again.';
        this.toast.error(msg);
      }
    });
  }

  startPendingAttendanceWatcher(attendanceId?: number): void {
    this.stopPendingAttendanceWatcher();
    this.isPendingPaymentConfirmed = false;
    if (attendanceId) this.pendingAttendanceId = attendanceId;

    // 1. High-frequency live polling every 1.5 seconds for instant update
    this.pendingCheckTimer = setInterval(() => {
      this.checkMyLatestAttendanceStatus(false);
    }, 1500);

    // 2. Real-time WebSocket event listener on private-user channel
    const userId = this.auth.user?.id;
    if (userId) {
      const channel = this.echoService.privateChannel(`user.${userId}`);
      if (channel) {
        channel.listen('.notification.sent', (data: any) => {
          const title = String(data?.notification?.title || '');
          const msg   = String(data?.notification?.message || '');
          if (title.includes('Check-in Confirmed') || msg.includes('daily pass payment') || msg.includes('attendance has been recorded')) {
            this.handlePaymentConfirmed();
          }
        });
      }
    }
  }

  checkMyLatestAttendanceStatus(manualClick = false): void {
    if (!this.auth.token || this.isPendingPaymentConfirmed) return;
    if (manualClick) this.isVerifyingPayment = true;

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.get<any[]>(`${this.api}/attendance/my`, { headers }).subscribe({
      next: (rows) => {
        if (manualClick) this.isVerifyingPayment = false;
        if (!rows || rows.length === 0) return;
        const todayStr = new Date().toISOString().split('T')[0];
        const matching = rows.find(r =>
          (this.pendingAttendanceId && Number(r.id) === Number(this.pendingAttendanceId)) ||
          (r.check_in_time && String(r.check_in_time).startsWith(todayStr))
        );

        if (matching && matching.payment_status === 'paid') {
          this.handlePaymentConfirmed();
        } else if (manualClick) {
          this.toast.info('Payment still pending. Please pay at the counter and wait for cashier confirmation.');
        }
      },
      error: () => {
        if (manualClick) this.isVerifyingPayment = false;
      }
    });
  }

  handlePaymentConfirmed(): void {
    if (this.isPendingPaymentConfirmed) return;
    this.isPendingPaymentConfirmed = true;
    this.stopPendingAttendanceWatcher();
    this.loadMyAttendanceLogs();
    this.toast.success('Payment Confirmed! Attendance Recorded ✅');
  }

  stopPendingAttendanceWatcher(): void {
    if (this.pendingCheckTimer) {
      clearInterval(this.pendingCheckTimer);
      this.pendingCheckTimer = null;
    }
  }

  // ── Log ───────────────────────────────────────────────
  clearLog(): void {
    this.myLogs = [];
  }

  // ── Modals ────────────────────────────────────────────
  closeAttendanceModal(): void {
    this.attendanceModalOpen = false;
  }

  closePendingModal(): void {
    this.pendingModalOpen = false;
    this.stopPendingAttendanceWatcher();
    this.loadMyAttendanceLogs();
  }

  closeTutorialModal(): void {
    this.tutorialModalOpen = false;
    this.activeEquipment   = null;
    this.isVideoPlaying    = false;
  }

  // ── Coaching screen ────────────────────────────────────────
  // In-flow replacement for ion-content (see qr-scanner.page.html) rather
  // than an overlay -- header and footer are untouched siblings either way.
  coachingPanelOpen = false;
  /** Set from CoachingNavService.consumeReopen() when this page is reached via a back-navigation from chat/coach-profile -- see applyPendingCoachingReopen() and coaching-nav.service.ts. Cleared whenever the panel closes so it never silently re-applies to a later, unrelated open. */
  coachingPanelInitialTab: CoachingPanelTab | null = null;

  onCoachingClick(): void {
    const opening = !this.coachingPanelOpen;
    // Opening the coaching screen removes ion-content (and the camera's
    // target <div> inside it) from the DOM entirely, unlike the old
    // absolutely-positioned overlay which just visually covered it while
    // the camera kept running underneath. Stop any in-progress scan first
    // so html5-qrcode isn't left holding a reference to a detached element
    // (dangling camera stream / stray errors on its next stop() call).
    if (opening && this.isScanning) {
      void this.stopScan();
    }
    this.coachingPanelOpen = opening;
    if (!opening) {
      this.coachingPanelInitialTab = null;
    }
  }

  closeCoachingPanel(): void {
    this.coachingPanelOpen = false;
    this.coachingPanelInitialTab = null;
  }

  // ── Navigation ────────────────────────────────────────
  private closeOverlaysForNavigation(): void { this.notifPanelOpen = false; this.notifDetailOpen = false; this.selectedNotification = null; this.coachingPanelOpen = false; this.coachingPanelInitialTab = null; }

  // NOTE: replaceUrl: true — see the matching note in dashboard.page.ts.
  // Bottom-nav tab switches must REPLACE the current history entry, not
  // push a new one, or Location.back() (on-screen arrow / hardware back)
  // from a later drill-in page (e.g. chat) walks past several stale tab
  // visits instead of returning to whichever tab was actually active.
  goBack():        void { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard'], { replaceUrl: true }); }
  goToDashboard(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard'], { replaceUrl: true }); }
  goToSchedule():  void { this.closeOverlaysForNavigation(); this.router.navigate(['/schedule'], { replaceUrl: true }); }
  goToQr():        void { this.closeOverlaysForNavigation(); this.router.navigate(['/qr-scanner'], { replaceUrl: true }); }
  goToInventory(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/inventory'], { replaceUrl: true }); }
  goToEquipment(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/equipment'], { replaceUrl: true }); }
  goToProfile():   void { this.closeOverlaysForNavigation(); this.router.navigate(['/profile'], { replaceUrl: true }); }
}