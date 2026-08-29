// profile.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonModal,
  IonInput,
  IonToggle,
  IonSpinner,
} from '@ionic/angular/standalone';
import { ToastService } from '../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ProfileService, UserProfile } from '../services/profile.service';
import { ThemeService } from '../services/theme.service';
import { CoachingNavService, CoachingPanelTab } from '../services/coaching-nav.service';
import { CoachingService } from '../services/coaching.service';
import { NoNegativeDirective } from '../directives/no-negative.directive';
import { HeaderComponent } from '../shared/header/header.component';
import { NotificationPanelComponent } from '../shared/notification-panel/notification-panel.component';
import { CoachingPanelComponent } from '../shared/coaching-panel/coaching-panel.component';
import { FeedbackModalComponent } from '../shared/feedback-modal/feedback-modal.component';
import { PullToRefreshComponent } from '../shared/pull-to-refresh/pull-to-refresh.component';
import { OnboardingService, TourStep } from '../services/onboarding.service';
import { FeedbackService } from '../services/feedback.service';
import { API_URL, resolveImageUrl } from '../config/api.config';

// ── Interfaces ────────────────────────────────────────
export interface MemberProfile {
  firstName:      string;
  lastName:       string;
  email:          string;
  phone:          string;
  dateOfBirth:    string;
  gender:         string;
  profileImage:   string;
  membershipPlan: string;
  expiryDate:     string;
  initials:       string;
}

export interface NotificationSetting {
  id:          string;
  label:       string;
  description: string;
  enabled:     boolean;
}

export interface ProgressHistoryItem {
  date:   string;
  title:  string;
  detail: string;
  value:  string;
}

// ── Component ─────────────────────────────────────────
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonFooter,
    IonIcon,
    IonModal,
    IonInput,
    IonToggle,
    IonSpinner,
    NoNegativeDirective,
    HeaderComponent,
    NotificationPanelComponent,
    CoachingPanelComponent,
    FeedbackModalComponent,
    PullToRefreshComponent,
  ],
})
export class ProfilePage implements OnInit {

  handleRefresh(event: any): void {
    try {
      this.loadProfile();
    } finally {
      setTimeout(() => {
        event?.target?.complete();
      }, 700);
    }
  }

  // ── Member Profile ────────────────────────────────────
  profile: MemberProfile = {
    firstName:      'Carl Andrew',
    lastName:       'Bernaldo',
    email:          'carl.bernaldo@email.com',
    phone:          '0912 345 6789',
    dateOfBirth:    'March 12, 2000',
    gender:         'Male',
    profileImage:   '',
    membershipPlan: 'Premium',
    expiryDate:     'July 14, 2025',
    initials:       'CB',
  };

  // Edit form (bound to form inputs)
  editForm: Partial<MemberProfile> = {};
  phoneInvalid = false;
  savingProfile = false;
  profileImageFailed = false;

  onProfileImageError(): void {
    this.profileImageFailed = true;
  }

  // ── Password Form ─────────────────────────────────────
  passwordForm = {
    current:  '',
    new:      '',
    confirm:  '',
  };

  // ── Notification Settings ─────────────────────────────
  notificationSettings: NotificationSetting[] = [
    {
      id:          'workout-reminder',
      label:       'Workout Reminders',
      description: 'Remind me before scheduled workouts',
      enabled:     true,
    },
    {
      id:          'achievement',
      label:       'Achievements',
      description: 'Notify me when I unlock new achievements',
      enabled:     true,
    },
    {
      id:          'membership',
      label:       'Membership Updates',
      description: 'Updates about my membership and plans',
      enabled:     false,
    },
    {
      id:          'marketing',
      label:       'Marketing Emails',
      description: 'Special offers and promotions',
      enabled:     false,
    },
  ];

  // ── Progress History ──────────────────────────────────
  progressHistory: ProgressHistoryItem[] = [];

  // ── Modal States ──────────────────────────────────────
  editModalOpen              = false;
  changePasswordModalOpen    = false;
  notificationsModalOpen     = false;
  progressHistoryModalOpen   = false;
  renewalModalOpen           = false;
  logoutModalOpen            = false;
  isDarkMode                 = true;

  /** Coach icon badge — kept in sync via CoachingService.unreadCount$ across all pages. */
  coachUnreadCount = 0;

  private api = API_URL;

