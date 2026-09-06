import { Component, HostListener, OnDestroy } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { NoNegativeDirective } from '../directives/no-negative.directive';
import { resolveImageUrl } from '../config/api.config';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  barbellOutline,
  bodyOutline,
  calendarOutline,
  callOutline,
  cardOutline,
  cashOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircle,
  checkmarkCircleOutline,
  checkmarkOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  closeCircleOutline,
  diamondOutline,
  eyeOffOutline,
  eyeOutline,
  fitnessOutline,
  flameOutline,
  flashOutline,
  informationCircleOutline,
  keyOutline,
  keypadOutline,
  lockClosedOutline,
  mailOutline,
  peopleOutline,
  personAddOutline,
  personOutline,
  phonePortraitOutline,
  refreshOutline,
  scaleOutline,
  searchOutline,
  sendOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  speedometerOutline,
  timeOutline,
  timerOutline,
} from 'ionicons/icons';
import {
  FITNESS_GOAL_OPTIONS,
  FitnessGoalOption,
  FitnessGoalKey,
  buildGoalWeekPlan,
  computeBmi,
  getBmiCategory,
  formatTime24to12,
} from '../data/workout-templates';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner, NoNegativeDirective],
})
export class LoginPage implements OnDestroy {
  segment: 'login' | 'register' | 'forgot' = 'login';
  regStep = 1;

