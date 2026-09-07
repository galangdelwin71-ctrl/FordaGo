// admin-reports.page.ts — Rebuilt for FordaGO: non-redundant revenue & member feedback
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
  star,
  starOutline,
  chatbubbleEllipsesOutline,
  happyOutline,
  sadOutline,
  removeCircleOutline,
  pricetagOutline,
  walkOutline,
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_URL } from '../config/api.config';
import { getCachedData, setCachedData } from '../utils/local-cache.util';
import { CACHE_KEYS } from '../utils/cache-keys';
import { PullToRefreshComponent } from '../shared/pull-to-refresh/pull-to-refresh.component';

export type Tab = 'overview' | 'revenue' | 'memberships' | 'attendance' | 'feedback' | 'inventory';
export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all';

export interface AdminReportsCache {
  overview?: Record<string, any>;
  revenue?: Record<string, {
    txRows: any[];
    salesSummary: any;
    attSalesRows: any[];
    shopSalesRows: any[];
    membershipSalesRows: any[];
  }>;
  memberships?: {
    rows: any[];
    summary: any;
  };
  attendance?: Record<string, {
    rows: any[];
    summary: any;
  }>;
  feedback?: Record<string, {
    rows: any[];
    summary: any;
  }>;
  inventory?: {
    rows: any[];
    summary: any;
  };
}

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

  // Local-First Stale-While-Revalidate In-Memory & Storage Cache
  private static cache: AdminReportsCache = {};

  activeTab: Tab = 'overview';
  period: Period = 'monthly';
  isLoading = false;

  // Search and Sub-filters
  searchQuery = '';
  sourceFilter: 'all' | 'membership' | 'attendance' | 'order' = 'all';
  statusFilter: 'all' | 'paid' | 'pending' | 'rejected' = 'all';
  membershipFilter: 'all' | 'premium' | 'coach' | 'daily' | 'expiring' | 'pending' = 'all';
  feedbackFilter: 'all' | 'promoter' | 'passive' | 'detractor' | 'with_comment' = 'all';
  revenueViewMode: 'ledger' | 'streams' = 'ledger';

  // ── Memberships ───────────────────────────────────────
  membershipRows: any[] = [];
  membershipSummary: any = null;

  get filteredMembershipRows(): any[] {
    return this.membershipRows.filter(m => {
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

  // ── Consolidated Revenue & Financials ─────────────────
  txRows: any[] = [];
  salesSummary: any = null;
  attSalesRows: any[] = [];
  shopSalesRows: any[] = [];
  membershipSalesRows: any[] = [];

  get filteredTxRows(): any[] {
    return this.txRows.filter(tx => {
      if (this.sourceFilter !== 'all' && tx.source !== this.sourceFilter) return false;
      if (this.statusFilter !== 'all') {
        const key = this.getStatusKey(tx);
        if (key !== this.statusFilter) return false;
      }
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

  // ── Member Feedback & NPS ─────────────────────────────
  feedbackRows: any[] = [];
  feedbackSummary: any = null;

  get filteredFeedbackRows(): any[] {
    return this.feedbackRows.filter(f => {
      if (this.feedbackFilter === 'promoter' && f.sentiment !== 'promoter') return false;
      if (this.feedbackFilter === 'passive' && f.sentiment !== 'passive') return false;
      if (this.feedbackFilter === 'detractor' && f.sentiment !== 'detractor') return false;
      if (this.feedbackFilter === 'with_comment' && (!f.reason || !f.reason.trim())) return false;

      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const username = (f.user?.username || '').toLowerCase();
        const name = (f.user?.name || '').toLowerCase();
        const email = (f.user?.email || '').toLowerCase();
        const reason = (f.reason || '').toLowerCase();
        return username.includes(q) || name.includes(q) || email.includes(q) || reason.includes(q);
      }
      return true;
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
      star,
      starOutline,
      chatbubbleEllipsesOutline,
      happyOutline,
      sadOutline,
      removeCircleOutline,
      pricetagOutline,
      walkOutline,
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
    if (tab === 'inventory' || tab === 'memberships') {
      // Inventory and Memberships don't need period filter
    } else if (tab === 'revenue' && this.period === 'all') {
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

  private async hydrateFromCache(): Promise<boolean> {
    let hasData = this.applyCurrentTabFromCache();
    if (hasData) {
      this.isLoading = false;
      return true;
    }

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
        this.salesSummary = o.salesSummary || null;
        this.invRows = o.invRows || [];
        this.invSummary = o.invSummary || null;
        this.membershipRows = o.membershipRows || [];
        this.membershipSummary = o.membershipSummary || null;
        this.feedbackRows = o.feedbackRows || [];
        this.feedbackSummary = o.feedbackSummary || null;
        return true;
      }
    } else if (tab === 'revenue') {
      if (c.revenue?.[p]) {
        this.txRows = c.revenue[p].txRows || [];
        this.salesSummary = c.revenue[p].salesSummary || null;
        this.attSalesRows = c.revenue[p].attSalesRows || [];
        this.shopSalesRows = c.revenue[p].shopSalesRows || [];
        this.membershipSalesRows = c.revenue[p].membershipSalesRows || [];
        return true;
      }
    } else if (tab === 'memberships') {
      if (c.memberships) {
        this.membershipRows = c.memberships.rows || [];
        this.membershipSummary = c.memberships.summary || null;
        return true;
      }
    } else if (tab === 'attendance') {
      const ap = p === 'all' || p === 'yearly' ? 'monthly' : p;
      if (c.attendance?.[ap]) {
        this.attRows = c.attendance[ap].rows || [];
        this.attSummary = c.attendance[ap].summary || null;
        return true;
      }
    } else if (tab === 'feedback') {
      if (c.feedback?.[p]) {
        this.feedbackRows = c.feedback[p].rows || [];
        this.feedbackSummary = c.feedback[p].summary || null;
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
      let pendingReqs = 6;
      const checkDone = () => {
        pendingReqs--;
        if (pendingReqs <= 0) {
          this.isLoading = false;
          if (!AdminReportsPage.cache.overview) AdminReportsPage.cache.overview = {};
          AdminReportsPage.cache.overview[p] = {
            txRows: this.txRows,
            attRows: this.attRows,
            attSummary: this.attSummary,
            salesSummary: this.salesSummary,
            invRows: this.invRows,
            invSummary: this.invSummary,
            membershipRows: this.membershipRows,
            membershipSummary: this.membershipSummary,
            feedbackRows: this.feedbackRows,
            feedbackSummary: this.feedbackSummary,
          };
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

      this.http.get<any>(`${this.api}/reports/admin/feedback?period=${p}`, h).subscribe({
        next: data => {
          this.feedbackRows = data?.rows || [];
          this.feedbackSummary = data?.summary || null;
          checkDone();
        },
        error: () => checkDone(),
      });

    } else if (this.activeTab === 'revenue') {
      let pendingReqs = 2;
      const checkDone = () => {
        pendingReqs--;
        if (pendingReqs <= 0) {
          this.isLoading = false;
          if (!AdminReportsPage.cache.revenue) AdminReportsPage.cache.revenue = {};
          AdminReportsPage.cache.revenue[p] = {
            txRows: this.txRows,
            salesSummary: this.salesSummary,
            attSalesRows: this.attSalesRows,
            shopSalesRows: this.shopSalesRows,
            membershipSalesRows: this.membershipSalesRows,
          };
          void setCachedData(CACHE_KEYS.ADMIN_REPORTS, AdminReportsPage.cache);
        }
      };

      this.http.get<any[]>(`${this.api}/reports/admin/transactions?period=${p}`, h).subscribe({
        next: data => { this.txRows = data || []; checkDone(); },
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

    } else if (this.activeTab === 'feedback') {
      this.http.get<any>(`${this.api}/reports/admin/feedback?period=${p}`, h).subscribe({
        next: data => {
          this.feedbackRows = data?.rows || [];
          this.feedbackSummary = data?.summary || null;
          this.isLoading = false;
          if (!AdminReportsPage.cache.feedback) AdminReportsPage.cache.feedback = {};
          AdminReportsPage.cache.feedback[p] = {
            rows: this.feedbackRows,
            summary: this.feedbackSummary,
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
      revenue: 'Revenue & Financial Audit Report',
      memberships: 'Membership Plans & Subscriptions',
      attendance: 'Gym Attendance & Traffic Log',
      feedback: 'Member Feedback & NPS Analytics',
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
        ['Average Member Satisfaction', `${this.feedbackSummary?.avg_rating || 0}/10 (NPS: ${this.feedbackSummary?.nps || 0})`],
      ];

      autoTable(doc, {
        startY: startY + 4,
        head: [['Metric', 'Value']],
        body: kpis,
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 },
      });

    } else if (this.activeTab === 'revenue') {
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      doc.text(
        `Total Realized: PHP ${this.decimalPipe.transform(this.txCollectedRevenue, '1.2-2')}   |   Pending: PHP ${this.decimalPipe.transform(this.txPendingRevenue, '1.2-2')}   |   Transactions: ${this.filteredTxRows.length}`,
        14,
        startY - 4,
      );

      autoTable(doc, {
        startY,
        head: [['Date & Time', 'Customer', 'Category', 'Details', 'Amount', 'Payment', 'Status']],
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

    } else if (this.activeTab === 'feedback') {
      if (this.feedbackSummary) {
        doc.setFontSize(9.5);
        doc.setTextColor(15, 23, 42);
        doc.text(
          `Total Reviews: ${this.feedbackSummary.total}  |  Avg Rating: ${this.feedbackSummary.avg_rating}/10  |  NPS Score: ${this.feedbackSummary.nps}  |  Promoters: ${this.feedbackSummary.promoters}  |  Detractors: ${this.feedbackSummary.detractors}`,
          14,
          startY - 4,
        );
      }
      autoTable(doc, {
        startY,
        head: [['Date', 'Member', 'Plan', 'Rating', 'Sentiment', 'Feedback / Review Comment']],
        body: this.filteredFeedbackRows.map(f => [
          this.datePipe.transform(f.created_at, 'MMM d, yyyy') ?? '',
          f.user?.username || 'Member',
          (f.user?.membership_type || 'daily').toUpperCase(),
          `${f.rating} / 10`,
          (f.sentiment || '').toUpperCase(),
          f.reason || '(Rating only)',
        ]),
        headStyles: { fillColor: [234, 179, 8], textColor: [15, 23, 42], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 8.5, cellPadding: 2.2 },
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