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

    doc.setFontSize(18);
    doc.setTextColor(255, 214, 0);
    doc.text('FordaGO Gym', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Transaction History — ${periodLabel[this.period]}`, 14, 26);
    doc.text(`Member: ${user.username || 'N/A'}`, 14, 32);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 38);

    // Summary line
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`Total Transactions: ${this.transactions.length}   |   Total Spent: ₱${this.decimalPipe.transform(this.totalSpent, '1.2-2')}   |   Gym Visits: ${this.attendanceCount}`, 14, 46);

    const rows = this.transactions.map(tx => [
      this.datePipe.transform(tx.transaction_date, 'MMM d, yyyy HH:mm') ?? '',
      tx.type_label,
      tx.product_name || (tx.source === 'attendance' ? 'Gym Check-in' : (tx.source === 'membership' ? '1-Month Premium Pass' : '—')),
      tx.amount > 0 ? `₱${this.decimalPipe.transform(tx.amount, '1.2-2')}` : 'Included',
      this.getStatusLabel(tx),
    ]);

    autoTable(doc, {
      startY: 52,
      head: [['Date & Time', 'Type', 'Details', 'Amount', 'Status']],
      body: rows,
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 214, 0], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      styles: { fontSize: 9, cellPadding: 3 },
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`FordaGO Gym — Transaction Report  |  Page ${i} of ${pageCount}`, 14, doc.internal.pageSize.height - 8);
    }

    doc.save(`fordago-transactions-${this.period}-${Date.now()}.pdf`);
  }
}