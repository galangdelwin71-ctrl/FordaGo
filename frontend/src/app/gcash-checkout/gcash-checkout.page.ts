import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldCheckmark,
  checkmarkCircle,
  arrowBackOutline,
  arrowBackCircleOutline,
  arrowForwardOutline,
  lockClosedOutline,
  phonePortraitOutline,
  keypadOutline,
  closeOutline,
  checkmarkOutline,
  openOutline,
  chevronForwardOutline,
  radioButtonOnOutline
} from 'ionicons/icons';
import QRCode from 'qrcode';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-gcash-checkout',
  templateUrl: './gcash-checkout.page.html',
  styleUrls: ['./gcash-checkout.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonSpinner],
  providers: [DecimalPipe]
})
export class GcashCheckoutPage implements OnInit, OnDestroy {
  // Query parameters
  sessionId = '';
  amount = 0;
  refNumber = '';
  description = 'FordaGO Gym Shop Order';
  returnUrl = '';
  cancelUrl = '';

  // Wizard state: 1 = Scan QR / Open in GCash, 2 = Confirm Payment, 3 = Payment Successful
  step: 1 | 2 | 3 = 2;

  // QR Code
  qrDataUrl = '';
  isProcessingPay = false;
  redirectCountdown = 6;
  private redirectTimer: any = null;

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
      'arrow-forward-outline': arrowForwardOutline,
      'lock-closed-outline': lockClosedOutline,
      'phone-portrait-outline': phonePortraitOutline,
      'keypad-outline': keypadOutline,
      'close-outline': closeOutline,
      'checkmark-outline': checkmarkOutline,
      'open-outline': openOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'radio-button-on-outline': radioButtonOnOutline,
      'arrow-back-circle-outline': arrowBackCircleOutline,
    });
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session_id'] || ('cs_mock_' + Date.now());
      this.amount = Number(params['amount'] || 15);
      this.refNumber = params['ref'] || ('FGO-REC-' + Math.floor(100000 + Math.random() * 900000));
      this.description = params['desc'] || params['name'] || 'FordaGO Fitness & Wellness';
      this.returnUrl = params['return_url'] || '';
      this.cancelUrl = params['cancel_url'] || '';

      this.generateQrCode();
    });
  }

  formatAmount(): string {
    return this.decimalPipe.transform(this.amount, '1.2-2') || '0.00';
  }

  getAvailableBalance(): string {
    const bal = Math.max(2850, this.amount + 1250);
    return this.decimalPipe.transform(bal, '1.2-2') || '2,850.00';
  }

  getCurrentDateTime(): string {
    return new Date().toLocaleString('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  // Deep-link to open installed GCash app on phone
  openRealGcashApp(): void {
    try {
      window.location.href = 'gcash://';
    } catch {
      window.open('gcash://', '_system');
    }
  }

  async generateQrCode(): Promise<void> {
    try {
      const payload = `gcash://pay?merchant=FordaGO&ref=${encodeURIComponent(this.refNumber)}&amount=${encodeURIComponent(this.amount)}`;
      this.qrDataUrl = await QRCode.toDataURL(payload, {
        width: 260,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
    } catch (err) {
      console.error('Error generating QR code:', err);
    }
  }

  goToConfirm(): void {
    this.step = 2;
  }

  confirmPayment(): void {
    this.isProcessingPay = true;

    // Verify session and record payment in FordaGO backend
    this.paymentService.verifySession(this.sessionId, this.refNumber).subscribe({
      next: () => {
        this.isProcessingPay = false;
        this.step = 3;
      },
      error: () => {
        this.isProcessingPay = false;
        this.step = 3;
      }
    });
  }

  returnToApp(): void {
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
      this.redirectTimer = null;
    }

    // Persist order snapshot & explicit payment confirmed flag so app displays in-app confirmation modal immediately
    try {
      localStorage.setItem('fordago_payment_confirmed', 'true');
      localStorage.setItem('fordago_last_order', JSON.stringify({
        total: this.amount,
        payment: 'gcash',
        receiptNumber: this.refNumber,
        sessionId: this.sessionId,
        description: this.description
      }));
    } catch {}

    this.completeRedirect();
  }

  completeRedirect(): void {
    let targetPath = '/inventory';
    if (this.returnUrl) {
      try {
        if (this.returnUrl.startsWith('http')) {
          targetPath = new URL(this.returnUrl).pathname;
        } else {
          targetPath = this.returnUrl.split('?')[0];
        }
      } catch {
        targetPath = '/inventory';
      }
    }
    targetPath = targetPath || '/inventory';

    // Pure in-app Angular router navigation — always stays inside the APK!
    this.router.navigate([targetPath], {
      queryParams: { payment: 'success', ref: this.refNumber, session_id: this.sessionId },
      replaceUrl: true
    });
  }

  cancelPayment(): void {
    let targetPath = '/inventory';
    if (this.returnUrl) {
      try {
        if (this.returnUrl.startsWith('http')) {
          targetPath = new URL(this.returnUrl).pathname;
        } else {
          targetPath = this.returnUrl.split('?')[0];
        }
      } catch {
        targetPath = '/inventory';
      }
    }
    targetPath = targetPath || '/inventory';

    this.router.navigate([targetPath], {
      queryParams: { payment: 'cancelled', ref: this.refNumber },
      replaceUrl: true
    });
  }
}
