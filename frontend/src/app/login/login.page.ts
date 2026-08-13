import { Component, HostListener } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { NoNegativeDirective } from '../directives/no-negative.directive';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  arrowForwardOutline,
  barbellOutline,
  calendarOutline,
  callOutline,
  cardOutline,
  cashOutline,
  chatbubbleEllipsesOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  chevronBackOutline,
  chevronDownOutline,
  chevronForwardOutline,
  diamondOutline,
  eyeOffOutline,
  eyeOutline,
  informationCircleOutline,
  keyOutline,
  keypadOutline,
  lockClosedOutline,
  mailOutline,
  peopleOutline,
  personAddOutline,
  personOutline,
  phonePortraitOutline,
  searchOutline,
  sendOutline,
  shieldCheckmarkOutline,
  timeOutline,
} from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner, NoNegativeDirective],
})
export class LoginPage {
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

  // Registration fields
  reg = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    password: '',
    confirm: '',
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
  fpStep: 1 | 2 | 3 | 4 | 5 = 1;
  fpIdentifier = '';
  fpEmailMasked = '';
  fpHasPhone = false;
  fpPhoneMasked = '';
  fpChannel: 'email' | 'sms' | '' = '';
  fpCode = '';
  fpResetToken = '';
  fpNewPassword = '';
  fpConfirmPassword = '';
  fpShowPassword = false;
  fpShowConfirm = false;
  fpError = '';
  fpLoading = false;
  fpSentMessage = '';

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
      'checkmark-circle-outline': checkmarkCircleOutline,
      'checkmark-outline': checkmarkOutline,
      'chevron-back-outline': chevronBackOutline,
      'chevron-down-outline': chevronDownOutline,
      'chevron-forward-outline': chevronForwardOutline,
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
      'search-outline': searchOutline,
      'send-outline': sendOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'time-outline': timeOutline,
    });
  }

  @HostListener('document:click')
  closeGenderDropdown(): void {
    this.genderOpen = false;
  }

  toggleGenderDropdown(event?: Event): void {
    event?.stopPropagation();
    this.genderOpen = !this.genderOpen;
  }

  selectGender(value: string): void {
    this.reg.gender = value;
    this.genderOpen = false;
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
      password: '',
      confirm: '',
      membership_type: 'premium' as 'daily' | 'premium',
      payment_method: 'cash' as '' | 'cash' | 'gcash',
    };
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
    this.segment = 'login';
    this.genderOpen = false;
    this.resetLoginInputs();
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
    this.genderOpen = false;
    this.segment = 'forgot';
  }

  private resetForgotPasswordInputs(): void {
    this.fpStep = 1;
    this.fpIdentifier = '';
    this.fpEmailMasked = '';
    this.fpHasPhone = false;
    this.fpPhoneMasked = '';
    this.fpChannel = '';
    this.fpCode = '';
    this.fpResetToken = '';
    this.fpNewPassword = '';
    this.fpConfirmPassword = '';
    this.fpShowPassword = false;
    this.fpShowConfirm = false;
    this.fpError = '';
    this.fpLoading = false;
    this.fpSentMessage = '';
  }

  fpLookupEmail(): void {
    this.fpError = '';
    const raw = this.fpIdentifier.trim();
    const normalized = raw.includes('@') ? raw.toLowerCase() : raw.replace(/\D/g, '');
    const validEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalized);
    const validPhone = /^\d{11}$/.test(normalized);

    if (!validEmail && !validPhone) {
      this.fpError = 'Please enter a valid email or 11-digit phone number.';
      return;
    }

    this.fpIdentifier = normalized;
    this.fpLoading = true;

    this.auth.forgotPasswordLookup(normalized).subscribe({
      next: (res: any) => {
        this.fpLoading = false;
        this.fpEmailMasked = res?.emailMasked || '';
        this.fpHasPhone = Boolean(res?.hasPhone);
        this.fpPhoneMasked = res?.phoneMasked || '';
        this.fpChannel = 'email';
        this.fpStep = 2;
      },
      error: (err: any) => {
        this.fpLoading = false;
        this.fpError = err?.error?.message || 'Could not find that account.';
      },
    });
  }

  fpChooseChannel(channel: 'email' | 'sms'): void {
    this.fpChannel = channel;
  }

  fpSendCode(): void {
    this.fpError = '';

    if (!this.fpChannel) {
      this.fpError = 'Please choose where to receive your code.';
      return;
    }

    this.fpLoading = true;

    this.auth.forgotPasswordSend(this.fpIdentifier, this.fpChannel).subscribe({
      next: (res: any) => {
        this.fpLoading = false;

        if (res?.sent) {
          this.fpSentMessage = `Code sent to ${
            res.destinationMasked ||
            (this.fpChannel === 'email' ? this.fpEmailMasked : this.fpPhoneMasked)
          }.`;
          this.fpStep = 3;
        } else if (res?.devCode) {
          this.fpSentMessage = `Demo mode. Your reset code is ${res.devCode}.`;
          this.fpCode = res.devCode;
          this.fpStep = 3;
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

  fpVerifyCode(): void {
    this.fpError = '';
    const code = this.fpCode.trim();

    if (!/^\d{6}$/.test(code)) {
      this.fpError = 'Please enter the 6-digit code.';
      return;
    }

    this.fpLoading = true;

    this.auth.forgotPasswordVerify(this.fpIdentifier, code).subscribe({
      next: (res: any) => {
        this.fpLoading = false;
        this.fpResetToken = res?.resetToken || '';
        this.fpStep = 4;
      },
      error: (err: any) => {
        this.fpLoading = false;
        this.fpError = err?.error?.message || 'Invalid or expired code.';
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

    if (!this.isStrongPassword(this.fpNewPassword)) {
      this.fpError = 'Password must be 8+ chars with uppercase, lowercase, number, and special character.';
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
      if (!this.reg.membership_type) {
        this.regError = 'Please select a membership plan.';
        return;
      }

      if (this.reg.membership_type === 'premium' && !this.reg.payment_method) {
        this.regError = 'Please select a payment method for Premium.';
        return;
      }

      this.regStep = 3;
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

        if (['admin', 'super_admin', 'employee'].includes(user.role)) {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/dashboard']);
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

    this.auth
      .register(
        this.reg.firstName,
        this.reg.lastName,
        this.reg.email,
        this.reg.password,
        this.reg.phone,
        this.reg.gender,
        this.reg.membership_type,
        this.reg.payment_method
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