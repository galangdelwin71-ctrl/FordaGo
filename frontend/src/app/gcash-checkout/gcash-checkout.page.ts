import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldCheckmark,
  checkmarkCircle,
  arrowBackOutline,
  lockClosedOutline,
  phonePortraitOutline,
  keypadOutline,
  closeOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-gcash-checkout',
  templateUrl: './gcash-checkout.page.html',
  styleUrls: ['./gcash-checkout.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
  providers: [DecimalPipe]
})
export class GcashCheckoutPage implements OnInit {
  // Query parameters
  sessionId = '';
  amount = 0;
  refNumber = '';
  description = 'FordaGO Gym Payment';
  returnUrl = '';
  cancelUrl = '';

  // Form Wizard State: 1 = Phone Input, 2 = OTP Code, 3 = MPIN, 4 = Success Processing
  step: 1 | 2 | 3 | 4 = 1;

  // Step 1: Mobile Number
  phoneNumber = '';
  phoneError = '';

  // Step 2: OTP
  otpDigits: string[] = ['', '', '', '', '', ''];
  otpError = '';
  resendCountdown = 30;
  private timer: any = null;

  // Step 3: MPIN
  mpinDigits: string[] = ['', '', '', ''];
  mpinError = '';
  isProcessingPay = false;

  // Step 4: Success
  redirectCountdown = 2;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private decimalPipe: DecimalPipe,
    private paymentService: PaymentService
  ) {
    addIcons({
      'shield-checkmark': shieldCheckmark,
      'checkmark-circle': checkmarkCircle,
      'arrow-back-outline': arrowBackOutline,
      'lock-closed-outline': lockClosedOutline,
      'phone-portrait-outline': phonePortraitOutline,
      'keypad-outline': keypadOutline,
      'close-outline': closeOutline,
      'checkmark-outline': checkmarkOutline,
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'] || ('cs_mock_' + Date.now());
      this.amount = Number(params['amount'] || 500);
      this.refNumber = params['ref'] || ('FGO-REC-' + Math.floor(100000 + Math.random() * 900000));
      this.description = params['desc'] || params['name'] || 'FordaGO Gym Payment';
      this.returnUrl = params['return_url'] || '';
      this.cancelUrl = params['cancel_url'] || '';
    });
  }

  get maskedPhone(): string {
    const raw = this.phoneNumber.replace(/\D/g, '');
    if (raw.length >= 10) {
      return `+63 ${raw.slice(0, 3)} *** ${raw.slice(-4)}`;
    }
    return '+63 9** *** ****';
  }

  formatAmount(): string {
    return this.decimalPipe.transform(this.amount, '1.2-2') || '0.00';
  }

  getAvailableBalance(): string {
    const bal = Math.max(2850, this.amount + 1750);
    return this.decimalPipe.transform(bal, '1.2-2') || '2,850.00';
  }

  // Step 1: Submit Phone Number
  submitPhone(): void {
    const clean = this.phoneNumber.replace(/\D/g, '');
    if (clean.length < 10) {
      this.phoneError = 'Please enter a valid 11-digit GCash mobile number (e.g., 0917 123 4567)';
      return;
    }
    this.phoneError = '';
    this.step = 2;
    this.startResendTimer();
  }

  // Step 2: Handle OTP input
  onOtpInput(event: any, index: number): void {
    const val = event.target.value.slice(-1);
    this.otpDigits[index] = val;
    this.otpError = '';

    if (val && index < 5) {
      const nextInput = document.getElementById('otp-box-' + (index + 1));
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = document.getElementById('otp-box-' + (index - 1));
      if (prevInput) (prevInput as HTMLInputElement).focus();
    }
  }

  autoFillDemoOtp(): void {
    this.otpDigits = ['1', '2', '3', '4', '5', '6'];
    this.submitOtp();
  }

  submitOtp(): void {
    const code = this.otpDigits.join('');
    if (code.length < 6) {
      this.otpError = 'Please enter all 6 digits of the authentication code';
      return;
    }
    this.otpError = '';
    this.step = 3;
  }

  startResendTimer(): void {
    this.resendCountdown = 30;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.resendCountdown > 0) {
        this.resendCountdown--;
      } else {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  // Step 3: Handle MPIN Input
  appendMpin(digit: number): void {
    const emptyIndex = this.mpinDigits.findIndex(d => d === '');
    if (emptyIndex !== -1) {
      this.mpinDigits[emptyIndex] = String(digit);
      this.mpinError = '';
    }
  }

  backspaceMpin(): void {
    for (let i = this.mpinDigits.length - 1; i >= 0; i--) {
      if (this.mpinDigits[i] !== '') {
        this.mpinDigits[i] = '';
        break;
      }
    }
  }

  // Step 3 -> 4: Submit Payment
  confirmPayment(): void {
    const mpin = this.mpinDigits.join('');
    if (mpin.length < 4) {
      this.mpinError = 'Please enter your 4-digit GCash MPIN';
      return;
    }

    this.isProcessingPay = true;
    this.mpinError = '';

    // Verify session in FordaGO backend
    this.paymentService.verifySession(this.sessionId, this.refNumber).subscribe({
      next: (res) => {
        this.isProcessingPay = false;
        this.step = 4;
        this.startRedirectCountdown();
      },
      error: () => {
        this.isProcessingPay = false;
        this.step = 4;
        this.startRedirectCountdown();
      }
    });
  }

  startRedirectCountdown(): void {
    this.redirectCountdown = 2;
    const interval = setInterval(() => {
      this.redirectCountdown--;
      if (this.redirectCountdown <= 0) {
        clearInterval(interval);
        this.completeRedirect();
      }
    }, 1000);
  }

  completeRedirect(): void {
    if (this.returnUrl) {
      // Add payment=success & ref if not already there
      const sep = this.returnUrl.includes('?') ? '&' : '?';
      let target = this.returnUrl;
      if (!target.includes('payment=success')) {
        target += `${sep}payment=success&ref=${encodeURIComponent(this.refNumber)}&session_id=${encodeURIComponent(this.sessionId)}`;
      }
      window.location.href = target;
    } else {
      this.router.navigate(['/transactions'], {
        queryParams: { payment: 'success', ref: this.refNumber, session_id: this.sessionId },
        replaceUrl: true
      });
    }
  }

  cancelPayment(): void {
    if (this.cancelUrl) {
      window.location.href = this.cancelUrl;
    } else if (this.returnUrl) {
      const sep = this.returnUrl.includes('?') ? '&' : '?';
      window.location.href = `${this.returnUrl}${sep}payment=cancelled&ref=${encodeURIComponent(this.refNumber)}`;
    } else {
      this.router.navigate(['/dashboard'], { replaceUrl: true });
    }
  }
}
