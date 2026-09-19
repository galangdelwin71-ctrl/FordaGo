// transactions.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonBackButton,
  IonContent,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_URL } from '../config/api.config';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonBackButton,
    IonContent,
    IonSpinner,
    IonIcon,
  ],
  providers: [DecimalPipe, DatePipe],
})
export class TransactionsPage implements OnInit {
  private api = API_URL;

  period: 'all' | 'daily' | 'weekly' | 'monthly' = 'all';
  transactions: any[] = [];
  isLoading = false;

  get totalSpent() {
    return this.transactions.reduce((s, t) => s + Number(t.amount || 0), 0);
  }
  get attendanceCount() {
    return this.transactions.filter(t => t.source === 'attendance').length;
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    public router: Router,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
  ) {}

  ngOnInit() { this.load(); }

  setPeriod(p: typeof this.period) {
    this.period = p;
    this.load();
  }

  private get currentUser(): any {
    if (this.auth.user) return this.auth.user;
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }

  load() {
    const token = this.auth.token;
    if (!token) return;
    this.isLoading = true;
    this.http
      .get<any[]>(`${this.api}/reports/my-transactions?period=${this.period}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .subscribe({
        next: data => {
          this.transactions = this.enrichWithMembership(data || []);
          this.isLoading = false;
        },
        error: () => {
          this.transactions = this.enrichWithMembership([]);
          this.isLoading = false;
        },
      });
  }

  private matchesPeriod(d: Date, period: string): boolean {
    if (period === 'all') return true;
    const now = new Date();
    if (period === 'daily') {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    }
    if (period === 'weekly') {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7;
      startOfWeek.setHours(0, 0, 0, 0);
      startOfWeek.setDate(startOfWeek.getDate() - day + 1);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 7);
      return d >= startOfWeek && d < endOfWeek;
    }
    if (period === 'monthly') {
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth()
      );
    }
    return true;
  }

  private enrichWithMembership(list: any[]): any[] {
    const user = this.currentUser;
    const isPremium = (user?.membership_type || '').toLowerCase() === 'premium';
    const hasMembershipTx = list.some(
      t =>
        t.source === 'membership' ||
        (t.type_label || '').toLowerCase().includes('premium membership')
    );

    if (isPremium && !hasMembershipTx) {
      const txDate = user.created_at ? new Date(user.created_at) : new Date();
      if (this.matchesPeriod(txDate, this.period)) {
        list = [
          ...list,
          {
            id: `membership_${user.id || 'me'}`,
            source: 'membership',
            transaction_date: txDate.toISOString(),
            sub_type: 'premium',
            payment_status: 'paid',
            amount: 500.0,
            type_label: 'Premium Membership Plan',
            product_name: '1-Month Premium Access',
            quantity: 1,
            payment_method: user.payment_method || 'cash',
          },
        ];
      }
    }

    return list
      .map(row => ({
        ...row,
        amount: Number(row.amount || 0),
      }))
      .sort(
        (a, b) =>
          new Date(b.transaction_date).getTime() -
          new Date(a.transaction_date).getTime()
      );
  }

  getIcon(tx: any): string {
    if (tx.source === 'order') return 'cart-outline';
    if (tx.source === 'membership') return 'ribbon-outline';
    return tx.sub_type === 'daily' ? 'walk-outline' : 'star-outline';
  }

  getIconClass(tx: any): string {
    if (tx.source === 'order') return 'icon-shop';
    if (tx.source === 'membership') return 'icon-premium';
    return tx.sub_type === 'daily' ? 'icon-daily' : 'icon-premium';
  }

  getStatusKey(tx: any): string {
    const s = (tx.payment_status || tx.sub_type || '').toLowerCase();
    if (s === 'paid' || s === 'approved') return 'paid';
    if (s === 'pending') return 'pending';
    if (s === 'rejected') return 'rejected';
    return 'neutral';
  }

  getStatusLabel(tx: any): string {
    const key = this.getStatusKey(tx);
    const map: Record<string, string> = { paid: 'Paid', approved: 'Approved', pending: 'Pending', rejected: 'Rejected', neutral: '—' };
    return map[key] ?? key;
  }

  downloadPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const periodLabel: Record<string, string> = {
      all: 'All Time', daily: 'Today', weekly: 'This Week', monthly: 'This Month'
    };
    const genTime = this.datePipe.transform(new Date(), 'MMM d, yyyy h:mm a') ?? '';

    const rows = this.transactions.map((tx, index) => [
      index + 1,
      this.datePipe.transform(tx.transaction_date, 'MMM d, yyyy h:mm a') ?? '',
      tx.type_label,
      tx.product_name || (tx.source === 'attendance' ? 'Gym Check-in Access' : (tx.source === 'membership' ? '1-Month Premium Pass' : '—')),
      tx.amount > 0 ? `PHP ${this.decimalPipe.transform(tx.amount, '1.2-2')}` : 'Included in Plan',
      this.getStatusLabel(tx).toUpperCase(),
    ]);

    autoTable(doc, {
      startY: 44,
      margin: { top: 44, bottom: 22, left: 14, right: 14 },
      head: [[
        { content: 'MEMBER TRANSACTION & PAYMENT STATEMENT', colSpan: 6, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } },
      ], ['#', 'Date & Time', 'Transaction Category', 'Description / Item', 'Amount', 'Payment Status']],
      body: rows.length ? rows : [['-', '-', 'No transactions logged for this period', '-', '-', '-']],
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 7.5, cellPadding: 2.2 },
    });

    const pageCount = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : ((doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      if (i === 1) {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 24, 'F');
        doc.setFillColor(234, 179, 8);
        doc.rect(0, 24, 210, 2, 'F');

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(234, 179, 8);
        doc.text('FORDAGO FITNESS & WELLNESS CLUB', 14, 11);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(226, 232, 240);
        doc.text('MEMBER ACCOUNT STATEMENT • OFFICIAL PAYMENT HISTORY', 14, 18);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('TRANSACTION LEDGER', 196, 11, { align: 'right' });

        doc.setFontSize(7);
        doc.setTextColor(203, 213, 225);
        doc.text(`CONFIDENTIAL • MEMBER REF`, 196, 18, { align: 'right' });

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.rect(14, 28, 182, 12, 'FD');

        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text(`Member Account: ${user.username || 'Valued Member'}`, 17, 33);
        doc.text(`Period Scope: ${periodLabel[this.period]}`, 75, 33);
        doc.text(`Total Spent: PHP ${this.decimalPipe.transform(this.totalSpent, '1.2-2')}`, 135, 33);

        doc.text(`Generated: ${genTime}`, 17, 37.5);
        doc.text(`Visits: ${this.attendanceCount} check-ins`, 75, 37.5);
        doc.text(`Transactions Count: ${this.transactions.length} records`, 135, 37.5);
      } else {
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 10, 'F');
        doc.setFillColor(234, 179, 8);
        doc.rect(0, 10, 210, 1, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('FordaGO Fitness — Member Statement', 14, 7);
        doc.setFontSize(7);
        doc.setTextColor(203, 213, 225);
        doc.text(`Page ${i} of ${pageCount}`, 196, 7, { align: 'right' });
      }

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(14, 285, 196, 285);
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('FordaGO Fitness & Wellness Club • Official Electronic Account Ledger', 14, 289.5);
      doc.text(`Page ${i} of ${pageCount}`, 196, 289.5, { align: 'right' });
    }

    doc.save(`fordago-transactions-${this.period}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}