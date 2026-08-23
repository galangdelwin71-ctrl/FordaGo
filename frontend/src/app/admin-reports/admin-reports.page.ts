// admin-reports.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonSpinner,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  refreshOutline,
  printOutline,
  downloadOutline,
  documentTextOutline,
  pieChartOutline,
  sparklesOutline,
  receiptOutline,
  peopleOutline,
  trendingUpOutline,
  cubeOutline,
  searchOutline,
  calendarOutline,
  cashOutline,
  timeOutline,
  barChartOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  fitnessOutline,
  cartOutline,
  walletOutline,
  cardOutline,
  flashOutline,
  chevronForwardOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_URL } from '../config/api.config';
import { getCachedData, setCachedData } from '../utils/local-cache.util';
import { CACHE_KEYS } from '../utils/cache-keys';

export type Tab = 'overview' | 'memberships' | 'transactions' | 'attendance' | 'sales' | 'inventory';
export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface AdminReportsCache {
  overview?: Record<string, {
    txRows: any[];
    attRows: any[];
    attSummary: any;
    attSalesRows: any[];
    shopSalesRows: any[];
    membershipSalesRows: any[];
    salesSummary: any;
    invRows: any[];
    invSummary: any;
    membershipRows: any[];
    membershipSummary: any;
  }>;
  memberships?: {
    rows: any[];
    summary: any;
  };
  transactions?: Record<string, any[]>;
  attendance?: Record<string, {
    rows: any[];
    summary: any;
  }>;
  sales?: Record<string, {
    attSalesRows: any[];
    shopSalesRows: any[];
    membershipSalesRows: any[];
    salesSummary: any;
  }>;
  inventory?: {
    rows: any[];
    summary: any;
  };
}

import { PullToRefreshComponent } from '../shared/pull-to-refresh/pull-to-refresh.component';

@Component({
  selector: 'app-admin-reports',
  templateUrl: './admin-reports.page.html',
  styleUrls: ['./admin-reports.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonSpinner,
    IonIcon,
    PullToRefreshComponent,
  ],
  providers: [DecimalPipe, DatePipe],
})
export class AdminReportsPage implements OnInit {
  handleRefresh(event: any): void {
    try {
      this.load();
    } finally {
      setTimeout(() => {
        event?.target?.complete?.();
      }, 700);
    }
  }

  private api = API_URL;

  // ── Local-First Stale-While-Revalidate In-Memory & Storage Cache ──
  private static cache: AdminReportsCache = {};

  activeTab: Tab = 'overview';
  period: Period = 'monthly';
  isLoading = false;

  // Search and Sub-filters
  searchQuery = '';
  sourceFilter: 'all' | 'membership' | 'attendance' | 'order' = 'all';
  statusFilter: 'all' | 'paid' | 'pending' | 'rejected' = 'all';
  membershipFilter: 'all' | 'premium' | 'coach' | 'daily' | 'expiring' | 'pending' = 'all';

  // ── Memberships ───────────────────────────────────────
  membershipRows: any[] = [];
  membershipSummary: any = null;