  constructor(
    public router: Router,
    private auth: AuthService,
    private http: HttpClient,
    private themeService: ThemeService,
    private coachingNav: CoachingNavService,
    private feedbackService: FeedbackService,
    private coachingService: CoachingService,
    private toast: ToastService,
    public onboardingService: OnboardingService,
  ) {}

  private showMobileToast(message: string, isError = false): Promise<void> {
    return isError ? this.toast.error(message) : this.toast.success(message);
  }

  ngOnInit(): void {
    if (!this.auth.user) {
      this.router.navigate(['/login']);
      return;
    }
    this.applyPendingCoachingReopen();
    this.loadProfile();
    this.isDarkMode = this.themeService.isDarkMode();
    // Keep coach badge in sync on this page
    this.coachingService.unreadCount$.subscribe((count) => { this.coachUnreadCount = count; });
  }

  ionViewWillEnter(): void {
    if (!this.auth.user) return;
    this.applyPendingCoachingReopen();
    this.loadProfile();
    this.checkAndStartProfileTour();
  }

  private checkAndStartProfileTour(): void {
    const user = this.auth.user;
    if (!user || user.role === 'admin' || user.role === 'coach') return;

    setTimeout(() => {
      if (this.onboardingService.isRunning || this.coachingPanelOpen) return;

      const steps: TourStep[] = [
        {
          targetId: '#tour-profile-hero',
          title: 'Member Profile',
          description: 'View your display name, registered email address, and active membership status.',
          icon: 'person-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-profile-membership',
          title: 'Membership & Renewal',
          description: 'Check your pass expiry date or tap Renew to extend your 30-day gym membership.',
          icon: 'card-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-profile-transactions',
          title: 'Transaction History',
          description: 'Access complete digital receipts for gym check-ins, pass renewals, and supplement shop orders.',
          icon: 'receipt-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-profile-edit',
          title: 'Edit Personal Info',
          description: 'Update your contact number, birthday, gender, and upload a profile photo.',
          icon: 'create-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-profile-security',
          title: 'Account Security',
          description: 'Change your password anytime to keep your account safe.',
          icon: 'lock-closed-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-profile-theme',
          title: 'Dark / Light Theme',
          description: 'Toggle between FordaGO sleek dark aesthetic and daylight light mode.',
          icon: 'moon-outline',
          position: 'top',
        },
        {
          targetId: '#tour-profile-history',
          title: 'Progress History',
          description: 'Track your bodyweight progression, completed session logs, and personal best records.',
          icon: 'stats-chart-outline',
          position: 'top',
        },
        {
          targetId: '#tour-profile-feedback',
          title: 'Feedback & Support',
          description: 'Directly reach out to our team with feedback, inquiries, or gym assistance.',
          icon: 'chatbubbles-outline',
          position: 'top',
        },
      ];

      const available = steps.filter((s) => !!document.querySelector(s.targetId));
      if (available.length > 0) {
        this.onboardingService.startTour('profile_main', available, false, user.id);
      }
    }, 700);
  }

