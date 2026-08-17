// qr-scanner.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonModal,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { Html5Qrcode } from 'html5-qrcode';
import { HeaderComponent } from '../shared/header/header.component';
import { CoachingPanelComponent } from '../shared/coaching-panel/coaching-panel.component';
import { API_BASE_URL } from '../config/api.config';

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
    HeaderComponent,
    CoachingPanelComponent,
  ],
})
export class QrScannerPage implements OnInit, OnDestroy {

  private readonly api = API_BASE_URL;
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

  // Equipment tutorial modal
  tutorialModalOpen  = false;
  activeEquipment:   EquipmentTutorial | null = null;

  private html5QrCode: Html5Qrcode | null = null;

  // ── Computed ──────────────────────────────────────────
  get filteredLogs(): ScanLogEntry[] {
    if (this.currentFilter === 'all') return this.myLogs;
    return this.myLogs.filter(l => l.type === this.currentFilter);
  }

  get userMembershipType(): string {
    return (this.auth.user as any)?.membership_type || 'premium';
  }

  // ── Lifecycle ─────────────────────────────────────────
  constructor(
    private router: Router,
    private http: HttpClient,
    private auth: AuthService
  ) {}

  // ── Header avatar ─────────────────────────────────────
  initials     = '';
  profileImage = '';

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
    this.loadMyAttendanceLogs();
    const user = this.auth.user;
    const name = String(user?.username || '').trim();
    this.initials = name
      ? name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
    this.profileImage = String(user?.profile_image || '').trim();
    void this.checkCameraPermission();
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

  ngOnDestroy(): void {
    void this.stopCameraScan();
  }

  // ── Load attendance history ───────────────────────────
  loadMyAttendanceLogs(): void {
    if (!this.auth.token) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.get<any[]>(`${this.api}/attendance/my`, { headers }).subscribe({
      next: (records) => {
        this.myLogs = records.map(r => {
          const dt = new Date(r.check_in_time);
          return {
            type: 'attendance' as ScanMode,
            label: `Gym Check-in (${r.payment_status === 'pending' ? 'Pending' : 'Confirmed'})`,
            time: dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: this.formatLogDate(dt),
          };
        });
      },
      error: () => { this.myLogs = []; }
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
      this.html5QrCode ??= new Html5Qrcode(this.scannerRegionId);

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

    if (this.scanMode === 'attendance') {
      await this.doCheckIn(decodedText);
      return;
    }

    const normalizedCode = String(decodedText || '').trim().toLowerCase().replace(/^equipment:/, '');
    const equipment = this.equipmentLibrary.find(item =>
      item.id === normalizedCode || item.name.toLowerCase() === normalizedCode
    );

    if (!equipment) {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const fallbackName = `Equipment (${normalizedCode || 'Unknown'})`;
      this.myLogs = [
        { type: 'equipment', label: fallbackName, time, date: this.formatLogDate(now) },
        ...this.myLogs,
      ];
      this.saveEquipmentScanLog({ id: normalizedCode || 'unknown', name: fallbackName }, decodedText);
      this.isProcessingScan = false;
      this.isScanning = false;
      this.scanStatusMessage = 'QR detected. Usage was recorded, but no tutorial is mapped yet for this equipment.';
      alert('Equipment usage recorded, but no tutorial is linked to this QR yet.');
      return;
    }

    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.myLogs = [
      { type: 'equipment', label: equipment.name, time, date: this.formatLogDate(now) },
      ...this.myLogs,
    ];
    this.saveEquipmentScanLog(equipment, decodedText);
    this.activeEquipment = equipment;
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
        this.myLogs = [
          {
            type: 'attendance',
            label: `Gym Check-in (${res.payment_status === 'pending' ? 'Pending' : 'Confirmed'})`,
            time,
            date: this.formatLogDate(now),
          },
          ...this.myLogs,
        ];
        this.scannedTime = time;
        if (res.payment_status === 'pending') {
          this.checkInMessage = 'Your check-in is pending. Please pay ₱100 to the admin and wait for confirmation.';
          this.pendingModalOpen = true;
        } else {
          this.checkInMessage = 'You\'re checked in! Welcome to the gym.';
          this.attendanceModalOpen = true;
        }
        this.isScanning = false;
        this.isProcessingScan = false;
        this.scanStatusMessage = 'Scan complete. You can scan again anytime.';
      },
      error: (err) => {
        this.isScanning = false;
        this.isProcessingScan = false;
        this.scanStatusMessage = 'Scan failed. Check the QR code and try again.';
        const msg = err.error?.message || 'Check-in failed. Please try again.';
        alert(msg);
      }
    });
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
  }

  closeTutorialModal(): void {
    this.tutorialModalOpen = false;
    this.activeEquipment   = null;
  }

  // ── Coaching screen ────────────────────────────────────────
  // In-flow replacement for ion-content (see qr-scanner.page.html) rather
  // than an overlay -- header and footer are untouched siblings either way.
  coachingPanelOpen = false;

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
  }

  closeCoachingPanel(): void {
    this.coachingPanelOpen = false;
  }

  // ── Navigation ────────────────────────────────────────
  private closeOverlaysForNavigation(): void { this.notifPanelOpen = false; this.notifDetailOpen = false; this.selectedNotification = null; this.coachingPanelOpen = false; }

  goBack():        void { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard']); }
  goToDashboard(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard']); }
  goToSchedule():  void { this.closeOverlaysForNavigation(); this.router.navigate(['/schedule']); }
  goToQr():        void { this.closeOverlaysForNavigation(); this.router.navigate(['/qr-scanner']); }
  goToInventory(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/inventory']); }
  goToEquipment(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/equipment']); }
  goToProfile():   void { this.closeOverlaysForNavigation(); this.router.navigate(['/profile']); }
}