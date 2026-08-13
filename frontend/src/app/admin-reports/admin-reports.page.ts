// admin-reports.page.ts
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
import { API_BASE_URL } from '../config/api.config';

type Tab    = 'transactions' | 'attendance' | 'sales' | 'inventory';
type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

@Component({
  selector: 'app-admin-reports',
  templateUrl: './admin-reports.page.html',
  styleUrls: ['./admin-reports.page.scss'],
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
export class AdminReportsPage implements OnInit {
  private api = API_BASE_URL;

  activeTab: Tab   = 'transactions';
  period:    Period = 'monthly';
  isLoading = false;

  // Transactions
  txRows: any[] = [];
  get txTotal()     { return this.txRows.reduce((s, t) => s + Number(t.amount || 0), 0); }
  get txGymCount()  { return this.txRows.filter(t => t.source === 'attendance').length; }
  get txShopCount() { return this.txRows.filter(t => t.source === 'order').length; }

  // Attendance
  attRows:    any[] = [];
  attSummary: any  = null;

  // Sales
  attSalesRows:  any[] = [];
  shopSalesRows: any[] = [];
  salesSummary:  any  = null;

  // Inventory
  invRows:    any[] = [];
  invSummary: any  = null;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    public router: Router,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
  ) {}

  ngOnInit() { this.load(); }

  setTab(tab: Tab) {
    this.activeTab = tab;
    // Reset period when switching to inventory (no period filter)
    if (tab === 'inventory') {
      // inventory has no period filter, just load
    } else if (tab === 'sales' && this.period === 'all') {
      this.period = 'monthly';
    }
    this.load();
  }

  setPeriod(p: Period) {
    this.period = p;
    this.load();
  }

  private headers() {
    return { Authorization: `Bearer ${this.auth.token}` };
  }

  load() {
    this.isLoading = true;
    const h = { headers: this.headers() };
    const p = this.period;

    if (this.activeTab === 'transactions') {
      this.http.get<any[]>(`${this.api}/reports/admin/transactions?period=${p}`, h).subscribe({
        next: data => { this.txRows = data; this.isLoading = false; },
        error: ()  => { this.isLoading = false; },
      });

    } else if (this.activeTab === 'attendance') {
      const ap = p === 'all' || p === 'yearly' ? 'monthly' : p;
      this.http.get<any>(`${this.api}/reports/admin/attendance?period=${ap}`, h).subscribe({
        next: data => { this.attRows = data.rows; this.attSummary = data.summary; this.isLoading = false; },
        error: ()  => { this.isLoading = false; },
      });

    } else if (this.activeTab === 'sales') {
      this.http.get<any>(`${this.api}/reports/admin/sales?period=${p}`, h).subscribe({
        next: data => {
          this.attSalesRows  = data.attendanceSales;
          this.shopSalesRows = data.shopSales;
          this.salesSummary  = data.summary;
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; },
      });

    } else if (this.activeTab === 'inventory') {
      this.http.get<any>(`${this.api}/reports/admin/inventory`, h).subscribe({
        next: data => { this.invRows = data.rows; this.invSummary = data.summary; this.isLoading = false; },
        error: ()  => { this.isLoading = false; },
      });
    }
  }

  // ── Icon helpers ──────────────────────────────────────
  getTxIcon(tx: any): string {
    if (tx.source === 'order') return 'cart-outline';
    return tx.sub_type === 'daily' ? 'walk-outline' : 'star-outline';
  }

  getTxIconClass(tx: any): string {
    if (tx.source === 'order') return 'icon-shop';
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

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  // ── Print ─────────────────────────────────────────────
  printCurrent() {
    window.print();
  }

  // ── PDF download ──────────────────────────────────────
  downloadPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const periodLabel: Record<string, string> = {
      daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', all: 'All Time',
    };
    const tabLabel: Record<string, string> = {
      transactions: 'Transaction Report', attendance: 'Attendance Log',
      sales: 'Sales Report', inventory: 'Inventory Summary',
    };

    doc.setFontSize(18);
    doc.setTextColor(255, 214, 0);
    doc.text('FordaGO Gym — Admin Report', 14, 18);
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`${tabLabel[this.activeTab]}  |  Period: ${periodLabel[this.period] ?? '—'}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 33);

    let startY = 42;

    if (this.activeTab === 'transactions') {
      doc.setFontSize(10);
      doc.setTextColor(40);
      doc.text(`Total Records: ${this.txRows.length}   |   Total Revenue: ₱${this.decimalPipe.transform(this.txTotal, '1.2-2')}`, 14, startY - 4);

      autoTable(doc, {
        startY,
        head: [['Date & Time', 'Member', 'Type', 'Details', 'Amount', 'Status']],
        body: this.txRows.map(tx => [
          this.datePipe.transform(tx.transaction_date, 'MMM d, yyyy HH:mm') ?? '',
          tx.username,
          tx.type_label,
          tx.product_name || (tx.source === 'attendance' ? 'Gym Check-in' : '—'),
          tx.amount > 0 ? `₱${this.decimalPipe.transform(tx.amount, '1.2-2')}` : 'Premium',
          this.getStatusLabel(tx),
        ]),
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 214, 0], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

    } else if (this.activeTab === 'attendance') {
      if (this.attSummary) {
        doc.setFontSize(10); doc.setTextColor(40);
        doc.text(`Total: ${this.attSummary.total}  |  Daily: ${this.attSummary.daily}  |  Premium: ${this.attSummary.premium}  |  Revenue: ₱${this.decimalPipe.transform(this.attSummary.totalRevenue, '1.2-2')}`, 14, startY - 4);
      }
      autoTable(doc, {
        startY,
        head: [['Check-in Time', 'Member', 'Email', 'Type', 'Amount', 'Status']],
        body: this.attRows.map(r => [
          this.datePipe.transform(r.check_in_time, 'MMM d, yyyy HH:mm') ?? '',
          r.username, r.email,
          r.membership_type === 'daily' ? 'Daily Pass' : 'Premium',
          r.membership_type === 'daily' ? '₱40.00' : 'Included',
          r.payment_status,
        ]),
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 214, 0], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });

    } else if (this.activeTab === 'sales') {
      if (this.salesSummary) {
        doc.setFontSize(10); doc.setTextColor(40);
        doc.text(`Total Revenue: ₱${this.decimalPipe.transform(this.salesSummary.totalRevenue, '1.2-2')}  |  Gym: ₱${this.decimalPipe.transform(this.salesSummary.gymRevenue, '1.2-2')}  |  Shop: ₱${this.decimalPipe.transform(this.salesSummary.shopRevenue, '1.2-2')}`, 14, startY - 4);
      }
      doc.setFontSize(11); doc.setTextColor(30); doc.text('Gym Attendance Revenue', 14, startY + 2);
      autoTable(doc, {
        startY: startY + 6,
        head: [['Date', 'Check-ins', 'Revenue']],
        body: this.attSalesRows.map(r => [
          this.datePipe.transform(r.sale_date, 'MMM d, yyyy') ?? '',
          r.count,
          `₱${this.decimalPipe.transform(r.revenue, '1.2-2')}`,
        ]),
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 214, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2.5 },
      });
      const afterFirst = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(11); doc.setTextColor(30); doc.text('Shop / Inventory Sales', 14, afterFirst);
      autoTable(doc, {
        startY: afterFirst + 4,
        head: [['Date', 'Orders', 'Revenue']],
        body: this.shopSalesRows.map(r => [
          this.datePipe.transform(r.sale_date, 'MMM d, yyyy') ?? '',
          r.count,
          `₱${this.decimalPipe.transform(r.revenue, '1.2-2')}`,
        ]),
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 214, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 2.5 },
      });

    } else if (this.activeTab === 'inventory') {
      if (this.invSummary) {
        doc.setFontSize(10); doc.setTextColor(40);
        doc.text(`Products: ${this.invRows.length}  |  Total Sold: ${this.invSummary.totalSold}  |  Total Stock: ${this.invSummary.totalStock}  |  Revenue: ₱${this.decimalPipe.transform(this.invSummary.totalRevenue, '1.2-2')}`, 14, startY - 4);
      }
      autoTable(doc, {
        startY,
        head: [['Product', 'Brand', 'Price', 'Current Stock', 'Total Sold', 'Revenue']],
        body: this.invRows.map(r => [
          r.name, r.brand || '—',
          `₱${this.decimalPipe.transform(r.price, '1.2-2')}`,
          r.current_stock, r.total_sold,
          `₱${this.decimalPipe.transform(r.total_revenue, '1.2-2')}`,
        ]),
        headStyles: { fillColor: [20, 20, 20], textColor: [255, 214, 0], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 248, 248] },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    }

    // Footer
    const pages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8); doc.setTextColor(150);
      doc.text(`FordaGO Gym — Admin ${tabLabel[this.activeTab]}  |  Page ${i} of ${pages}`, 14, doc.internal.pageSize.height - 8);
    }

    const filename = `fordago-admin-${this.activeTab}-${this.period}-${Date.now()}.pdf`;
    doc.save(filename);
  }
}