  genderOpen = false;
  readonly genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
  ];

  get genderLabel(): string {
    return this.genderOptions.find((option) => option.value === this.reg.gender)?.label || 'Select gender';
  }

  // Login fields
  email = '';
  password = '';
  showLoginPassword = false;
  error = '';
  loading = false;

  readonly goalOptions = FITNESS_GOAL_OPTIONS;
  readonly afternoonTimeOptions = [
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

  timeDropdownOpen = false;
  userHasManuallySelectedGoal = false;

  // Registration fields
  reg = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    dateOfBirth: '',
    password: '',
    confirm: '',
    height: null as number | null,
    weight: null as number | null,
    bmi: null as number | null,
    fitness_goal: 'muscle_gain' as FitnessGoalKey,
    preferred_workout_time: '17:00',
    membership_type: 'premium' as 'daily' | 'premium',
    payment_method: 'cash' as '' | 'cash' | 'gcash',
  };
  showRegisterPassword = false;
  showRegisterConfirm = false;
  regError = '';
  regLoading = false;
  regSuccess = false;
  regSuccessMembershipType: 'daily' | 'premium' = 'daily';
  regSuccessPaymentMethod: '' | 'cash' | 'gcash' = '';
  regSuccessPhone = '';
  regSuccessSmsSent = false;
  regSuccessSmsReason = '';

  // Forgot-password fields
  fpStep: number = 1;
  fpIdentifier = '';
  fpEmailMasked = '';
  fpHasPhone = false;
  fpPhoneMasked = '';
  fpChannel: 'email' | 'sms' | '' = '';
  fpCode = '';
  fpOtpDigits: string[] = ['', '', '', '', '', ''];
  fpResetToken = '';
  fpNewPassword = '';
  fpConfirmPassword = '';
  fpShowPassword = false;
  fpShowConfirm = false;
  fpError = '';
  fpLoading = false;
  fpSentMessage = '';
  fpDevCode = '';
  fpResendCountdown = 0;
  fpAccounts: Array<{
    id: number;
    name: string;
    username: string;
    emailMasked: string;
    phoneMasked: string | null;
    hasPhone: boolean;
    avatar: string | null;
    membershipType: string;
    membershipStatus: string;
  }> = [];
  fpSelectedUserId: number | null = null;
  fpSelectedAccountName = '';
  private fpResendTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private auth: AuthService, private router: Router) {
    // Register every icon used by this standalone page.
    // This prevents blank icons in production builds or offline installs.
    addIcons({
      'alert-circle-outline': alertCircleOutline,
      'arrow-back-outline': arrowBackOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'barbell-outline': barbellOutline,
      'calendar-outline': calendarOutline,
      'call-outline': callOutline,
      'card-outline': cardOutline,
      'cash-outline': cashOutline,
      'chatbubble-ellipses-outline': chatbubbleEllipsesOutline,
      'checkmark-circle': checkmarkCircle,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'checkmark-outline': checkmarkOutline,
      'chevron-back-outline': chevronBackOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'close-circle-outline': closeCircleOutline,
      'diamond-outline': diamondOutline,
      'eye-off-outline': eyeOffOutline,
      'eye-outline': eyeOutline,
      'information-circle-outline': informationCircleOutline,
      'key-outline': keyOutline,
      'keypad-outline': keypadOutline,
      'lock-closed-outline': lockClosedOutline,
      'mail-outline': mailOutline,
      'people-outline': peopleOutline,
      'person-add-outline': personAddOutline,
      'person-outline': personOutline,
      'phone-portrait-outline': phonePortraitOutline,
      'refresh-outline': refreshOutline,
      'scale-outline': scaleOutline,
      'search-outline': searchOutline,
      'send-outline': sendOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'sparkles-outline': sparklesOutline,
      'speedometer-outline': speedometerOutline,
      'time-outline': timeOutline,
      'timer-outline': timerOutline,
      'flame-outline': flameOutline,
      'flash-outline': flashOutline,
      'body-outline': bodyOutline,
      'fitness-outline': fitnessOutline,
    });
  }

  ngOnDestroy(): void {
    this.clearResendTimer();
  }

  @HostListener('document:click')
  closeDropdowns(): void {
    this.genderOpen = false;
    this.timeDropdownOpen = false;
  }

  toggleGenderDropdown(event?: Event): void {
    event?.stopPropagation();
    this.timeDropdownOpen = false;
    this.genderOpen = !this.genderOpen;
  }

  selectGender(value: string): void {
    this.reg.gender = value;
    this.genderOpen = false;
  }

  toggleTimeDropdown(event?: Event): void {
    event?.stopPropagation();
    this.genderOpen = false;
    this.timeDropdownOpen = !this.timeDropdownOpen;
  }

  selectWorkoutTime(time: string): void {
    this.reg.preferred_workout_time = time;
    this.timeDropdownOpen = false;
  }

  get preferredTimeLabel(): string {
    return (
      this.afternoonTimeOptions.find((t) => t.value === this.reg.preferred_workout_time)?.label ||
      '5:00 PM (Popular Peak Hours)'
    );
  }

  onHeightOrWeightChange(): void {
    const h = Number(this.reg.height);
    const w = Number(this.reg.weight);
    if (h > 0 && w > 0) {
      this.reg.bmi = computeBmi(h, w);
    } else {
      this.reg.bmi = null;
    }
  }

  get recommendedGoalForBmi(): FitnessGoalKey {
    const bmi = this.reg.bmi;
    if (!bmi) return 'muscle_gain';
    if (bmi >= 25) {
      return 'weight_loss';
    } else if (bmi < 18.5) {
      return 'muscle_gain';
    } else {
      return 'tone_endurance';
    }
  }

  get currentBmiCategory() {
    return getBmiCategory(this.reg.bmi);
  }

  get selectedGoalDetails(): FitnessGoalOption {
    return this.goalOptions.find((g) => g.id === this.reg.fitness_goal) || this.goalOptions[1];
  }

  get previewGoalPlan() {
    return buildGoalWeekPlan(this.reg.fitness_goal, this.reg.bmi, this.reg.preferred_workout_time);
  }

  selectGoal(goalId: FitnessGoalKey): void {
    this.userHasManuallySelectedGoal = true;
    this.reg.fitness_goal = goalId;
  }

  ionViewWillEnter(): void {
    this.resetLoginInputs();
    this.resetForgotPasswordInputs();
    this.segment = 'login';
    this.genderOpen = false;
  }

  private resetLoginInputs(): void {
    this.email = '';
    this.password = '';
    this.error = '';
    this.loading = false;
    this.showLoginPassword = false;
  }

  private createEmptyRegistration() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      password: '',
      confirm: '',
      height: null as number | null,
      weight: null as number | null,
      bmi: null as number | null,
      fitness_goal: 'muscle_gain' as FitnessGoalKey,
      preferred_workout_time: '17:00',
      membership_type: 'premium' as 'daily' | 'premium',
      payment_method: 'cash' as '' | 'cash' | 'gcash',
    };
  }

  get maxDobDate(): string {
    const today = new Date();
    const tenYearsAgo = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
    return tenYearsAgo.toISOString().split('T')[0];
  }

  private resetRegistrationInputs(): void {
    this.reg = this.createEmptyRegistration();
    this.regStep = 1;
    this.regError = '';
    this.showRegisterPassword = false;
    this.showRegisterConfirm = false;
  }

  submitLogin(event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    this.login();
  }

  goToRegister(): void {
    this.segment = 'register';
    this.genderOpen = false;
    this.regStep = 1;
    this.regError = '';
    this.regSuccess = false;
  }

  goToLogin(): void {
    const previousIdentifier = this.fpIdentifier.includes('@') ? this.fpIdentifier : '';
    this.segment = 'login';
    this.genderOpen = false;
    this.resetLoginInputs();
    if (previousIdentifier && this.fpStep === 5) {
      this.email = previousIdentifier;
    }
    this.regStep = 1;
    this.regError = '';
    this.regSuccess = false;
    this.regSuccessMembershipType = 'daily';
    this.regSuccessPaymentMethod = '';
    this.regSuccessPhone = '';
    this.regSuccessSmsSent = false;
    this.regSuccessSmsReason = '';
    this.resetForgotPasswordInputs();
  }

  goToForgotPassword(): void {
    this.resetForgotPasswordInputs();
    // If user already typed their email in the login box, pre-populate it
    if (this.email.trim()) {
      this.fpIdentifier = this.email.trim();
    }
    this.genderOpen = false;
    this.segment = 'forgot';
  }

  private resetForgotPasswordInputs(): void {
    this.clearResendTimer();
    this.fpStep = 1;
    this.fpIdentifier = '';
    this.fpEmailMasked = '';
    this.fpHasPhone = false;
    this.fpPhoneMasked = '';
    this.fpChannel = '';
    this.fpCode = '';
    this.fpOtpDigits = ['', '', '', '', '', ''];
    this.fpResetToken = '';
    this.fpNewPassword = '';
    this.fpConfirmPassword = '';
    this.fpShowPassword = false;
    this.fpShowConfirm = false;
    this.fpError = '';
    this.fpLoading = false;
    this.fpSentMessage = '';
    this.fpDevCode = '';
    this.fpResendCountdown = 0;
    this.fpAccounts = [];
    this.fpSelectedUserId = null;
    this.fpSelectedAccountName = '';
  }

  private startResendCountdown(seconds = 60): void {
    this.clearResendTimer();
    this.fpResendCountdown = seconds;
    this.fpResendTimer = setInterval(() => {
      if (this.fpResendCountdown > 1) {
        this.fpResendCountdown--;
      } else {
        this.fpResendCountdown = 0;
        this.clearResendTimer();
      }
    }, 1000);
  }

  private clearResendTimer(): void {
    if (this.fpResendTimer) {
      clearInterval(this.fpResendTimer);
      this.fpResendTimer = null;
    }
  }

  // ── OTP Inputs Handling ─────────────────────────────────────

  onOtpInput(event: any, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '');

    if (val.length > 1) {
      const chars = val.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        this.fpOtpDigits[i] = chars[i] || '';
      }
      this.syncOtpCode();
      const lastIndex = Math.min(chars.length - 1, 5);
      this.focusOtpInput(lastIndex);
      if (this.fpCode.length === 6) {
        this.fpVerifyCode();
      }
      return;
    }

    this.fpOtpDigits[index] = val ? val.slice(-1) : '';
    this.syncOtpCode();

    if (val && index < 5) {
      this.focusOtpInput(index + 1);
    }

    if (this.fpCode.length === 6) {
      this.fpVerifyCode();
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace') {
      if (!this.fpOtpDigits[index] && index > 0) {
        this.fpOtpDigits[index - 1] = '';
        this.syncOtpCode();
        this.focusOtpInput(index - 1);
      }
    }
  }

  onOtpPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const digits = pasted.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length > 0) {
      for (let i = 0; i < 6; i++) {
        this.fpOtpDigits[i] = digits[i] || '';
      }
      this.syncOtpCode();
      const nextIndex = Math.min(digits.length, 5);
      this.focusOtpInput(nextIndex);
      if (this.fpCode.length === 6) {
        this.fpVerifyCode();
      }
    }
  }

  private syncOtpCode(): void {
    this.fpCode = this.fpOtpDigits.join('');
  }

  private focusOtpInput(index: number): void {
    setTimeout(() => {
      const el = document.getElementById(`fp-otp-${index}`) as HTMLInputElement | null;
      if (el) {
        el.focus();
        el.select();
      }
    }, 50);
  }

  // ── Password Requirement Helpers ────────────────────────────

  get fpHasMinLength(): boolean {
    return this.fpNewPassword.length >= 8;
  }
  get fpHasUpper(): boolean {
    return /[A-Z]/.test(this.fpNewPassword);
  }
  get fpHasLower(): boolean {
    return /[a-z]/.test(this.fpNewPassword);
  }
  get fpHasNumber(): boolean {
    return /\d/.test(this.fpNewPassword);
  }
  get fpHasSpecial(): boolean {
    return /[^A-Za-z0-9]/.test(this.fpNewPassword);
  }
  get fpIsPasswordStrong(): boolean {
    return (
      this.fpHasMinLength &&
      this.fpHasUpper &&
      this.fpHasLower &&
      this.fpHasNumber &&
      this.fpHasSpecial
    );
  }
  get fpPasswordsMatch(): boolean {
    return !!(
      this.fpNewPassword &&
      this.fpConfirmPassword &&
      this.fpNewPassword === this.fpConfirmPassword
    );
  }

  // ── Forgot Password Steps ───────────────────────────────────

  fpLookupEmail(): void {
    this.fpError = '';
    const raw = this.fpIdentifier.trim();
    if (!raw) {
      this.fpError = 'Please enter your registered email or phone number.';
      return;
    }

    const isEmail = raw.includes('@');
    const digits = raw.replace(/\D/g, '');
    const validEmail = isEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(raw.toLowerCase());
    const validPhone = !isEmail && digits.length >= 10;

    if (!validEmail && !validPhone) {
      this.fpError = 'Please enter a valid email address or phone number (e.g. 09171234567).';
      return;
    }

    const normalized = isEmail ? raw.toLowerCase() : digits;
    this.fpIdentifier = normalized;
    this.fpLoading = true;
    this.fpAccounts = [];
    this.fpSelectedUserId = null;
    this.fpSelectedAccountName = '';

    this.auth.forgotPasswordLookup(normalized).subscribe({
      next: (res: any) => {
        this.fpLoading = false;

        // If multiple accounts share the same phone number, show account picker
        if (res?.multiple && Array.isArray(res.accounts) && res.accounts.length > 1) {
          this.fpAccounts = res.accounts;
          this.fpStep = 1.5;
          return;
        }

        this.fpSelectedUserId = res?.userId || null;
        this.fpSelectedAccountName = res?.name || '';
        this.fpEmailMasked = res?.emailMasked || '';
        this.fpHasPhone = Boolean(res?.hasPhone);
        this.fpPhoneMasked = res?.phoneMasked || '';

        // If lookup was by phone and account has phone, default to SMS, otherwise email
        this.fpChannel = !isEmail && this.fpHasPhone ? 'sms' : 'email';
        this.fpStep = 2;
      },
      error: (err: any) => {
        this.fpLoading = false;
        this.fpError = err?.error?.message || 'Could not find an account with that email or phone.';
      },
    });
  }

  selectFpAccount(account: any): void {
    this.fpSelectedUserId = account.id;
    this.fpSelectedAccountName = account.name || account.username || '';
    this.fpEmailMasked = account.emailMasked || '';
    this.fpHasPhone = Boolean(account.hasPhone);
    this.fpPhoneMasked = account.phoneMasked || '';
    this.fpChannel = this.fpHasPhone ? 'sms' : 'email';
    this.fpStep = 2;
  }

  resolveAccountAvatar(avatar: string | null | undefined): string {
    return resolveImageUrl(avatar);
  }

  fpChooseChannel(channel: 'email' | 'sms'): void {
    this.fpChannel = channel;
  }

  fpSendCode(): void {
    this.fpError = '';

    if (!this.fpChannel) {
      this.fpError = 'Please choose where to receive your OTP verification code.';
      return;
    }

    this.fpLoading = true;

    this.auth.forgotPasswordSend(this.fpIdentifier, this.fpChannel, this.fpSelectedUserId ?? undefined).subscribe({
      next: (res: any) => {
        this.fpLoading = false;
        this.fpDevCode = res?.devCode || '';
        this.fpOtpDigits = ['', '', '', '', '', ''];
        this.fpCode = '';

        if (res?.sent) {
          const dest =
            res.destinationMasked ||
            (this.fpChannel === 'email' ? this.fpEmailMasked : this.fpPhoneMasked);
          this.fpSentMessage = `We have sent a 6-digit OTP code to ${dest}.`;
          this.fpStep = 3;
          this.startResendCountdown(60);
          this.focusOtpInput(0);
        } else if (res?.devCode) {
          this.fpSentMessage = `Demo Mode: Your OTP verification code is ${res.devCode}.`;
          this.fpCode = res.devCode;
          this.fpOtpDigits = res.devCode.split('').slice(0, 6);
          this.fpStep = 3;
          this.startResendCountdown(60);
        } else {
          this.fpError = res?.reason || 'Could not send the code. Please try again.';
        }
      },
      error: (err: any) => {
        this.fpLoading = false;
        this.fpError = err?.error?.message || 'Could not send the code. Please try again.';
      },
    });
  }

  fpResendCode(): void {
    if (this.fpResendCountdown > 0 || this.fpLoading) {
      return;
    }
    this.fpSendCode();
  }

  fpVerifyCode(): void {
    this.fpError = '';
    this.syncOtpCode();
    const code = this.fpCode.trim();

    if (!/^\d{6}$/.test(code)) {
      this.fpError = 'Please enter the complete 6-digit OTP code.';
      return;
    }

    this.fpLoading = true;

    this.auth.forgotPasswordVerify(this.fpIdentifier, code, this.fpSelectedUserId ?? undefined).subscribe({
      next: (res: any) => {
        this.fpLoading = false;
        this.clearResendTimer();
        this.fpResetToken = res?.resetToken || '';
        this.fpStep = 4;
      },
      error: (err: any) => {
        this.fpLoading = false;
        this.fpError = err?.error?.message || 'Invalid or expired OTP code. Please try again.';
      },
    });
  }

  fpToggleNewPassword(): void {
    this.fpShowPassword = !this.fpShowPassword;
  }

  fpToggleConfirmPassword(): void {
    this.fpShowConfirm = !this.fpShowConfirm;
  }

  fpSubmitNewPassword(): void {
    this.fpError = '';

    if (!this.fpIsPasswordStrong) {
      this.fpError = 'Password must meet all security requirements listed below.';
      return;
    }

    if (this.fpNewPassword !== this.fpConfirmPassword) {
      this.fpError = 'Passwords do not match.';
      return;
    }

    this.fpLoading = true;

    this.auth.forgotPasswordReset(this.fpResetToken, this.fpNewPassword).subscribe({
      next: () => {
        this.fpLoading = false;
        this.fpStep = 5;
      },
      error: (err: any) => {
        this.fpLoading = false;
        this.fpError = err?.error?.message || 'Could not reset password. Please start again.';
      },
    });
  }

  nextStep(): void {
    this.regError = '';

    if (this.regStep === 1) {
      if (!this.reg.firstName.trim()) {
        this.regError = 'First name is required.';
        return;
      }

      if (!this.reg.lastName.trim()) {
        this.regError = 'Last name is required.';
        return;
      }

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(this.reg.email)) {
        this.regError = 'A valid email is required.';
        return;
      }

      const phoneDigits = this.reg.phone.replace(/\D/g, '');

      if (phoneDigits && !/^\d{11}$/.test(phoneDigits)) {
        this.regError = 'Phone number must be exactly 11 digits, for example 09171234567.';
        return;
      }

      this.reg.phone = phoneDigits;

      if (!this.reg.dateOfBirth) {
        this.regError = 'Date of birth is required.';
        return;
      }

      const birthDate = new Date(this.reg.dateOfBirth);
      if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
        this.regError = 'Please enter a valid date of birth.';
        return;
      }

      if (!this.isStrongPassword(this.reg.password)) {
        this.regError = 'Password must be 8+ chars and include uppercase, lowercase, number, and special character.';
        return;
      }

      if (this.reg.password !== this.reg.confirm) {
        this.regError = 'Passwords do not match.';
        return;
      }

      this.regStep = 2;
      return;
    }

    if (this.regStep === 2) {
      const h = Number(this.reg.height);
      const w = Number(this.reg.weight);

      if (!h || h <= 0 || h > 260) {
        this.regError = 'Please enter a valid height in centimeters (e.g. 170 cm).';
        return;
      }

      if (!w || w <= 0 || w > 350) {
        this.regError = 'Please enter a valid weight in kilograms (e.g. 68 kg).';
        return;
      }

      this.onHeightOrWeightChange();
      if (!this.userHasManuallySelectedGoal) {
        this.reg.fitness_goal = this.recommendedGoalForBmi;
      }

      this.regStep = 3;
      return;
    }

    if (this.regStep === 3) {
      if (!this.reg.fitness_goal) {
        this.regError = 'Please choose your target fitness goal.';
        return;
      }

      if (!this.reg.preferred_workout_time) {
        this.reg.preferred_workout_time = '17:00';
      }

      this.regStep = 4;
      return;
    }

    if (this.regStep === 4) {
      if (!this.reg.membership_type) {
        this.regError = 'Please select a membership plan.';
        return;
      }

      if (this.reg.membership_type === 'premium' && !this.reg.payment_method) {
        this.regError = 'Please select a payment method for Premium.';
        return;
      }

      this.regStep = 5;
      return;
    }
  }

  login(): void {
    if (!this.validateLoginInputs()) return;

    this.error = '';
    this.loading = true;

    this.auth.login(this.email.trim().toLowerCase(), this.password).subscribe({
      next: () => {
        this.loading = false;
        const user = this.auth.user;

        if (!user) {
          this.error = 'Login succeeded but no user data returned. Please try again.';
          return;
        }

        // replaceUrl: true -- login is an auth BOUNDARY, same as every
        // root/tab page's goTo*() elsewhere in this app (see e.g.
        // dashboard.page.ts's goToSchedule()). Without this, a plain push
        // left /login sitting in browser/router history underneath
        // /dashboard or /admin. That's invisible for a single continuous
        // session, but the moment the SAME session logs out and back in
        // as a different account (e.g. switching from a member account to
        // a coach account to test both), the stale /login entry becomes
        // reachable again by walking Location.back() -- which is exactly
        // what a plain back button / hardware back press does from any
        // drill-in page (chat, coach profile, transactions). replaceUrl
        // keeps /login from ever persisting in history once login succeeds.
        if (['admin', 'super_admin', 'employee'].includes(user.role)) {
          this.router.navigate(['/admin'], { replaceUrl: true });
        } else {
          this.router.navigate(['/dashboard'], { replaceUrl: true });
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || 'Login failed. Please check your credentials and try again.';
      },
    });
  }

  toggleLoginPassword(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }

  toggleRegisterPassword(): void {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  toggleRegisterConfirm(): void {
    this.showRegisterConfirm = !this.showRegisterConfirm;
  }

  private validateLoginInputs(): boolean {
    const trimmedEmail = this.email.trim().toLowerCase();

    if (!trimmedEmail) {
      this.error = 'Please enter your email.';
      return false;
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      this.error = 'Please enter a valid email address.';
      return false;
    }

    if (!this.password) {
      this.error = 'Please enter your password.';
      return false;
    }

    if (this.password.length > 128) {
      this.error = 'Password is too long.';
      return false;
    }

    return true;
  }

  private isStrongPassword(password: string): boolean {
    if (!password || password.length < 8 || password.length > 128) return false;

    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);

    return hasLower && hasUpper && hasNumber && hasSpecial;
  }

  register(): void {
    this.regError = '';
    this.regLoading = true;

    const fitnessProfile = {
      height: this.reg.height ? Number(this.reg.height) : null,
      weight: this.reg.weight ? Number(this.reg.weight) : null,
      bmi: this.reg.bmi,
      fitness_goal: this.reg.fitness_goal,
      preferred_workout_time: this.reg.preferred_workout_time || '17:00',
    };

    // Pre-cache tailored goal week plan in local storage
    try {
      const tailoredPlan = buildGoalWeekPlan(
        this.reg.fitness_goal,
        this.reg.bmi,
        this.reg.preferred_workout_time
      );
      localStorage.setItem('fordago_week_plan_v1', JSON.stringify(tailoredPlan));
    } catch {
      // Storage unavailable or quota exceeded
    }

    this.auth
      .register(
        this.reg.firstName,
        this.reg.lastName,
        this.reg.email,
        this.reg.password,
        this.reg.phone,
        this.reg.gender,
        this.reg.membership_type,
        this.reg.payment_method,
        fitnessProfile,
        this.reg.dateOfBirth
      )
      .subscribe({
        next: (res: any) => {
          this.regSuccessMembershipType = this.reg.membership_type;
          this.regSuccessPaymentMethod = this.reg.payment_method;
          this.regSuccessPhone = this.reg.phone.trim();
          this.regSuccessSmsSent = Boolean(res?.smsSent);
          this.regSuccessSmsReason = typeof res?.smsReason === 'string' ? res.smsReason : '';
          this.regLoading = false;
          this.regSuccess = true;
          this.resetRegistrationInputs();
        },
        error: (err: any) => {
          this.regLoading = false;
          this.regError = err?.error?.message || 'Registration failed.';
        },
      });
  }
}