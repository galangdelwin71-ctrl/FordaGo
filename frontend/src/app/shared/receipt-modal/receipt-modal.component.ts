import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  downloadOutline,
  printOutline,
  closeOutline,
  checkmarkCircle,
  phonePortraitOutline,
  walletOutline,
  cashOutline,
  cardOutline,
  shieldCheckmarkOutline,
  receiptOutline
} from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { PaymentService, OfficialReceipt } from '../../services/payment.service';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-receipt-modal',
  standalone: true,
  imports: [CommonModule, IonIcon],
  providers: [DecimalPipe, DatePipe],
  templateUrl: './receipt-modal.component.html',
  styleUrls: ['./receipt-modal.component.scss'],
})
export class ReceiptModalComponent implements OnInit, OnDestroy {
  isOpen = false;
  receipt: OfficialReceipt | null = null;
  private subs = new Subscription();

  constructor(
    public paymentService: PaymentService,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe
  ) {
    addIcons({
      downloadOutline,
      printOutline,
      closeOutline,
      checkmarkCircle,
      phonePortraitOutline,
      walletOutline,
      cashOutline,
      cardOutline,
      shieldCheckmarkOutline,
      receiptOutline
    });
  }

  ngOnInit(): void {
    this.subs.add(
      this.paymentService.isReceiptModalOpen$.subscribe((open) => {
        this.isOpen = open;
      })
    );
    this.subs.add(
      this.paymentService.activeReceipt$.subscribe((rec) => {
        this.receipt = rec;
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  close(): void {
    this.paymentService.closeReceiptModal();
  }

  printReceipt(): void {
    window.print();
  }

  getChannelBadgeClass(channel: string): string {
    const ch = (channel || '').toLowerCase();
    if (ch.includes('gcash')) return 'badge-gcash';
    if (ch.includes('maya')) return 'badge-maya';
    if (ch.includes('card')) return 'badge-card';
    return 'badge-cash';
  }

  getChannelIcon(channel: string): string {
    const ch = (channel || '').toLowerCase();
    if (ch.includes('gcash')) return 'phone-portrait-outline';
    if (ch.includes('maya')) return 'wallet-outline';
    if (ch.includes('card')) return 'card-outline';
    return 'cash-outline';
  }

  downloadPDF(): void {
    if (!this.receipt) return;
    const r = this.receipt;

    // PHP prefix because jsPDF built-in fonts do NOT contain the peso glyph.
    const fmt = (n: number): string =>
      'PHP ' + parseFloat(String(n || 0)).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const PW   = 210;
    const RW   = 82;
    const LM   = (PW - RW) / 2;
    const RM   = LM + RW;
    const CTR  = LM + RW / 2;

    const rawDate = r.transaction_date || r.paid_at || new Date().toISOString();
    const fDate   = this.datePipe.transform(rawDate, 'MM/dd/yy hh:mm a') ?? '';

    // White page background
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, PW, 297, 'F');

    // Off-white receipt paper
    doc.setFillColor(254, 254, 252);
    doc.rect(LM - 3, 6, RW + 6, 286, 'F');
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.25);
    doc.rect(LM - 3, 6, RW + 6, 286, 'S');

    let y = 17;

    const rule = (): void => {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('================================', CTR, y, { align: 'center' });
      y += 3.5;
    };
    const dash = (): void => {
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text('--------------------------------', CTR, y, { align: 'center' });
      y += 3.5;
    };

    // Store header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    doc.text('FORDAGO FITNESS & WELLNESS', CTR, y, { align: 'center' }); y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(50, 50, 50);
    doc.text('SUPPLEMENTS & MERCHANDISE',      CTR, y, { align: 'center' }); y += 4;
    doc.text('Poblacion, Bustos, Bulacan 3007', CTR, y, { align: 'center' }); y += 4;
    doc.text('VAT Reg. TIN: 421-890-332-000',  CTR, y, { align: 'center' }); y += 4;
    doc.text('Tel: (044) 762-1849',             CTR, y, { align: 'center' }); y += 5;

    rule();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(20, 20, 20);
    doc.text('OFFICIAL SALES SLIP', CTR, y, { align: 'center' }); y += 4.5;
    dash();
    y += 1;

    // Meta rows
    const meta = (lbl: string, val: string, bold = false): void => {
      doc.setFont('courier', 'normal'); doc.setFontSize(7.5); doc.setTextColor(80, 80, 80);
      doc.text(lbl, LM + 2, y);
      doc.setFont('courier', bold ? 'bold' : 'normal'); doc.setTextColor(20, 20, 20);
      doc.text(val, RM - 2, y, { align: 'right' });
      y += 4.2;
    };

    meta('RCVD REF :', r.receipt_number || '');
    meta('DATE/TIME:', fDate);
    meta('TERMINAL :', 'POS-SHOP #01');
    meta('CUSTOMER :', r.customer_name || 'Valued Member');
    meta('PAY METH :', (r.payment_channel || 'GCash').toUpperCase() + ' (ONLINE)', true);
    if (r.gateway_ref) meta('ORDER REF :', String(r.gateway_ref).slice(-8));

    y += 1; dash();

    // Items table header
    const X_QTY   = LM + 44;
    const X_PRICE = LM + 63;
    const X_TOTAL = RM - 2;

    doc.setFont('courier', 'bold'); doc.setFontSize(7.5); doc.setTextColor(20, 20, 20);
    doc.text('ITEM DESCRIPTION', LM + 2, y);
    doc.text('QTY',   X_QTY,   y, { align: 'center' });
    doc.text('PRICE', X_PRICE, y, { align: 'right'  });
    doc.text('TOTAL', X_TOTAL, y, { align: 'right'  });
    y += 3.5;
    dash();

    const grandTotal = parseFloat(String(r.grand_total ?? r.total ?? r.total_amount ?? r.amount ?? 0));
    const items = (r.items && r.items.length > 0)
      ? r.items
      : [{ name: r.payment_for || 'Gym Item', quantity: 1,
           price: grandTotal, unit_price: grandTotal, subtotal: grandTotal }];

    for (const item of items) {
      const unitPrice = parseFloat(String(item.price ?? item.unit_price ?? item.amount ?? 0));
      const qty       = item.quantity || 1;
      const lineTotal = parseFloat(String(item.subtotal ?? item.total ?? (unitPrice * qty)));

      // Name on its own full-width line — never bleeds into number columns
      const nameLines = doc.splitTextToSize(item.name || 'Item', RW - 4);
      doc.setFont('courier', 'normal'); doc.setFontSize(7.5); doc.setTextColor(20, 20, 20);
      doc.text(nameLines, LM + 2, y);
      y += nameLines.length * 3.8;

      const priceStr = parseFloat(unitPrice.toString()).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const totalStr = parseFloat(lineTotal.toString()).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

      doc.setFont('courier', 'normal'); doc.setFontSize(7.5); doc.setTextColor(50, 50, 50);
      doc.text(String(qty), X_QTY,   y, { align: 'center' });
      doc.text(priceStr,    X_PRICE, y, { align: 'right'  });
      doc.setFont('courier', 'bold'); doc.setTextColor(20, 20, 20);
      doc.text(totalStr,    X_TOTAL, y, { align: 'right'  });
      y += 5.5;
    }

    dash();

    // Totals
    const subtotal = parseFloat(String(r.subtotal ?? r.amount ?? r.total ?? 0));
    const vatAmt   = (grandTotal * 0.12) / 1.12;
    const fee      = r.fee || 0;

    const tot = (lbl: string, val: string, bold = false): void => {
      doc.setFont('courier', bold ? 'bold' : 'normal');
      doc.setFontSize(bold ? 8 : 7.5);
      doc.setTextColor(20, 20, 20);
      doc.text(lbl, LM + 2, y);
      doc.text(val, RM - 2, y, { align: 'right' });
      y += bold ? 5 : 4.2;
    };

    tot('SUBTOTAL:',            fmt(subtotal));
    if (fee > 0) tot('GATEWAY FEE:', fmt(fee));
    tot('VAT INCLUSIVE (12%):', fmt(vatAmt));
    tot('VAT EXEMPT SALE:',     'PHP 0.00');

    y += 1; rule();
    tot('TOTAL AMOUNT:', fmt(grandTotal), true);
    tot('PAID VIA ' + (r.payment_channel || 'GCASH').toUpperCase() + ':', fmt(grandTotal));
    tot('CHANGE:', 'PHP 0.00');

    y += 1; rule();

    // Payment stamp
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(20, 20, 20);
    doc.text('*** PAYMENT RECEIVED ***', CTR, y, { align: 'center' }); y += 5;
    doc.setFont('courier', 'normal'); doc.setFontSize(7); doc.setTextColor(80, 80, 80);
    doc.text('RECORDED IN ADMIN MONITOR', CTR, y, { align: 'center' }); y += 5;
    rule(); y += 2;

    // Barcode
    const bcX  = CTR - 24;
    const bcH  = 10;
    const bars = [0.6,1.3,0.6,2.0,0.6,1.3,0.6,0.6,2.0,0.6,1.3,0.6,2.0,0.6,0.6,1.3,0.6,1.3,0.6,2.0];
    let bx = bcX;
    doc.setFillColor(0, 0, 0);
    for (let i = 0; i < bars.length; i++) {
      if (i % 2 === 0) doc.rect(bx, y, bars[i], bcH, 'F');
      bx += bars[i] + 0.55;
    }
    y += bcH + 2;
    doc.setFont('courier', 'normal'); doc.setFontSize(6.5); doc.setTextColor(20, 20, 20);
    doc.text('*' + (r.receipt_number || '') + '*', CTR, y, { align: 'center' }); y += 6;

    dash(); y += 1;

    // Footer
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(20, 20, 20);
    doc.text('THIS SERVES AS YOUR OFFICIAL RECEIPT', CTR, y, { align: 'center' }); y += 4.5;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(70, 70, 70);
    doc.text('BIR Registered under R.A. No. 8792 (E-Commerce Act)', CTR, y, { align: 'center' }); y += 4;
    doc.text('Thank you for training with FordaGO!', CTR, y, { align: 'center' });

    doc.save(`FordaGO_Receipt_${r.receipt_number}.pdf`);
  }
}
