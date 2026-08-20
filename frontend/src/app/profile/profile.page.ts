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
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { ProfileService, UserProfile } from '../services/profile.service';
import { ThemeService } from '../services/theme.service';
import { CoachingNavService, CoachingPanelTab } from '../services/coaching-nav.service';
import { NoNegativeDirective } from '../directives/no-negative.directive';
import { HeaderComponent } from '../shared/header/header.component';
import { NotificationPanelComponent } from '../shared/notification-panel/notification-panel.component';
import { CoachingPanelComponent } from '../shared/coaching-panel/coaching-panel.component';
import { API_URL } from '../config/api.config';

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
    NoNegativeDirective,
    HeaderComponent,
    NotificationPanelComponent,
    CoachingPanelComponent,
  ],
})
export class ProfilePage implements OnInit {

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

  private api = API_URL;

  constructor(
    public router: Router,
    private auth: AuthService,
    private http: HttpClient,
    private themeService: ThemeService,
    private coachingNav: CoachingNavService,
  ) {}

  ngOnInit(): void {
    if (!this.auth.user) {
      this.router.navigate(['/login']);
      return;
    }
    this.applyPendingCoachingReopen();
    this.loadProfile();
    this.isDarkMode = this.themeService.isDarkMode();
  }

  ionViewWillEnter(): void {
    if (!this.auth.user) return;
    this.applyPendingCoachingReopen();
    this.loadProfile();
  }

  // ── Profile Management ────────────────────────────────
  private loadProfile(): void {
    const user = this.auth.user;
    const parts = (user.username || '').split(' ');
    const first = String((user as any).first_name || '').trim() || parts[0] || '';
    const last  = String((user as any).last_name || '').trim() || parts.slice(1).join(' ') || '';

    const membershipType = (user as any).membership_type || 'premium';
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
      profileImage:   (user as any).profile_image || '',
      membershipPlan: membershipType === 'premium' ? 'Premium' : 'Daily Pass',
      expiryDate,
      initials:       this.buildInitials(first, last || first),
    };
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
      alert('Please fill in all fields');
      return;
    }

    if (this.phoneInvalid || !this.isValidPhone(safePhone)) {
      alert('Invalid input: Phone number must contain digits only and be exactly 11 digits long.');
      return;
    }

    const userId = this.auth.user?.id;
    if (!userId) {
      alert('Your session has expired. Please log in again.');
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
      gender:        this.profile.gender,
      profile_image: nextImage || null,
    };

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.savingProfile = true;

    // IMPORTANT: local/cached state (this.profile, auth localStorage) is only
    // updated AFTER the server confirms the save. Updating it optimistically
    // (old behavior) masked failed saves -- e.g. DB unreachable -- until the
    // next login silently reverted the change with no explanation.
    this.http.put(`${this.api}/users/${userId}`, payload, { headers }).subscribe({
      next: () => {
        this.savingProfile = false;
        this.profile = {
          ...this.profile,
          firstName:    nextFirstName,
          lastName:     nextLastName,
          email:        nextEmail,
          phone:        safePhone,
          profileImage: nextImage,
          initials:     this.buildInitials(nextFirstName, nextLastName),
        };
        this.auth.updateCurrentUser(payload);
        this.closeEdit();
      },
      error: (err: any) => {
        this.savingProfile = false;
        const message = err?.error?.message
          || (err?.status === 0
            ? 'Cannot reach the server. Please check your connection and try again.'
            : 'Failed to save profile. Please try again.');
        alert(message);
        // Modal stays open on failure so the user keeps their edits and can
        // retry once the connection/server issue is resolved.
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

    const isAllowedType = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
    if (!isAllowedType) {
      alert('Please select a PNG, JPG, or WEBP image.');
      input.value = '';
      return;
    }

    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      alert('Image must be 2MB or smaller.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      if (!result.startsWith('data:image/')) {
        alert('Invalid image file.');
        return;
      }
      this.editForm.profileImage = result;
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
      alert('Please fill in all password fields');
      return;
    }
    if (this.passwordForm.new !== this.passwordForm.confirm) {
      alert('New passwords do not match');
      return;
    }
    if (this.passwordForm.new.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.post(`${this.api}/auth/change-password`, {
      currentPassword: this.passwordForm.current,
      newPassword:     this.passwordForm.new,
    }, { headers }).subscribe({
      next: () => { alert('Password updated successfully!'); this.closeChangePassword(); },
      error: (e: any) => alert(e.error?.message || 'Failed to update password'),
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
    // In a real app, send to API
    console.log('Notification settings saved:', this.notificationSettings);
    alert('Notification settings saved!');
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

  // ── Membership Renewal ────────────────────────────────
  openRenewal(): void {
    this.renewalModalOpen = true;
  }

  closeRenewal(): void {
    this.renewalModalOpen = false;
  }

  processRenewal(): void {
    // In a real app, redirect to payment gateway
    console.log('Renewal process initiated');
    alert('Redirecting to payment gateway...');
    // this.router.navigate(['/payment']);
    this.closeRenewal();
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