  get filteredMembershipRows(): any[] {
    return this.membershipRows.filter(m => {
      // Sub filter
      if (this.membershipFilter === 'premium') {
        if (m.membership_type !== 'premium' || m.account_type === 'coach') return false;
      } else if (this.membershipFilter === 'coach') {
        if (m.account_type !== 'coach' && m.membership_type !== 'coach') return false;
      } else if (this.membershipFilter === 'daily') {
        if (m.membership_type !== 'daily' || m.account_type === 'coach') return false;
      } else if (this.membershipFilter === 'expiring') {
        if (!m.is_expiring_soon) return false;
      } else if (this.membershipFilter === 'pending') {
        if (m.membership_status !== 'pending') return false;
      }

      // Search query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const name = (m.username || '').toLowerCase();
        const email = (m.email || '').toLowerCase();
        const phone = (m.phone || '').toLowerCase();
        const plan = (m.membership_type || '').toLowerCase();
        const specialty = (m.coach_specialty || '').toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || plan.includes(q) || specialty.includes(q);
      }
      return true;
    });
  }

  // ── Transactions ──────────────────────────────────────
  txRows: any[] = [];
  get filteredTxRows(): any[] {
    return this.txRows.filter(tx => {
      // Source filter
      if (this.sourceFilter !== 'all' && tx.source !== this.sourceFilter) return false;
      // Status filter
      if (this.statusFilter !== 'all') {
        const key = this.getStatusKey(tx);
        if (key !== this.statusFilter) return false;
      }
      // Search query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const name = (tx.username || '').toLowerCase();
        const email = (tx.email || '').toLowerCase();
        const prod = (tx.product_name || '').toLowerCase();
        const type = (tx.type_label || '').toLowerCase();
        return name.includes(q) || email.includes(q) || prod.includes(q) || type.includes(q);
      }
      return true;
    });
  }

  // Financial calculations
  get txCollectedRevenue(): number {
    return this.txRows
      .filter(t => {
        const s = (t.payment_status || t.sub_type || '').toLowerCase();
        return s === 'paid' || s === 'approved' || s === 'completed';
      })
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }

  get txPendingRevenue(): number {
    return this.txRows
      .filter(t => (t.payment_status || t.sub_type || '').toLowerCase() === 'pending')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }

  get txTotalVolume(): number {
    return this.txRows.reduce((s, t) => s + Number(t.amount || 0), 0);
  }

  get txMembershipCount(): number {
    return this.txRows.filter(t => t.source === 'membership').length;
  }

  get txGymCount(): number {
    return this.txRows.filter(t => t.source === 'attendance').length;
  }

  get txShopCount(): number {
    return this.txRows.filter(t => t.source === 'order').length;
  }

  // ── Attendance ────────────────────────────────────────
  attRows: any[] = [];
  attSummary: any = null;
  get filteredAttRows(): any[] {
    if (!this.searchQuery.trim()) return this.attRows;
    const q = this.searchQuery.toLowerCase();
    return this.attRows.filter(r => {
      const name = (r.username || '').toLowerCase();
      const email = (r.email || '').toLowerCase();
      const plan = (r.membership_type || '').toLowerCase();
      return name.includes(q) || email.includes(q) || plan.includes(q);
    });
  }

  // ── Sales ─────────────────────────────────────────────
  attSalesRows: any[] = [];
  shopSalesRows: any[] = [];
  membershipSalesRows: any[] = [];
  salesSummary: any = null;

  // ── Inventory ─────────────────────────────────────────
  invRows: any[] = [];
  invSummary: any = null;
  get filteredInvRows(): any[] {
    if (!this.searchQuery.trim()) return this.invRows;
    const q = this.searchQuery.toLowerCase();
    return this.invRows.filter(item => {
      const name = (item.name || '').toLowerCase();
      const brand = (item.brand || '').toLowerCase();
      return name.includes(q) || brand.includes(q);
    });
  }

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    public router: Router,
    private decimalPipe: DecimalPipe,
    private datePipe: DatePipe,
  ) {
    addIcons({
      arrowBackOutline,
      refreshOutline,
      printOutline,
      downloadOutline,
      documentTextOutline,
      pieChartOutline,
      sparklesOutline,
      receiptOutline,
      peopleOutline,
      trendingUpOutline,
      cubeOutline,
      searchOutline,
      calendarOutline,
      cashOutline,
      timeOutline,
      barChartOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      fitnessOutline,
      cartOutline,
      walletOutline,
      cardOutline,
      flashOutline,
      chevronForwardOutline,
      personOutline,
      shieldCheckmarkOutline,
    });
  }

  async ngOnInit() {
    await this.hydrateFromCache();
    this.load();
  }

  async ionViewWillEnter() {
    await this.hydrateFromCache();
    this.load();
  }

  setTab(tab: Tab) {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.searchQuery = '';
    // Adjust period if needed
    if (tab === 'inventory' || tab === 'memberships') {
      // No period filter required for stock / membership profiles
    } else if (tab === 'sales' && this.period === 'all') {
      this.period = 'monthly';
    }
    const hasCached = this.applyCurrentTabFromCache();
    if (!hasCached) {
      this.isLoading = true;
    }
    this.load();
  }

  setPeriod(p: Period) {
    if (this.period === p) return;
    this.period = p;
    const hasCached = this.applyCurrentTabFromCache();
    if (!hasCached) {
      this.isLoading = true;
    }
    this.load();
  }

  /**
   * Restores cached report data immediately so tab switching and
   * initial page loads render with 0ms latency without white screens or spinners.
   */
  private async hydrateFromCache(): Promise<boolean> {
    // 1. Check in-memory static cache first (instant 0ms)
    let hasData = this.applyCurrentTabFromCache();
    if (hasData) {
      this.isLoading = false;
      return true;
    }

    // 2. Fallback to persistent storage cache
    const stored = await getCachedData<AdminReportsCache>(CACHE_KEYS.ADMIN_REPORTS);
    if (stored) {
      AdminReportsPage.cache = { ...AdminReportsPage.cache, ...stored };
      hasData = this.applyCurrentTabFromCache();
      if (hasData) {
        this.isLoading = false;
        return true;
      }
    }

    return false;
  }

  private applyCurrentTabFromCache(): boolean {
    const c = AdminReportsPage.cache;
    const p = this.period;
    const tab = this.activeTab;

    if (tab === 'overview') {
      const o = c.overview?.[p];
      if (o) {
        this.txRows = o.txRows || [];
        this.attRows = o.attRows || [];
        this.attSummary = o.attSummary || null;
        this.attSalesRows = o.attSalesRows || [];
        this.shopSalesRows = o.shopSalesRows || [];
        this.membershipSalesRows = o.membershipSalesRows || [];
        this.salesSummary = o.salesSummary || null;
        this.invRows = o.invRows || [];
        this.invSummary = o.invSummary || null;
        this.membershipRows = o.membershipRows || [];
        this.membershipSummary = o.membershipSummary || null;
        return true;
      }
    } else if (tab === 'memberships') {
      if (c.memberships) {
        this.membershipRows = c.memberships.rows || [];
        this.membershipSummary = c.memberships.summary || null;
        return true;
      }
    } else if (tab === 'transactions') {
      if (c.transactions?.[p]) {
        this.txRows = c.transactions[p] || [];
        return true;
      }
    } else if (tab === 'attendance') {
      const ap = p === 'all' || p === 'yearly' ? 'monthly' : p;
      if (c.attendance?.[ap]) {
        this.attRows = c.attendance[ap].rows || [];
        this.attSummary = c.attendance[ap].summary || null;
        return true;
      }
    } else if (tab === 'sales') {
      if (c.sales?.[p]) {
        this.attSalesRows = c.sales[p].attSalesRows || [];
        this.shopSalesRows = c.sales[p].shopSalesRows || [];
        this.membershipSalesRows = c.sales[p].membershipSalesRows || [];
        this.salesSummary = c.sales[p].salesSummary || null;
        return true;
      }
    } else if (tab === 'inventory') {
      if (c.inventory) {
        this.invRows = c.inventory.rows || [];
        this.invSummary = c.inventory.summary || null;
        return true;
      }
    }

    return false;
  }

  private headers() {
    return { Authorization: `Bearer ${this.auth.token}` };
  }

  load() {
    if (!this.applyCurrentTabFromCache()) {
      this.isLoading = true;
    }
    const h = { headers: this.headers() };
    const p = this.period;

    if (this.activeTab === 'overview') {
      const ap = p === 'all' || p === 'yearly' ? 'monthly' : p;
      let pendingReqs = 5;
      const checkDone = () => {
        pendingReqs--;
        if (pendingReqs <= 0) {
          this.isLoading = false;
          if (!AdminReportsPage.cache.overview) AdminReportsPage.cache.overview = {};
          AdminReportsPage.cache.overview[p] = {
            txRows: this.txRows,
            attRows: this.attRows,
            attSummary: this.attSummary,
            attSalesRows: this.attSalesRows,
            shopSalesRows: this.shopSalesRows,
            membershipSalesRows: this.membershipSalesRows,
            salesSummary: this.salesSummary,
            invRows: this.invRows,
            invSummary: this.invSummary,
            membershipRows: this.membershipRows,
            membershipSummary: this.membershipSummary,
          };
          // Cross-populate individual tab caches for instant subsequent visits
          if (!AdminReportsPage.cache.transactions) AdminReportsPage.cache.transactions = {};
          AdminReportsPage.cache.transactions[p] = this.txRows;
          if (!AdminReportsPage.cache.attendance) AdminReportsPage.cache.attendance = {};
          AdminReportsPage.cache.attendance[ap] = { rows: this.attRows, summary: this.attSummary };
          if (!AdminReportsPage.cache.sales) AdminReportsPage.cache.sales = {};
          AdminReportsPage.cache.sales[p] = {
            attSalesRows: this.attSalesRows,
            shopSalesRows: this.shopSalesRows,
            membershipSalesRows: this.membershipSalesRows,
            salesSummary: this.salesSummary,
          };
          AdminReportsPage.cache.inventory = { rows: this.invRows, summary: this.invSummary };
          AdminReportsPage.cache.memberships = { rows: this.membershipRows, summary: this.membershipSummary };
          void setCachedData(CACHE_KEYS.ADMIN_REPORTS, AdminReportsPage.cache);
        }
      };

      this.http.get<any[]>(`${this.api}/reports/admin/transactions?period=${p}`, h).subscribe({
        next: data => { this.txRows = data || []; checkDone(); },
        error: () => checkDone(),
      });

      this.http.get<any>(`${this.api}/reports/admin/attendance?period=${ap}`, h).subscribe({
        next: data => {
          this.attRows = data?.rows || [];
          this.attSummary = data?.summary || null;
          checkDone();
        },
        error: () => checkDone(),
      });

      this.http.get<any>(`${this.api}/reports/admin/sales?period=${p}`, h).subscribe({
        next: data => {
          this.attSalesRows = data?.attendanceSales || [];
          this.shopSalesRows = data?.shopSales || [];
          this.membershipSalesRows = data?.membershipSales || [];
          this.salesSummary = data?.summary || null;
          checkDone();
        },
        error: () => checkDone(),
      });

      this.http.get<any>(`${this.api}/reports/admin/inventory`, h).subscribe({
        next: data => {
          this.invRows = data?.rows || [];
          this.invSummary = data?.summary || null;
          checkDone();
        },
        error: () => checkDone(),
      });

      this.http.get<any>(`${this.api}/reports/admin/memberships`, h).subscribe({
        next: data => {
          this.membershipRows = data?.rows || [];
          this.membershipSummary = data?.summary || null;
          checkDone();
        },
        error: () => checkDone(),
      });

    } else if (this.activeTab === 'memberships') {
      this.http.get<any>(`${this.api}/reports/admin/memberships`, h).subscribe({
        next: data => {
          this.membershipRows = data?.rows || [];
          this.membershipSummary = data?.summary || null;
          this.isLoading = false;
          AdminReportsPage.cache.memberships = {
            rows: this.membershipRows,
            summary: this.membershipSummary,
          };
          void setCachedData(CACHE_KEYS.ADMIN_REPORTS, AdminReportsPage.cache);
        },
        error: () => { this.isLoading = false; },
      });

    } else if (this.activeTab === 'transactions') {
      this.http.get<any[]>(`${this.api}/reports/admin/transactions?period=${p}`, h).subscribe({
        next: data => {
          this.txRows = data || [];
          this.isLoading = false;
          if (!AdminReportsPage.cache.transactions) AdminReportsPage.cache.transactions = {};
          AdminReportsPage.cache.transactions[p] = this.txRows;
          void setCachedData(CACHE_KEYS.ADMIN_REPORTS, AdminReportsPage.cache);
        },
        error: () => { this.isLoading = false; },
      });

    } else if (this.activeTab === 'attendance') {
      const ap = p === 'all' || p === 'yearly' ? 'monthly' : p;
      this.http.get<any>(`${this.api}/reports/admin/attendance?period=${ap}`, h).subscribe({
        next: data => {
          this.attRows = data?.rows || [];
          this.attSummary = data?.summary || null;
          this.isLoading = false;
          if (!AdminReportsPage.cache.attendance) AdminReportsPage.cache.attendance = {};
          AdminReportsPage.cache.attendance[ap] = {
            rows: this.attRows,
            summary: this.attSummary,
          };
          void setCachedData(CACHE_KEYS.ADMIN_REPORTS, AdminReportsPage.cache);
        },
        error: () => { this.isLoading = false; },
      });

    } else if (this.activeTab === 'sales') {
      this.http.get<any>(`${this.api}/reports/admin/sales?period=${p}`, h).subscribe({
        next: data => {
          this.attSalesRows = data?.attendanceSales || [];
          this.shopSalesRows = data?.shopSales || [];
          this.membershipSalesRows = data?.membershipSales || [];
          this.salesSummary = data?.summary || null;
          this.isLoading = false;
          if (!AdminReportsPage.cache.sales) AdminReportsPage.cache.sales = {};
          AdminReportsPage.cache.sales[p] = {
            attSalesRows: this.attSalesRows,
            shopSalesRows: this.shopSalesRows,
            membershipSalesRows: this.membershipSalesRows,
            salesSummary: this.salesSummary,
          };
          void setCachedData(CACHE_KEYS.ADMIN_REPORTS, AdminReportsPage.cache);
        },
        error: () => { this.isLoading = false; },
      });

    } else if (this.activeTab === 'inventory') {
      this.http.get<any>(`${this.api}/reports/admin/inventory`, h).subscribe({
        next: data => {
          this.invRows = data?.rows || [];
          this.invSummary = data?.summary || null;
          this.isLoading = false;
          AdminReportsPage.cache.inventory = {
            rows: this.invRows,
            summary: this.invSummary,
          };
          void setCachedData(CACHE_KEYS.ADMIN_REPORTS, AdminReportsPage.cache);
        },
        error: () => { this.isLoading = false; },
      });
    }
  }

  // ── Overview Total & Stream Calculations ─────────────
  get grandTotalCollected(): number {
    if (!this.salesSummary) return 0;
    return (
      (this.salesSummary.gymRevenue || 0) +
      (this.salesSummary.shopRevenue || 0) +
      (this.salesSummary.membershipRevenue || 0)
    );
  }

  get revenueMembershipPercent(): number {
    if (!this.grandTotalCollected) return 0;
    return Math.round(((this.salesSummary?.membershipRevenue || 0) / this.grandTotalCollected) * 100);
  }

  get revenueGymPercent(): number {
    if (!this.grandTotalCollected) return 0;
    return Math.round(((this.salesSummary?.gymRevenue || 0) / this.grandTotalCollected) * 100);
  }

  get revenueShopPercent(): number {
    if (!this.grandTotalCollected) return 0;
    return Math.round(((this.salesSummary?.shopRevenue || 0) / this.grandTotalCollected) * 100);
  }

  get paymentCashPercent(): number {
    const total = (this.salesSummary?.cashRevenue || 0) + (this.salesSummary?.gcashRevenue || 0);
    if (!total) return 0;
    return Math.round(((this.salesSummary?.cashRevenue || 0) / total) * 100);
  }

  get paymentGcashPercent(): number {
    const total = (this.salesSummary?.cashRevenue || 0) + (this.salesSummary?.gcashRevenue || 0);
    if (!total) return 0;
    return Math.round(((this.salesSummary?.gcashRevenue || 0) / total) * 100);
  }

  get attendanceTotal(): number {
    return this.attSummary?.total || this.attRows.length || 0;
  }

  get attendanceMorningPercent(): number {
    if (!this.attendanceTotal) return 0;
    return Math.round(((this.attSummary?.morningCount || 0) / this.attendanceTotal) * 100);
  }

  get attendanceAfternoonPercent(): number {
    if (!this.attendanceTotal) return 0;
    return Math.round(((this.attSummary?.afternoonCount || 0) / this.attendanceTotal) * 100);
  }

  get attendanceEveningPercent(): number {
    if (!this.attendanceTotal) return 0;
    return Math.round(((this.attSummary?.eveningCount || 0) / this.attendanceTotal) * 100);
  }

  // ── Icon & Status Helpers ─────────────────────────────
  getTxIcon(tx: any): string {
    if (tx.source === 'membership') return 'sparkles-outline';
    if (tx.source === 'order') return 'cart-outline';
    return tx.sub_type === 'daily' ? 'walk-outline' : 'fitness-outline';
  }

  getTxIconClass(tx: any): string {
    if (tx.source === 'membership') return 'icon-membership';
    if (tx.source === 'order') return 'icon-shop';
    return tx.sub_type === 'daily' ? 'icon-daily' : 'icon-premium';
  }

  getStatusKey(tx: any): string {
    const s = (tx.payment_status || tx.sub_type || '').toLowerCase();
    if (s === 'paid' || s === 'approved' || s === 'completed' || s === 'active') return 'paid';
    if (s === 'pending') return 'pending';
    if (s === 'rejected' || s === 'cancelled') return 'rejected';
    return 'neutral';
  }

  getStatusLabel(tx: any): string {
    const key = this.getStatusKey(tx);
    const map: Record<string, string> = {
      paid: 'Paid / Active',
      pending: 'Pending',
      rejected: 'Rejected',
      neutral: '—',
    };
    return map[key] ?? key;
  }

  getInitials(name: string): string {
    if (!name) return 'FG';
    return name
      .split(' ')
      .filter(w => !w)
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getPeriodDisplayLabel(): string {
    const map: Record<string, string> = {
      daily: 'Today (Daily)',
      weekly: 'This Week (Weekly)',
      monthly: 'This Month (Monthly)',
      yearly: 'This Year (Yearly)',
      all: 'All Time Records',
    };
    return map[this.period] ?? this.period;
  }

  // ── Print ─────────────────────────────────────────────
  printCurrent() {
    window.print();
  }

  // ── PDF download ──────────────────────────────────────
  downloadPDF() {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const periodLabel: Record<string, string> = {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      yearly: 'Yearly',
      all: 'All Time',
    };
    const tabLabel: Record<string, string> = {
      overview: 'Executive Analytics Summary',
      memberships: 'Membership Plans & Subscriptions',
      transactions: 'Transaction Audit Ledger',
      attendance: 'Gym Attendance & Traffic Log',
      sales: 'Revenue & Sales Breakdown',
      inventory: 'Shop Inventory & Stock Valuation',
    };

    // Header Branding
    doc.setFillColor(244, 245, 248);
    doc.rect(0, 0, 210, 32, 'F');

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.text('FordaGO Fitness — Admin Analytics Report', 14, 15);

    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${tabLabel[this.activeTab]}  |  Period: ${periodLabel[this.period] ?? 'Monthly'}  |  Generated: ${new Date().toLocaleString()}`,
      14,
      23,
    );

    let startY = 40;

    if (this.activeTab === 'overview') {
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Performance Indicators', 14, startY);

      const kpis = [
        ['Total Collected Realized Revenue', `PHP ${this.decimalPipe.transform(this.grandTotalCollected, '1.2-2')}`],
        ['Premium Membership Subscriptions', `PHP ${this.decimalPipe.transform(this.salesSummary?.membershipRevenue || 0, '1.2-2')}`],
        ['Gym Daily Walk-in Passes', `PHP ${this.decimalPipe.transform(this.salesSummary?.gymRevenue || 0, '1.2-2')}`],
        ['Shop Merchandise Sales', `PHP ${this.decimalPipe.transform(this.salesSummary?.shopRevenue || 0, '1.2-2')}`],
        ['Pending Receivables (Orders/Plans)', `PHP ${this.decimalPipe.transform(this.salesSummary?.pendingRevenue || 0, '1.2-2')}`],
        ['Total Gym Visits', `${this.attSummary?.total || this.attRows.length || 0} check-ins`],
      ];

      autoTable(doc, {
        startY: startY + 4,
        head: [['Metric', 'Value']],
        body: kpis,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
      });

    } else if (this.activeTab === 'memberships') {
      if (this.membershipSummary) {
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Total Members: ${this.membershipSummary.totalMembers}  |  Active Premium: ${this.membershipSummary.activePremium}  |  Premium Revenue: PHP ${this.decimalPipe.transform(this.membershipSummary.premiumRevenue, '1.2-2')}  |  Expiring: ${this.membershipSummary.expiringSoon}`,
          14,
          startY - 4,
        );
      }
      autoTable(doc, {
        startY,
        head: [['Member', 'Email', 'Plan', 'Payment', 'Expiry Date', 'Remaining', 'Status']],
        body: this.filteredMembershipRows.map(m => [
          m.username,
          m.email,
          m.membership_type === 'premium' ? 'Premium (₱500)' : 'Daily Pass',
          (m.payment_method || 'cash').toUpperCase(),
          m.membership_expiry ? this.datePipe.transform(m.membership_expiry, 'MMM d, yyyy') ?? '—' : '—',
          m.membership_type === 'premium' ? `${m.days_left} days` : 'Per visit',
          m.membership_status === 'active' ? 'Active' : 'Pending',
        ]),
        headStyles: { fillColor: [234, 179, 8], textColor: [15, 23, 42], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8.5, cellPadding: 2.2 },
      });

    } else if (this.activeTab === 'transactions') {
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `Total Rows: ${this.filteredTxRows.length}   |   Collected: PHP ${this.decimalPipe.transform(this.txCollectedRevenue, '1.2-2')}   |   Pending: PHP ${this.decimalPipe.transform(this.txPendingRevenue, '1.2-2')}`,
        14,
        startY - 4,
      );

      autoTable(doc, {
        startY,
        head: [['Date & Time', 'Member', 'Type', 'Details', 'Amount', 'Payment', 'Status']],
        body: this.filteredTxRows.map(tx => [
          this.datePipe.transform(tx.transaction_date, 'MMM d, yyyy h:mm a') ?? '',
          tx.username,
          tx.type_label,
          tx.product_name || (tx.source === 'attendance' ? 'Gym Walk-in' : (tx.source === 'membership' ? 'Monthly Plan' : '—')),
          tx.amount > 0 ? `PHP ${this.decimalPipe.transform(tx.amount, '1.2-2')}` : 'Included',
          (tx.payment_method || 'cash').toUpperCase(),
          this.getStatusLabel(tx),
        ]),
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8, cellPadding: 2.2 },
      });

    } else if (this.activeTab === 'attendance') {
      if (this.attSummary) {
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Total Visits: ${this.attSummary.total}  |  Daily Passes: ${this.attSummary.daily}  |  Premium: ${this.attSummary.premium}  |  Revenue: PHP ${this.decimalPipe.transform(this.attSummary.totalRevenue, '1.2-2')}`,
          14,
          startY - 4,
        );
      }
      autoTable(doc, {
        startY,
        head: [['Check-in Time', 'Member', 'Email', 'Plan', 'Amount', 'Status']],
        body: this.filteredAttRows.map(r => [
          this.datePipe.transform(r.check_in_time, 'MMM d, yyyy h:mm a') ?? '',
          r.username,
          r.email,
          r.membership_type === 'daily' ? 'Daily Pass' : 'Premium Member',
          r.membership_type === 'daily' ? 'PHP 40.00' : 'Included',
          (r.payment_status || 'paid').toUpperCase(),
        ]),
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8, cellPadding: 2.2 },
      });

    } else if (this.activeTab === 'sales') {
      if (this.salesSummary) {
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Total Revenue: PHP ${this.decimalPipe.transform(this.salesSummary.totalRevenue, '1.2-2')}  |  Premium: PHP ${this.decimalPipe.transform(this.salesSummary.membershipRevenue, '1.2-2')}  |  Gym: PHP ${this.decimalPipe.transform(this.salesSummary.gymRevenue, '1.2-2')}  |  Shop: PHP ${this.decimalPipe.transform(this.salesSummary.shopRevenue, '1.2-2')}`,
          14,
          startY - 4,
        );
      }
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      doc.text('Gym Daily Pass Revenue by Date', 14, startY + 2);
      autoTable(doc, {
        startY: startY + 6,
        head: [['Date', 'Paid Walk-ins', 'Collected Revenue']],
        body: this.attSalesRows.map(r => [
          this.datePipe.transform(r.sale_date, 'MMM d, yyyy') ?? '',
          r.count,
          `PHP ${this.decimalPipe.transform(r.revenue, '1.2-2')}`,
        ]),
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 8.5, cellPadding: 2 },
      });

    } else if (this.activeTab === 'inventory') {
      if (this.invSummary) {
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Total Products: ${this.invRows.length}  |  Stock Units: ${this.invSummary.totalStock}  |  Sold Units: ${this.invSummary.totalSold}  |  Inventory Value: PHP ${this.decimalPipe.transform(this.invSummary.inventoryValue, '1.2-2')}`,
          14,
          startY - 4,
        );
      }
      autoTable(doc, {
        startY,
        head: [['Product Name', 'Brand', 'Unit Price', 'Stock on Hand', 'Units Sold', 'Total Revenue']],
        body: this.filteredInvRows.map(item => [
          item.name,
          item.brand || '—',
          `PHP ${this.decimalPipe.transform(item.price, '1.2-2')}`,
          item.current_stock,
          item.total_sold,
          `PHP ${this.decimalPipe.transform(item.total_revenue, '1.2-2')}`,
        ]),
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8.5, cellPadding: 2.2 },
      });
    }

    doc.save(`FordaGO_Report_${this.activeTab}_${this.period}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}