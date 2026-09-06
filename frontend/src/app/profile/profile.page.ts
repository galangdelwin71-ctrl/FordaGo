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
import { UserStatusService } from '../services/user-status.service';
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
import { FcmService } from '../services/fcm.service';
import { API_URL, resolveImageUrl } from '../config/api.config';
import {
  FITNESS_GOAL_OPTIONS,
  FitnessGoalOption,
  computeBmi,
  getBmiCategory,
  buildGoalWeekPlan,
} from '../data/workout-templates';

// ── Interfaces ────────────────────────────────────────
export interface MemberProfile {
  firstName:            string;
  lastName:             string;
  email:                string;
  phone:                string;
  dateOfBirth:          string;
  dateOfBirthRaw?:      string;
  gender:               string;
  profileImage:         string;
  membershipPlan:       string;
  expiryDate:           string;
  initials:             string;
  height?:              number | null;
  weight?:              number | null;
  bmi?:                 number | null;
  fitnessGoal?:         string | null;
  preferredWorkoutTime?: string | null;
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
    firstName:            '',
    lastName:             '',
    email:                '',
    phone:                '',
    dateOfBirth:          'Not set',
    dateOfBirthRaw:       '',
    gender:               '',
    profileImage:         '',
    membershipPlan:       'Daily Pass',
    expiryDate:           'N/A',
    initials:             '',
    height:               null,
    weight:               null,
    bmi:                  null,
    fitnessGoal:          'muscle_gain',
    preferredWorkoutTime: '17:00',
  };

  get maxDobDate(): string {
    const today = new Date();
    const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    return tenYearsAgo.toISOString().split('T')[0];
  }

  fitnessGoalOptions = FITNESS_GOAL_OPTIONS;
  afternoonTimeOptions = [
    { value: '09:00', label: '9:00 AM (Gym Opening)' },
    { value: '09:30', label: '9:30 AM (Morning Session)' },
    { value: '10:00', label: '10:00 AM (Mid-Morning)' },
    { value: '10:30', label: '10:30 AM (Morning Routine)' },
    { value: '11:00', label: '11:00 AM (Pre-Noon Session)' },
    { value: '11:30', label: '11:30 AM (Midday Session)' },
    { value: '12:00', label: '12:00 PM (Noon Hours)' },
    { value: '12:30', label: '12:30 PM (Early Afternoon)' },
    { value: '13:00', label: '1:00 PM (Afternoon Session)' },
    { value: '13:30', label: '1:30 PM (Afternoon Session)' },
    { value: '14:00', label: '2:00 PM (Mid-Afternoon)' },
    { value: '14:30', label: '2:30 PM (Mid-Afternoon)' },
    { value: '15:00', label: '3:00 PM (Afternoon Hours)' },
    { value: '15:30', label: '3:30 PM (Mid-Afternoon)' },
    { value: '16:00', label: '4:00 PM (Afternoon Session)' },
    { value: '16:30', label: '4:30 PM (Late Afternoon)' },
    { value: '17:00', label: '5:00 PM (Popular Peak Hours)' },
    { value: '17:30', label: '5:30 PM (Sunset Session)' },
    { value: '18:00', label: '6:00 PM (Evening Routine)' },
    { value: '18:30', label: '6:30 PM (Evening Hours)' },
    { value: '19:00', label: '7:00 PM (Night Routine)' },
    { value: '19:30', label: '7:30 PM (Night Session)' },
    { value: '20:00', label: '8:00 PM (Late Evening)' },
    { value: '20:30', label: '8:30 PM (Closing Hour Routine)' },
    { value: '21:00', label: '9:00 PM (Gym Closing)' },
  ];

  // Edit form (bound to form inputs)
  editForm: Partial<MemberProfile> = {};
  editBmi: number | null = null;
  phoneInvalid = false;
  savingProfile = false;
  profileImageFailed = false;

  onProfileImageError(): void {
    this.profileImageFailed = true;
  }

  get currentGoalDetails(): FitnessGoalOption | undefined {
    const goal = this.profile.fitnessGoal || 'muscle_gain';
    return this.fitnessGoalOptions.find((g) => g.id === goal);
  }

  get currentBmiCategory() {
    return getBmiCategory(this.profile.bmi);
  }

  get editBmiCategory() {
    return getBmiCategory(this.editBmi);
  }

  onEditStatsChange(): void {
    const h = Number(this.editForm.height);
    const w = Number(this.editForm.weight);
    this.editBmi = computeBmi(h > 0 ? h : null, w > 0 ? w : null);
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
  isActiveStatus             = true;

  /** Coach icon badge — kept in sync via CoachingService.unreadCount$ across all pages. */
  coachUnreadCount = 0;

  private api = API_URL;

  constructor(
    public router: Router,
    private auth: AuthService,
    private http: HttpClient,
    private themeService: ThemeService,
    private userStatusService: UserStatusService,
    private coachingNav: CoachingNavService,
    private feedbackService: FeedbackService,
    private coachingService: CoachingService,
    private toast: ToastService,
    public onboardingService: OnboardingService,
    private fcmService: FcmService,
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
    this.isActiveStatus = this.userStatusService.isActive;
    // Keep coach badge in sync on this page
    this.coachingService.unreadCount$.subscribe((count) => { this.coachUnreadCount = count; });
  }

  ionViewWillEnter(): void {
    if (!this.auth.user) return;
    this.applyPendingCoachingReopen();
    this.loadProfile();
    this.isActiveStatus = this.userStatusService.isActive;
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

    const rawDob = (user as any).date_of_birth || (user as any).dateOfBirth || null;
    let formattedDob = 'Not set';
    let dobRaw = '';
    if (rawDob) {
      const d = new Date(rawDob);
      if (!isNaN(d.getTime())) {
        formattedDob = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        dobRaw = rawDob.includes('T') ? rawDob.split('T')[0] : rawDob;
      }
    }

    const safePhone = this.normalizePhone((user as any).phone || '');
    this.profile = {
      ...this.profile,
      firstName:            first,
      lastName:             last,
      email:                user.email || '',
      phone:                safePhone,
      dateOfBirth:          formattedDob,
      dateOfBirthRaw:       dobRaw,
      gender:               (user as any).gender || '',
      profileImage:         resolveImageUrl((user as any).profile_image),
      membershipPlan:       membershipType === 'premium' ? 'Premium' : 'Daily Pass',
      expiryDate,
      initials:             this.buildInitials(first, last || first),
      height:               user.height != null ? Number(user.height) : null,
      weight:               user.weight != null ? Number(user.weight) : null,
      bmi:                  user.bmi != null ? Number(user.bmi) : null,
      fitnessGoal:          user.fitness_goal || 'muscle_gain',
      preferredWorkoutTime: user.preferred_workout_time || '17:00',
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

        const fRawDob = (freshUser as any).date_of_birth || (freshUser as any).dateOfBirth || null;
        let fFormattedDob = this.profile.dateOfBirth;
        let fDobRaw = this.profile.dateOfBirthRaw || '';
        if (fRawDob) {
          const fd = new Date(fRawDob);
          if (!isNaN(fd.getTime())) {
            fFormattedDob = fd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            fDobRaw = fRawDob.includes('T') ? fRawDob.split('T')[0] : fRawDob;
          }
        }

        this.profile = {
          ...this.profile,
          firstName:            fFirst,
          lastName:             fLast,
          email:                freshUser.email || '',
          phone:                this.normalizePhone(freshUser.phone || ''),
          dateOfBirth:          fFormattedDob,
          dateOfBirthRaw:       fDobRaw,
          gender:               freshUser.gender || '',
          profileImage:         resolveImageUrl(freshUser.profile_image),
          membershipPlan:       fMemType === 'premium' ? 'Premium' : 'Daily Pass',
          expiryDate:           fExpDate,
          initials:             this.buildInitials(fFirst, fLast || fFirst),
          height:               freshUser.height != null ? Number(freshUser.height) : null,
          weight:               freshUser.weight != null ? Number(freshUser.weight) : null,
          bmi:                  freshUser.bmi != null ? Number(freshUser.bmi) : null,
          fitnessGoal:          freshUser.fitness_goal || 'muscle_gain',
          preferredWorkoutTime: freshUser.preferred_workout_time || '17:00',
        };
      },
      error: () => {}
    });
  }

  openEdit(): void {
    this.editForm = {
      firstName:            this.profile.firstName,
      lastName:             this.profile.lastName,
      email:                this.profile.email,
      phone:                this.normalizePhone(this.profile.phone),
      dateOfBirth:          this.profile.dateOfBirthRaw || '',
      profileImage:         this.profile.profileImage,
      height:               this.profile.height,
      weight:               this.profile.weight,
      fitnessGoal:          this.profile.fitnessGoal || 'muscle_gain',
      preferredWorkoutTime: this.profile.preferredWorkoutTime || '17:00',
    };
    this.editBmi = this.profile.bmi ?? computeBmi(this.profile.height, this.profile.weight);
    this.phoneInvalid = false;
    this.editModalOpen = true;
  }

  closeEdit(): void {
    this.editModalOpen = false;
    this.editForm = {};
    this.editBmi = null;
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

    const parsedHeight = this.editForm.height ? Number(this.editForm.height) : null;
    const parsedWeight = this.editForm.weight ? Number(this.editForm.weight) : null;
    const computedBmiVal = computeBmi(parsedHeight, parsedWeight);
    const nextGoal = this.editForm.fitnessGoal || this.profile.fitnessGoal || 'muscle_gain';
    const nextTime = this.editForm.preferredWorkoutTime || this.profile.preferredWorkoutTime || '17:00';

    const nextDob = this.editForm.dateOfBirth || this.profile.dateOfBirthRaw || null;
    let nextFormattedDob = this.profile.dateOfBirth;
    if (nextDob) {
      const d = new Date(nextDob);
      if (!isNaN(d.getTime())) {
        nextFormattedDob = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      }
    }

    const payload: Record<string, any> = {
      username:               `${nextFirstName} ${nextLastName}`.trim(),
      first_name:             nextFirstName,
      last_name:              nextLastName,
      email:                  nextEmail,
      phone:                  safePhone,
      gender:                 (this.profile.gender || '').toLowerCase() || null,
      date_of_birth:          nextDob,
      profile_image:          nextImage || null,
      height:                 parsedHeight,
      weight:                 parsedWeight,
      bmi:                    computedBmiVal,
      fitness_goal:           nextGoal,
      preferred_workout_time: nextTime,
    };

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.savingProfile = true;

    this.http.put(`${this.api}/users/${userId}`, payload, { headers }).subscribe({
      next: (res: any) => {
        this.savingProfile = false;
        const returnedAvatar = res?.profile_image ?? nextImage;
        const resolved = resolveImageUrl(returnedAvatar);
        const finalBmi = res?.bmi != null ? Number(res.bmi) : computedBmiVal;

        this.profile = {
          ...this.profile,
          firstName:            nextFirstName,
          lastName:             nextLastName,
          email:                nextEmail,
          phone:                safePhone,
          dateOfBirth:          nextFormattedDob,
          dateOfBirthRaw:       nextDob || '',
          profileImage:         resolved,
          initials:             this.buildInitials(nextFirstName, nextLastName),
          height:               parsedHeight,
          weight:               parsedWeight,
          bmi:                  finalBmi,
          fitnessGoal:          nextGoal,
          preferredWorkoutTime: nextTime,
        };
        this.profileImageFailed = false;
        this.auth.updateCurrentUser({
          ...payload,
          profile_image: returnedAvatar,
          date_of_birth: nextDob,
          bmi: finalBmi,
        });

        // Re-generate suggested workout plan with the updated target goal, BMI adaptation, and afternoon time
        try {
          const updatedPlan = buildGoalWeekPlan(nextGoal, finalBmi, nextTime);
          localStorage.setItem('fordago_week_plan_v1', JSON.stringify(updatedPlan));
        } catch {}

        this.closeEdit();
        void this.showMobileToast('Profile & body goal updated successfully!');
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

  onActiveStatusToggle(event: CustomEvent): void {
    this.isActiveStatus = !!event.detail?.checked;
    this.userStatusService.setActiveStatus(this.isActiveStatus);
    if (this.isActiveStatus) {
      void this.showMobileToast('Active status turned ON (Visible to members)');
    } else {
      void this.showMobileToast('Active status turned OFF (Appearing offline)');
    }
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
    // Clear the FCM device token on the backend FIRST (while the auth token
    // is still in localStorage) so this device no longer receives push
    // notifications for the account that just logged out.
    void this.fcmService.clearFcmToken().finally(() => {
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
    });
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