  // ── Profile Management ────────────────────────────────
  private loadProfile(): void {
    const user = this.auth.user;
    if (!user) return;
    const parts = (user.username || '').split(' ');
    const first = String((user as any).first_name || '').trim() || parts[0] || '';
    const last  = String((user as any).last_name || '').trim() || parts.slice(1).join(' ') || '';

    const membershipType = (user as any).membership_type || 'daily';
    const expiryRaw      = (user as any).membership_expiry || null;

    let expiryDate = membershipType === 'daily' ? 'Pay per visit' : 'N/A';
    if (expiryRaw) {
      const exp = new Date(expiryRaw);
      expiryDate = exp.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    const safePhone = this.normalizePhone((user as any).phone || '');
    this.profile = {
      ...this.profile,
      firstName:      first,
      lastName:       last,
      email:          user.email || '',
      phone:          safePhone,
      gender:         (user as any).gender || '',
      profileImage:   resolveImageUrl((user as any).profile_image),
      membershipPlan: membershipType === 'premium' ? 'Premium' : 'Daily Pass',
      expiryDate,
      initials:       this.buildInitials(first, last || first),
    };

    // Also fetch fresh state from server in background
    this.auth.fetchCurrentUser().subscribe({
      next: (freshUser) => {
        if (!freshUser) return;
        const fParts = (freshUser.username || '').split(' ');
        const fFirst = String(freshUser.first_name || '').trim() || fParts[0] || '';
        const fLast  = String(freshUser.last_name || '').trim() || fParts.slice(1).join(' ') || '';
        const fMemType = freshUser.membership_type || 'daily';
        let fExpDate = fMemType === 'daily' ? 'Pay per visit' : 'N/A';
        if (freshUser.membership_expiry) {
          const fExp = new Date(freshUser.membership_expiry);
          fExpDate = fExp.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        this.profile = {
          ...this.profile,
          firstName:      fFirst,
          lastName:       fLast,
          email:          freshUser.email || '',
          phone:          this.normalizePhone(freshUser.phone || ''),
          gender:         freshUser.gender || '',
          profileImage:   resolveImageUrl(freshUser.profile_image),
          membershipPlan: fMemType === 'premium' ? 'Premium' : 'Daily Pass',
          expiryDate:     fExpDate,
          initials:       this.buildInitials(fFirst, fLast || fFirst),
        };
      },
      error: () => {}
    });
  }

  openEdit(): void {
    this.editForm = {
      firstName: this.profile.firstName,
      lastName:  this.profile.lastName,
      email:     this.profile.email,
      phone:     this.normalizePhone(this.profile.phone),
      profileImage: this.profile.profileImage,
    };
    this.phoneInvalid = false;
    this.editModalOpen = true;
  }

  closeEdit(): void {
    this.editModalOpen = false;
    this.editForm = {};
    this.phoneInvalid = false;
  }

  saveProfile(): void {
    const safePhone = this.normalizePhone(this.editForm.phone || '');
    if (!this.editForm.firstName || !this.editForm.lastName ||
        !this.editForm.email || !safePhone) {
      void this.showMobileToast('Please fill in all fields', true);
      return;
    }

    if (this.phoneInvalid || !this.isValidPhone(safePhone)) {
      void this.showMobileToast('Invalid input: Phone number must contain digits only and be exactly 11 digits long.', true);
      return;
    }

    const userId = this.auth.user?.id;
    if (!userId) {
      void this.showMobileToast('Your session has expired. Please log in again.', true);
      return;
    }

    const nextFirstName = this.editForm.firstName ?? this.profile.firstName;
    const nextLastName  = this.editForm.lastName  ?? this.profile.lastName;
    const nextEmail     = this.editForm.email     ?? this.profile.email;
    const nextImage     = this.editForm.profileImage ?? this.profile.profileImage;

    const payload = {
      username:      `${nextFirstName} ${nextLastName}`.trim(),
      first_name:    nextFirstName,
      last_name:     nextLastName,
      email:         nextEmail,
      phone:         safePhone,
      gender:        (this.profile.gender || '').toLowerCase() || null,
      profile_image: nextImage || null,
    };

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.savingProfile = true;

    this.http.put(`${this.api}/users/${userId}`, payload, { headers }).subscribe({
      next: (res: any) => {
        this.savingProfile = false;
        const returnedAvatar = res?.profile_image ?? nextImage;
        const resolved = resolveImageUrl(returnedAvatar);
        this.profile = {
          ...this.profile,
          firstName:    nextFirstName,
          lastName:     nextLastName,
          email:        nextEmail,
          phone:        safePhone,
          profileImage: resolved,
          initials:     this.buildInitials(nextFirstName, nextLastName),
        };
        this.profileImageFailed = false;
        this.auth.updateCurrentUser({ ...payload, profile_image: returnedAvatar });
        this.closeEdit();
        void this.showMobileToast('Profile updated successfully!');
      },
      error: (err: any) => {
        this.savingProfile = false;
        const message = err?.error?.message
          || (err?.status === 0
            ? 'Cannot reach the server. Please check your connection and try again.'
            : 'Failed to save profile. Please try again.');
        void this.showMobileToast(message, true);
      },
    });
  }

  private normalizePhone(value: string): string {
    return String(value || '').replace(/\D/g, '').slice(0, 11);
  }

  private isValidPhone(value: string): boolean {
    return /^\d{11}$/.test(String(value || ''));
  }

  onPhoneIonInput(event: any): void {
    const raw = String(event?.detail?.value || '');
    const normalized = this.normalizePhone(raw);
    this.phoneInvalid = raw !== normalized;
    this.editForm.phone = normalized;
  }

  onProfileImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const isAllowedType = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type.toLowerCase()) || file.type.startsWith('image/');
    if (!isAllowedType) {
      void this.showMobileToast('Please select a PNG, JPG, or WEBP image.', true);
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      if (!rawDataUrl.startsWith('data:image/')) {
        void this.showMobileToast('Invalid image file.', true);
        return;
      }

      // Auto-compress and scale down large photos from phone cameras
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const maxDim = 800; // 800x800 is sharp and lightweight (<150KB)
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            this.editForm.profileImage = canvas.toDataURL('image/jpeg', 0.85);
          } else {
            this.editForm.profileImage = rawDataUrl;
          }
        } catch {
          this.editForm.profileImage = rawDataUrl;
        }
      };
      img.onerror = () => {
        this.editForm.profileImage = rawDataUrl;
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  }

  removeProfileImage(): void {
    this.editForm.profileImage = '';
  }

  // ── Getters ───────────────────────────────────────────
  get fullName(): string {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }

  private buildInitials(first: string, last: string): string {
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  }

  // ── Password Management ───────────────────────────────
  openChangePassword(): void {
    this.passwordForm = { current: '', new: '', confirm: '' };
    this.changePasswordModalOpen = true;
  }

  closeChangePassword(): void {
    this.changePasswordModalOpen = false;
    this.passwordForm = { current: '', new: '', confirm: '' };
  }

  savePassword(): void {
    if (!this.passwordForm.current || !this.passwordForm.new || !this.passwordForm.confirm) {
      void this.showMobileToast('Please fill in all password fields', true);
      return;
    }
    if (this.passwordForm.new !== this.passwordForm.confirm) {
      void this.showMobileToast('New passwords do not match', true);
      return;
    }
    if (this.passwordForm.new.length < 8) {
      void this.showMobileToast('Password must be at least 8 characters long', true);
      return;
    }
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.post(`${this.api}/auth/change-password`, {
      currentPassword: this.passwordForm.current,
      newPassword:     this.passwordForm.new,
    }, { headers }).subscribe({
      next: () => {
        void this.showMobileToast('Password updated successfully!');
        this.closeChangePassword();
      },
      error: (e: any) => void this.showMobileToast(e.error?.message || 'Failed to update password', true),
    });
  }

  // ── Notification Settings ─────────────────────────────
  openNotifications(): void {
    this.notificationsModalOpen = true;
  }

  closeNotifications(): void {
    this.notificationsModalOpen = false;
  }

  saveNotificationSettings(): void {
    console.log('Notification settings saved:', this.notificationSettings);
    void this.showMobileToast('Notification settings saved!');
    this.closeNotifications();
  }

  onThemeToggle(event: CustomEvent): void {
    this.isDarkMode = !!event.detail?.checked;
    this.themeService.setTheme(this.isDarkMode ? 'dark' : 'light');
  }

  // ── Progress History ──────────────────────────────────
  openProgressHistory(): void {
    this.progressHistoryModalOpen = true;
  }

  closeProgressHistory(): void {
    this.progressHistoryModalOpen = false;
  }

  // ── Membership Renewal & Upgrade ──────────────────────
  selectedPlan: 'daily' | 'premium' = 'premium';
  selectedPaymentMethod: 'gcash' | 'cash' = 'gcash';
  isProcessingRenewal = false;

  openRenewal(): void {
    const isPrem = (this.auth.user as any)?.membership_type === 'premium';
    this.selectedPlan = isPrem ? 'premium' : 'premium';
    this.selectedPaymentMethod = 'gcash';
    this.renewalModalOpen = true;
  }

  closeRenewal(): void {
    if (this.isProcessingRenewal) return;
    this.renewalModalOpen = false;
  }

  processRenewal(): void {
    if (this.isProcessingRenewal) return;
    this.isProcessingRenewal = true;

    this.http.post<any>(`${this.api}/users/membership/renew`, {
      plan: this.selectedPlan,
      payment_method: this.selectedPaymentMethod,
    }).subscribe({
      next: (res) => {
        this.isProcessingRenewal = false;
        this.closeRenewal();
        void this.showMobileToast(res?.message || 'Renewal request submitted! Please verify at the counter.');
        if (res?.user) {
          this.auth.updateCurrentUser(res.user);
        }
        this.loadProfile();
      },
      error: (err) => {
        this.isProcessingRenewal = false;
        const msg = err?.error?.message || 'Failed to update membership. Please try again.';
        void this.showMobileToast(msg, true);
      }
    });
  }

  // ── Feedback & Support ────────────────────────────────
  openFeedbackSupport(): void {
    this.feedbackService.openSupportModal();
  }

  // ── Logout Management ─────────────────────────────────
  confirmLogout(): void {
    this.logoutModalOpen = true;
  }

  cancelLogout(): void {
    this.logoutModalOpen = false;
  }

  logout(): void {
    this.logoutModalOpen = false;
    this.auth.logout();
    // replaceUrl: true -- logout is an auth boundary, same reasoning as
    // login.page.ts's post-login navigate(). A plain push here left
    // /login stacked UNDER the next account's /dashboard entry, so
    // walking back far enough (or a stray extra back-pop) from a later
    // drill-in page could resolve straight to a stale /login screen
    // instead of the currently logged-in account's dashboard. Since /login
    // has nothing meaningful to preserve as a "came from" page, replacing
    // is strictly correct here, not just a back-button workaround.
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  // ── Notifications panel ────────────────────────────────
  // Display/state now lives entirely in the shared NotificationPanelComponent
  // (see shared/notification-panel/); this page just toggles [isOpen] from
  // the header bell and mirrors (unreadCountChange) into its own header badge.
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
  // In-flow replacement for ion-content (see profile.page.html) rather
  // than an overlay -- header and footer are untouched siblings either way.
  coachingPanelOpen = false;
  /** Set from CoachingNavService.consumeReopen() when this page is reached via ChatPage's back button -- see coaching-nav.service.ts and applyPendingCoachingReopen() below. Cleared whenever the panel closes so it never silently re-applies to a later, unrelated open. */
  coachingPanelInitialTab: CoachingPanelTab | null = null;

  onCoachingClick(): void {
    this.coachingPanelOpen = !this.coachingPanelOpen;
  }

  closeCoachingPanel(): void {
    this.coachingPanelOpen = false;
    this.coachingPanelInitialTab = null;
  }

  /**
   * Bound to CoachingPanelComponent's (navigated) output -- fired right
   * before the panel sends the member to a full page (chat, coach
   * profile, schedule). Unconditionally unmounts the panel, same as
   * DashboardPage.closeCoachingPanel() / CoachingPage.onCoachingPanelNavigated().
   * Profile previously had NO handler bound to this output at all, so
   * opening a conversation from here left app-coaching-panel mounted
   * underneath the destination route -- the exact stale-instance bug
   * documented on CoachingPanelComponent.navigated, which froze all touch
   * input on whatever page the member navigated back to.
   */
  onCoachingPanelNavigated(): void {
    this.coachingPanelOpen = false;
    this.coachingPanelInitialTab = null;
  }

  /**
   * Reopens the coaching panel straight to Messages if we landed here via
   * ChatPage's back button (see coaching-nav.service.ts). One-shot --
   * consumeReopen() clears itself, so a normal visit to Profile is
   * completely unaffected. Called from both ngOnInit() and
   * ionViewWillEnter() for the same reason as DashboardPage's version:
   * Ionic's router-outlet caches previously-visited pages, so re-entering
   * Profile after a chat visit only fires ionViewWillEnter(), not ngOnInit().
   */
  private applyPendingCoachingReopen(): void {
    const pendingTab = this.coachingNav.consumeReopen('profile');
    if (pendingTab) {
      this.coachingPanelInitialTab = pendingTab;
      this.coachingPanelOpen = true;
    }
  }

  private closeOverlaysForNavigation(): void {
    this.notifPanelOpen = false;
    this.logoutModalOpen = false;
    this.coachingPanelOpen = false;
    this.coachingPanelInitialTab = null;
  }

  // ── Navigation ────────────────────────────────────────
  // NOTE: replaceUrl: true — see the matching note in dashboard.page.ts.
  // Bottom-nav tab switches must REPLACE the current history entry, not
  // push a new one, or Location.back() (on-screen arrow / hardware back)
  // from a later drill-in page (e.g. chat) walks past several stale tab
  // visits instead of returning to whichever tab was actually active.
  goToDashboard(): void {
    this.closeOverlaysForNavigation();
    this.router.navigate(['/dashboard'], { replaceUrl: true });
  }

  goToSchedule(): void {
    this.closeOverlaysForNavigation();
    this.router.navigate(['/schedule'], { replaceUrl: true });
  }

  goToQr(): void {
    this.closeOverlaysForNavigation();
    this.router.navigate(['/qr-scanner'], { replaceUrl: true });
  }

  goToInventory(): void {
    this.closeOverlaysForNavigation();
    this.router.navigate(['/inventory'], { replaceUrl: true });
  }

  goToEquipment(): void {
    this.closeOverlaysForNavigation();
    this.router.navigate(['/equipment'], { replaceUrl: true });
  }

  goToProfile(): void {
    this.closeOverlaysForNavigation();
    // Already on profile, no navigation needed
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}