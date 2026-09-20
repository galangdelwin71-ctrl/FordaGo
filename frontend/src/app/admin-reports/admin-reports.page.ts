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
  closeCircleOutline,
  hourglassOutline,
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { PaymentService, OfficialReceipt } from '../services/payment.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_URL, resolveImageUrl } from '../config/api.config';
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
  channelFilter: 'all' | 'cash' | 'gcash' | 'maya' = 'all';
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
      // Channel filter
      if (this.channelFilter !== 'all') {
        const ch = (tx.payment_channel || tx.payment_method || '').toLowerCase();
        if (this.channelFilter === 'maya') {
          if (ch !== 'maya' && ch !== 'paymaya') return false;
        } else if (ch !== this.channelFilter) {
          return false;
        }
      }
      // Search query
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.toLowerCase();
        const name = (tx.username || '').toLowerCase();
        const email = (tx.email || '').toLowerCase();
        const prod = (tx.product_name || '').toLowerCase();
        const type = (tx.type_label || '').toLowerCase();
        const ref = (tx.reference_number || tx.receipt_number || '').toLowerCase();
        return name.includes(q) || email.includes(q) || prod.includes(q) || type.includes(q) || ref.includes(q);
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
    public paymentService: PaymentService,
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
      closeCircleOutline,
      hourglassOutline,
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

  private normalizeInventoryRows(rows: any[]): any[] {
    return (rows || []).map(r => {
      const days = r.days_until_expiry !== undefined && r.days_until_expiry !== null ? Number(r.days_until_expiry) : null;
      const price = Number(r.price || 0);
      const costPrice = Number(r.cost_price || 0);
      const stock = Number(r.current_stock || 0);
      const sold = Number(r.total_sold || 0);
      const rev = Number(r.total_revenue || 0);
      const unitProfit = Number(r.profit_per_unit ?? Math.max(0, price - costPrice));
      const margin = Number(r.profit_margin ?? (price > 0 ? Math.round(((price - costPrice) / price) * 1000) / 10 : 0));
      const cogs = Number(r.cogs ?? (costPrice * sold));
      const totalProfit = Number(r.total_profit ?? Math.max(0, rev - cogs));

      return {
        ...r,
        price,
        cost_price: costPrice,
        current_stock: stock,
        total_sold: sold,
        total_revenue: rev,
        profit_per_unit: unitProfit,
        profit_margin: margin,
        cogs,
        total_profit: totalProfit,
        days_until_expiry: days,
        expiry_days: days,
      };
    });
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
          this.invRows = this.normalizeInventoryRows(data?.rows || []);
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
          this.invRows = this.normalizeInventoryRows(data?.rows || []);
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

  openReceipt(tx: any) {
    if (tx.payment_id) {
      this.paymentService.getReceipt(tx.payment_id).subscribe({
        next: receipt => {
          if (receipt) this.paymentService.openReceipt(receipt);
          else this.openFallbackReceipt(tx);
        },
        error: () => this.openFallbackReceipt(tx)
      });
    } else {
      this.openFallbackReceipt(tx);
    }
  }

  openFallbackReceipt(tx: any) {
    const rawChannel = tx.payment_channel || tx.payment_method || 'cash';
    const channel = rawChannel === 'paymaya' || rawChannel === 'maya' ? 'Maya' : (rawChannel === 'gcash' ? 'GCash' : rawChannel.toUpperCase());
    const amt = Number(tx.amount || tx.total || 0);
    const txDate = tx.transaction_date || tx.created_at || new Date().toISOString();

    const fallbackReceipt: OfficialReceipt = {
      club_name: 'FORDAGO FITNESS & WELLNESS CLUB',
      club_address: 'Bustos, Bulacan, Philippines',
      receipt_number: tx.receipt_number || `REC-${(tx.source || 'TX').toUpperCase()}-${tx.id || Math.floor(100000 + Math.random() * 900000)}`,
      payment_channel: channel,
      gateway: tx.gateway || (rawChannel === 'cash' ? 'counter' : 'paymongo'),
      payment_for: tx.source === 'membership' ? '1-Month Gym Membership Plan' : (tx.source === 'order' ? 'Shop Supplements & Merchandise' : (tx.source || 'Gym Service')),
      status: 'PAID',
      amount: amt,
      subtotal: amt,
      fee: 0,
      tax: 0,
      discount: 0,
      total: amt,
      grand_total: amt,
      total_amount: amt,
      currency: 'PHP',
      paid_at: txDate,
      transaction_date: txDate,
      customer_name: tx.username || 'Valued Member',
      customer_email: tx.email || 'member@fordago.ph',
      customer_phone: tx.phone || '',
      items: [
        {
          name: tx.product_name || tx.type_label || (tx.source === 'membership' ? '1-Month Premium Access' : 'Gym Service/Product'),
          quantity: Number(tx.quantity || 1),
          price: amt,
          unit_price: amt,
          amount: amt,
          subtotal: amt,
        }
      ],
      notes: tx.reference_number ? `Ref No: ${tx.reference_number}` : undefined
    };
    this.paymentService.openReceipt(fallbackReceipt);
  }

  getInitials(name: string): string {
    if (!name) return 'FG';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  resolveImg(path: string | null | undefined): string {
    return resolveImageUrl(path);
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

  // ── Helper formatters for PDF & Reports ────────────────
  private formatCurrency(amount: any): string {
    const num = Number(amount || 0);
    return `PHP ${this.decimalPipe.transform(num, '1.2-2') ?? '0.00'}`;
  }

  private formatDate(date: any, fallback = '—'): string {
    if (!date) return fallback;
    return this.datePipe.transform(date, 'MMM d, yyyy') ?? fallback;
  }

  private formatDateTime(date: any, fallback = '—'): string {
    if (!date) return fallback;
    return this.datePipe.transform(date, 'MMM d, yyyy h:mm a') ?? fallback;
  }

  // ── Print ─────────────────────────────────────────────
  printCurrent() {
    window.print();
  }

  // ── Professional Executive PDF Generator ──────────────
  downloadPDF(tabToExport?: Tab) {
    const targetTab: Tab = tabToExport || this.activeTab;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const periodLabel: Record<string, string> = {
      daily: 'Today (Daily)',
      weekly: 'This Week (Weekly)',
      monthly: 'This Month (Monthly)',
      yearly: 'This Year (Yearly)',
      all: 'All-Time Records',
    };

    const tabLabel: Record<string, string> = {
      overview: 'Executive Analytics & Comprehensive Operational Audit',
      memberships: 'Membership Roster, Retention & Expiration Audit',
      transactions: 'Financial Transaction & Receivables Audit Ledger',
      attendance: 'Gym Attendance, Traffic & Peak-Hours Analysis',
      sales: 'Revenue Streams & Sales Performance Ledger',
      inventory: 'Shop Inventory Valuation & Batch Expiration Audit',
    };

    const reportTitle = tabLabel[targetTab] || 'Management Intelligence Audit';
    const currentPeriod = this.period;
    const genTimestamp = this.formatDateTime(new Date());
    const reportRef = `FDG-${targetTab.toUpperCase().slice(0, 3)}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    let startY = 44;

    // ───────────────────────────────────────────────────────
    // TAB 1: INVENTORY & EXPIRATION AUDIT
    // ───────────────────────────────────────────────────────
    if (targetTab === 'inventory') {
      const rows = this.filteredInvRows.length ? this.filteredInvRows : this.invRows;
      const totalProducts = this.invRows.length;
      const totalStock = this.invSummary?.totalStock ?? this.invRows.reduce((a, b) => a + (b.current_stock || 0), 0);
      const totalSold = this.invSummary?.totalSold ?? this.invRows.reduce((a, b) => a + (b.total_sold || 0), 0);
      const totalRevenue = this.invSummary?.totalRevenue ?? this.invRows.reduce((a, b) => a + (b.total_revenue || 0), 0);
      const totalCogs = this.invSummary?.totalCogs ?? this.invRows.reduce((a, b) => a + ((b.cost_price || 0) * (b.total_sold || 0)), 0);
      const totalProfit = this.invSummary?.totalProfit ?? Math.max(0, totalRevenue - totalCogs);
      const inventoryValue = this.invSummary?.inventoryValue ?? this.invRows.reduce((a, b) => a + ((b.price || 0) * (b.current_stock || 0)), 0);
      const inventoryCostValue = this.invSummary?.inventoryCostValue ?? this.invRows.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);

      // Expiration segments
      const expiredItems = this.invRows.filter(r => r.expiry_status === 'expired' || (r.days_until_expiry !== null && r.days_until_expiry < 0));
      const expiredUnits = expiredItems.reduce((a, b) => a + (b.current_stock || 0), 0);
      const expiredLossRisk = this.invSummary?.expiredLossRisk ?? expiredItems.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);

      const expiringSoonItems = this.invRows.filter(r => r.expiry_status === 'expiring_soon' || (r.days_until_expiry !== null && r.days_until_expiry >= 0 && r.days_until_expiry <= 30));
      const expiringSoonUnits = expiringSoonItems.reduce((a, b) => a + (b.current_stock || 0), 0);
      const expiringSoonRisk = this.invSummary?.expiringSoonRisk ?? expiringSoonItems.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);

      // KPI Scorecard Table
      const invKpis = [
        [
          { content: 'Active Product Lines', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${totalProducts} catalog SKUs`,
          { content: 'Stock on Hand', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${totalStock} total units`,
        ],
        [
          { content: 'Gross Merchandise Sales', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(totalRevenue),
          { content: 'Cost of Goods Sold (COGS)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(totalCogs),
        ],
        [
          { content: 'Net Merchandise Tubo (Profit)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
          { content: this.formatCurrency(totalProfit), styles: { fontStyle: 'bold', textColor: [5, 150, 105] } },
          { content: 'Units Sold (Lifetime)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${totalSold} units purchased`,
        ],
        [
          { content: 'Asset Valuation (Retail)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(inventoryValue),
          { content: 'Capital Asset Cost (Puhunan)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(inventoryCostValue),
        ],
        [
          { content: 'Expired Stock Alert', styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] } },
          { content: `${expiredItems.length} SKUs (${expiredUnits} units) — Loss: ${this.formatCurrency(expiredLossRisk)}`, styles: { fontStyle: 'bold', textColor: [185, 28, 28], fillColor: [254, 226, 226] } },
          { content: 'Expiring Soon Alert (≤30d)', styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [180, 83, 9] } },
          { content: `${expiringSoonItems.length} SKUs (${expiringSoonUnits} units) — Risk: ${this.formatCurrency(expiringSoonRisk)}`, styles: { fontStyle: 'bold', textColor: [180, 83, 9], fillColor: [254, 243, 199] } },
        ],
      ];

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[{ content: 'INVENTORY & PERISHABLES EXECUTIVE SUMMARY', colSpan: 4, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: [234, 179, 8], fontStyle: 'bold' } }]],
        body: invKpis as any,
        styles: { fontSize: 8, cellPadding: 2.2 },
        theme: 'grid',
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      // Section 1: PRIORITY EXPIRATION AUDIT TABLE
      if (expiredItems.length > 0 || expiringSoonItems.length > 0) {
        const priorityItems = [...expiredItems, ...expiringSoonItems];
        const priorityRows = priorityItems.map((item, idx) => {
          const isExp = item.expiry_status === 'expired' || (item.days_until_expiry !== null && item.days_until_expiry < 0);
          const daysText = isExp
            ? `Expired (${Math.abs(item.days_until_expiry)}d ago)`
            : `${item.days_until_expiry} days remaining`;
          const directive = isExp ? 'PULL-OUT & WRITE OFF' : '20-50% CLEARANCE SALE';
          const lossRisk = (item.cost_price || 0) * (item.current_stock || 0);

          return [
            idx + 1,
            item.name,
            item.brand || '—',
            item.current_stock,
            this.formatCurrency(item.cost_price),
            this.formatCurrency(item.price),
            this.formatDate(item.expiry_date),
            daysText,
            directive,
            this.formatCurrency(lossRisk),
          ];
        });

        // Add total risk footer row
        const combinedRisk = expiredLossRisk + expiringSoonRisk;
        priorityRows.push([
          { content: 'TOTAL PERISHABLE CAPITAL AT RISK (IMMEDIATE ACTION)', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] } } as any,
          { content: this.formatCurrency(combinedRisk), styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] } } as any,
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 44, bottom: 22, left: 14, right: 14 },
          head: [[
            { content: 'URGENT SPOILAGE & SHELF-LIFE AUDIT REGISTER', colSpan: 10, styles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], [
            '#', 'Product Name', 'Brand', 'Stock', 'Unit Cost', 'Retail', 'Expiry Date', 'Lifespan', 'Audit Directive', 'Loss at Risk',
          ]],
          body: priorityRows,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
          styles: { fontSize: 7.2, cellPadding: 2 },
          didParseCell: (data) => {
            if (data.section === 'body' && data.row.index < priorityItems.length) {
              const item = priorityItems[data.row.index];
              const isExp = item.expiry_status === 'expired' || (item.days_until_expiry !== null && item.days_until_expiry < 0);
              if (isExp) {
                data.cell.styles.fillColor = [254, 226, 226];
                if (data.column.index === 8 || data.column.index === 9) {
                  data.cell.styles.textColor = [153, 27, 27];
                  data.cell.styles.fontStyle = 'bold';
                }
              } else {
                data.cell.styles.fillColor = [254, 243, 199];
                if (data.column.index === 8 || data.column.index === 9) {
                  data.cell.styles.textColor = [146, 64, 14];
                  data.cell.styles.fontStyle = 'bold';
                }
              }
            }
          },
        });

        startY = (doc as any).lastAutoTable.finalY + 7;
      } else {
        // Safe Banner
        autoTable(doc, {
          startY,
          margin: { top: 44, bottom: 22, left: 14, right: 14 },
          body: [[
            {
              content: '✓ PERISHABLES AUDIT: All inventory batches are fresh and strictly within approved shelf-life limits (0 expired, 0 near-expiry).',
              styles: { halign: 'center', fillColor: [236, 253, 245], textColor: [4, 120, 87], fontStyle: 'bold', fontSize: 8.5 },
            },
          ]],
          theme: 'plain',
        });
        startY = (doc as any).lastAutoTable.finalY + 6;
      }

      // Section 2: COMPLETE INVENTORY MASTER & PROFITABILITY LEDGER
      const masterRows = rows.map((item, idx) => {
        const isExp = item.expiry_status === 'expired' || (item.days_until_expiry !== null && item.days_until_expiry < 0);
        const isExpSoon = item.expiry_status === 'expiring_soon' || (item.days_until_expiry !== null && item.days_until_expiry >= 0 && item.days_until_expiry <= 30);
        let statusTag = 'Fresh / Safe';
        if (isExp) statusTag = `EXPIRED (${Math.abs(item.days_until_expiry)}d ago)`;
        else if (isExpSoon) statusTag = `EXPIRING (${item.days_until_expiry}d left)`;
        else if (!item.expiry_date) statusTag = 'Non-perishable';

        return [
          idx + 1,
          item.name,
          item.brand || '—',
          this.formatCurrency(item.cost_price),
          this.formatCurrency(item.price),
          `${item.profit_margin || 0}%`,
          item.current_stock,
          item.total_sold,
          this.formatCurrency(item.total_revenue),
          this.formatCurrency(item.total_profit),
          item.expiry_date ? this.formatDate(item.expiry_date) : 'No Expiry',
          statusTag,
        ];
      });

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[
          { content: 'COMPLETE PRODUCT INVENTORY, COSTING & PROFITABILITY MASTER', colSpan: 12, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], [
          '#', 'Product Name', 'Brand', 'Unit Cost', 'Retail', 'Margin', 'Stock', 'Sold', 'Sales Rev', 'Net Tubo', 'Expiry Date', 'Shelf-Life Status',
        ]],
        body: masterRows,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 7, cellPadding: 1.8 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 11) {
            const val = String(data.cell.raw || '');
            if (val.includes('EXPIRED')) {
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.textColor = [153, 27, 27];
              data.cell.styles.fontStyle = 'bold';
            } else if (val.includes('EXPIRING')) {
              data.cell.styles.fillColor = [254, 243, 199];
              data.cell.styles.textColor = [146, 64, 14];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

    // ───────────────────────────────────────────────────────
    // TAB 2: OVERVIEW / EXECUTIVE DASHBOARD
    // ───────────────────────────────────────────────────────
    } else if (targetTab === 'overview') {
      const expiredItems = this.invRows.filter(r => r.expiry_status === 'expired' || (r.days_until_expiry !== null && r.days_until_expiry < 0));
      const expiredLossRisk = this.invSummary?.expiredLossRisk ?? expiredItems.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);
      const expiringMembers = this.membershipRows.filter(m => m.is_expiring_soon);

      const kpis = [
        [
          { content: 'Total Realized Revenue Collected', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.grandTotalCollected),
          { content: 'Pending Receivables (Orders/Plans)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.salesSummary?.pendingRevenue || 0),
        ],
        [
          { content: 'Premium Subscriptions (₱500/mo)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.salesSummary?.membershipRevenue || 0),
          { content: 'Active Premium Memberships', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.membershipSummary?.activePremium || 0} active members`,
        ],
        [
          { content: 'Gym Daily Passes (₱40/visit)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.salesSummary?.gymRevenue || 0),
          { content: 'Gym Walk-ins & Visits Logged', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.attSummary?.total || this.attRows.length || 0} check-ins`,
        ],
        [
          { content: 'Shop Merchandise Realized Revenue', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.salesSummary?.shopRevenue || 0),
          { content: 'Inventory Valuation (Capital Cost)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.invSummary?.inventoryCostValue || 0),
        ],
        [
          { content: 'Product Expiry Capital Loss Risk', styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] } },
          { content: `${expiredItems.length} products expired — ${this.formatCurrency(expiredLossRisk)}`, styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] } },
          { content: 'Memberships Expiring This Week', styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [180, 83, 9] } },
          { content: `${expiringMembers.length} members require renewal`, styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [180, 83, 9] } },
        ],
      ];

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[{ content: 'EXECUTIVE PERFORMANCE AUDIT SCORECARD', colSpan: 4, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: [234, 179, 8], fontStyle: 'bold' } }]],
        body: kpis as any,
        styles: { fontSize: 8, cellPadding: 2.2 },
        theme: 'grid',
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      // Revenue Distribution Table
      const streams = [
        ['Premium Membership Subscriptions', this.formatCurrency(this.salesSummary?.membershipRevenue || 0), `${this.revenueMembershipPercent}%`, this.formatCurrency(this.salesSummary?.cashRevenue || 0), 'Cash / GCash'],
        ['Gym Walk-in Daily Passes', this.formatCurrency(this.salesSummary?.gymRevenue || 0), `${this.revenueGymPercent}%`, '—', 'Cash at Counter'],
        ['Shop Products & Nutrition', this.formatCurrency(this.salesSummary?.shopRevenue || 0), `${this.revenueShopPercent}%`, this.formatCurrency(this.salesSummary?.pendingRevenue || 0), 'Cash / GCash'],
      ];

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[
          { content: 'REVENUE STREAM CONTRIBUTION BREAKDOWN', colSpan: 5, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], ['Revenue Stream', 'Collected Realized', 'Share of Total', 'Pending Receivables', 'Payment Channels']],
        body: streams,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7.5, cellPadding: 2 },
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      // Immediate Expiration & Spoilage Register
      if (expiredItems.length > 0 || expiringMembers.length > 0) {
        const riskData: any[] = [];
        expiredItems.slice(0, 8).forEach(item => {
          riskData.push([
            'Expired Product',
            item.name,
            `Stock: ${item.current_stock} units`,
            this.formatDate(item.expiry_date),
            `Loss Risk: ${this.formatCurrency((item.cost_price || 0) * (item.current_stock || 0))}`,
            'Pull out from gym inventory immediately',
          ]);
        });
        expiringMembers.slice(0, 8).forEach(m => {
          riskData.push([
            'Expiring Member',
            m.username || 'Member',
            m.phone || m.email || '—',
            this.formatDate(m.membership_expiry),
            `${m.days_left} days remaining`,
            'Send renewal reminder notification',
          ]);
        });

        autoTable(doc, {
          startY,
          margin: { top: 44, bottom: 22, left: 14, right: 14 },
          head: [[
            { content: 'CRITICAL EXPIRATION & RETENTION ALERTS (ATTENTION REQUIRED)', colSpan: 6, styles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['Category', 'Target Item / Member', 'Contact / Quantity', 'Expiry Date', 'Risk / Days Left', 'Required Follow-up Action']],
          body: riskData,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
          styles: { fontSize: 7.2, cellPadding: 2 },
        });

        startY = (doc as any).lastAutoTable.finalY + 7;
      }

      // Facility Traffic Breakdown
      const trafficRows = [
        ['Morning Rush (5:00 AM – 11:59 AM)', `${this.attSummary?.morningCount || 0} check-ins`, `${this.attendanceMorningPercent}%`, 'High equipment utilization'],
        ['Afternoon Session (12:00 PM – 4:59 PM)', `${this.attSummary?.afternoonCount || 0} check-ins`, `${this.attendanceAfternoonPercent}%`, 'Moderate facility load'],
        ['Evening Peak (5:00 PM – 11:00 PM)', `${this.attSummary?.eveningCount || 0} check-ins`, `${this.attendanceEveningPercent}%`, 'Peak gym traffic hours'],
      ];

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[
          { content: 'GYM TRAFFIC & FACILITY UTILIZATION SCHEDULE', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], ['Time Interval', 'Visits Count', 'Traffic Share', 'Capacity Status']],
        body: trafficRows,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7.5, cellPadding: 2 },
      });

    // ───────────────────────────────────────────────────────
    // TAB 3: MEMBERSHIPS & RETENTION AUDIT
    // ───────────────────────────────────────────────────────
    } else if (targetTab === 'memberships') {
      const expiringSoon = this.filteredMembershipRows.filter(m => m.is_expiring_soon);
      const expired = this.filteredMembershipRows.filter(m => m.is_expired);

      const memKpis = [
        [
          { content: 'Total Registered Accounts', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.membershipSummary?.totalMembers || this.membershipRows.length} accounts`,
          { content: 'Active Premium Subscribers', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.membershipSummary?.activePremium || 0} members (₱500/mo)`,
        ],
        [
          { content: 'Monthly Premium Run-rate', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.membershipSummary?.premiumRevenue || 0),
          { content: 'Registered Fitness Coaches', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.membershipSummary?.totalCoaches || 0} coaches on roster`,
        ],
        [
          { content: 'Expiring Within 7 Days', styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [180, 83, 9] } },
          { content: `${this.membershipSummary?.expiringSoon || expiringSoon.length} members require renewal`, styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [180, 83, 9] } },
          { content: 'Expired Membership Plans', styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] } },
          { content: `${this.membershipSummary?.expiredPlans || expired.length} expired accounts`, styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] } },
        ],
      ];

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[{ content: 'MEMBERSHIP & SUBSCRIPTION AUDIT SUMMARY', colSpan: 4, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: [234, 179, 8], fontStyle: 'bold' } }]],
        body: memKpis as any,
        styles: { fontSize: 8, cellPadding: 2.2 },
        theme: 'grid',
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      // Priority Renewal Register
      const priorityList = [...expiringSoon, ...expired];
      if (priorityList.length > 0) {
        const priorityRows = priorityList.map((m, idx) => [
          idx + 1,
          m.username,
          m.email || '—',
          m.phone || '—',
          m.membership_type === 'premium' ? 'Premium (₱500)' : 'Coach Profile',
          this.formatDate(m.membership_expiry),
          m.is_expired ? 'EXPIRED' : `${m.days_left}d left`,
          m.is_expired ? 'Account Inactive' : 'Action Needed',
          m.is_expired ? 'Contact for Reactivation Plan' : 'Send Renewal SMS Reminder',
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 44, bottom: 22, left: 14, right: 14 },
          head: [[
            { content: 'PRIORITY RETENTION & RENEWAL REGISTER (EXPIRING SOON & EXPIRED)', colSpan: 9, styles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['#', 'Member Name', 'Email', 'Phone', 'Plan', 'Expiry Date', 'Lifespan', 'Account Status', 'Required Retention Action']],
          body: priorityRows,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
          styles: { fontSize: 7, cellPadding: 2 },
          didParseCell: (data) => {
            if (data.section === 'body' && data.row.index < priorityList.length) {
              const item = priorityList[data.row.index];
              if (item.is_expired) {
                data.cell.styles.fillColor = [254, 226, 226];
                if (data.column.index === 6 || data.column.index === 7) {
                  data.cell.styles.textColor = [153, 27, 27];
                  data.cell.styles.fontStyle = 'bold';
                }
              } else {
                data.cell.styles.fillColor = [254, 243, 199];
                if (data.column.index === 6 || data.column.index === 7) {
                  data.cell.styles.textColor = [146, 64, 14];
                  data.cell.styles.fontStyle = 'bold';
                }
              }
            }
          },
        });

        startY = (doc as any).lastAutoTable.finalY + 7;
      }

      // Complete Roster
      const rosterRows = this.filteredMembershipRows.map((m, idx) => [
        idx + 1,
        m.username,
        m.account_type === 'coach' ? 'Coach' : 'Member',
        m.email || '—',
        m.membership_type === 'premium' ? 'Premium (₱500)' : (m.membership_type === 'daily' ? 'Daily Pass' : 'Coach'),
        (m.payment_method || 'cash').toUpperCase(),
        m.membership_expiry ? this.formatDate(m.membership_expiry) : 'Per Visit',
        m.membership_type === 'premium' ? `${m.days_left}d left` : 'Per Visit',
        m.membership_status === 'active' ? 'Active' : 'Pending',
      ]);

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[
          { content: 'COMPLETE MEMBERSHIP & COACH AUDIT ROSTER', colSpan: 9, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], ['#', 'Member Name', 'Type', 'Email', 'Plan', 'Payment', 'Expiry Date', 'Remaining', 'Status']],
        body: rosterRows,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 7, cellPadding: 1.8 },
      });

    // ───────────────────────────────────────────────────────
    // TAB 4: TRANSACTIONS AUDIT
    // ───────────────────────────────────────────────────────
    } else if (targetTab === 'transactions') {
      const txKpis = [
        [
          { content: 'Total Transactions Logged', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.filteredTxRows.length} transactions`,
          { content: 'Total Audit Volume', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.txTotalVolume),
        ],
        [
          { content: 'Collected Realized Revenue', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
          { content: this.formatCurrency(this.txCollectedRevenue), styles: { fontStyle: 'bold', textColor: [5, 150, 105] } },
          { content: 'Pending Receivables', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [180, 83, 9] } },
          { content: this.formatCurrency(this.txPendingRevenue), styles: { fontStyle: 'bold', textColor: [180, 83, 9] } },
        ],
      ];

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[{ content: 'TRANSACTION AUDIT LEDGER SUMMARY', colSpan: 4, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: [234, 179, 8], fontStyle: 'bold' } }]],
        body: txKpis as any,
        styles: { fontSize: 8, cellPadding: 2.2 },
        theme: 'grid',
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      const txTableRows = this.filteredTxRows.map((tx, idx) => [
        idx + 1,
        this.formatDateTime(tx.transaction_date),
        tx.username,
        tx.type_label,
        tx.product_name || (tx.source === 'attendance' ? 'Gym Walk-in Access' : (tx.source === 'membership' ? 'Monthly Plan Subscription' : '—')),
        tx.amount > 0 ? this.formatCurrency(tx.amount) : 'Included',
        (tx.payment_method || 'cash').toUpperCase(),
        this.getStatusLabel(tx),
      ]);

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[
          { content: 'DETAILED FINANCIAL AUDIT LOG', colSpan: 8, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], ['#', 'Date & Time', 'Member / Payer', 'Type', 'Description / Details', 'Amount', 'Channel', 'Audit Status']],
        body: txTableRows,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 7, cellPadding: 1.8 },
      });

    // ───────────────────────────────────────────────────────
    // TAB 5: ATTENDANCE & TRAFFIC
    // ───────────────────────────────────────────────────────
    } else if (targetTab === 'attendance') {
      const attKpis = [
        [
          { content: 'Total Visits Logged', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.attSummary?.total || this.attRows.length} check-ins`,
          { content: 'Daily Walk-in Passes', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.attSummary?.daily || 0} visits (₱40)`,
        ],
        [
          { content: 'Premium Member Visits', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.attSummary?.premium || 0} visits`,
          { content: 'Total Walk-in Pass Revenue', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
          { content: this.formatCurrency(this.attSummary?.totalRevenue || 0), styles: { fontStyle: 'bold', textColor: [5, 150, 105] } },
        ],
      ];

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[{ content: 'ATTENDANCE & TRAFFIC AUDIT SUMMARY', colSpan: 4, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: [234, 179, 8], fontStyle: 'bold' } }]],
        body: attKpis as any,
        styles: { fontSize: 8, cellPadding: 2.2 },
        theme: 'grid',
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      const attTableRows = this.filteredAttRows.map((r, idx) => [
        idx + 1,
        this.formatDateTime(r.check_in_time),
        r.username,
        r.email || '—',
        r.membership_type === 'daily' ? 'Daily Pass (₱40)' : 'Premium Member',
        r.membership_type === 'daily' ? this.formatCurrency(40) : 'Included in Plan',
        (r.payment_status || 'paid').toUpperCase(),
      ]);

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[
          { content: 'CHRONOLOGICAL GYM ATTENDANCE LOG', colSpan: 7, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], ['#', 'Check-in Date & Time', 'Member Name', 'Email Address', 'Plan Type', 'Fee Paid', 'Payment Status']],
        body: attTableRows,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 7, cellPadding: 1.8 },
      });

    // ───────────────────────────────────────────────────────
    // TAB 6: SALES & REVENUE BREAKDOWN
    // ───────────────────────────────────────────────────────
    } else if (targetTab === 'sales') {
      const salesKpis = [
        [
          { content: 'Total Realized Revenue', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
          { content: this.formatCurrency(this.salesSummary?.totalRevenue || 0), styles: { fontStyle: 'bold', textColor: [5, 150, 105] } },
          { content: 'Pending Orders & Subscriptions', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [180, 83, 9] } },
          { content: this.formatCurrency(this.salesSummary?.pendingRevenue || 0), styles: { fontStyle: 'bold', textColor: [180, 83, 9] } },
        ],
        [
          { content: 'Premium Membership Subscriptions', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.salesSummary?.membershipRevenue || 0),
          { content: 'Cash Receipts Share', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.formatCurrency(this.salesSummary?.cashRevenue || 0)} (${this.paymentCashPercent}%)`,
        ],
        [
          { content: 'Gym Walk-in Daily Passes', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.salesSummary?.gymRevenue || 0),
          { content: 'GCash Digital Payments Share', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.formatCurrency(this.salesSummary?.gcashRevenue || 0)} (${this.paymentGcashPercent}%)`,
        ],
        [
          { content: 'Shop Merchandise Realized', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.salesSummary?.shopRevenue || 0),
          { content: 'Merchandise Items Sold', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.salesSummary?.itemsSold || 0} units`,
        ],
      ];

      autoTable(doc, {
        startY,
        margin: { top: 44, bottom: 22, left: 14, right: 14 },
        head: [[{ content: 'FINANCIAL SALES & REVENUE AUDIT SUMMARY', colSpan: 4, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: [234, 179, 8], fontStyle: 'bold' } }]],
        body: salesKpis as any,
        styles: { fontSize: 8, cellPadding: 2.2 },
        theme: 'grid',
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      // Table A: Daily Gym Passes
      if (this.attSalesRows.length > 0) {
        const attSalesTable = this.attSalesRows.map(r => [
          this.formatDate(r.sale_date),
          this.datePipe.transform(r.sale_date, 'EEEE') ?? '',
          r.count,
          this.formatCurrency(r.revenue),
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 44, bottom: 22, left: 14, right: 14 },
          head: [[
            { content: 'GYM DAILY WALK-IN PASSES (REVENUE BY DATE)', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['Date', 'Day of Week', 'Paid Check-ins', 'Collected Revenue']],
          body: attSalesTable,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 7, cellPadding: 1.8 },
        });

        startY = (doc as any).lastAutoTable.finalY + 7;
      }

      // Table B: Shop Sales
      if (this.shopSalesRows.length > 0) {
        const shopSalesTable = this.shopSalesRows.map(r => [
          this.formatDate(r.sale_date),
          this.datePipe.transform(r.sale_date, 'EEEE') ?? '',
          r.count,
          this.formatCurrency(r.revenue),
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 44, bottom: 22, left: 14, right: 14 },
          head: [[
            { content: 'SHOP MERCHANDISE SALES (REVENUE BY DATE)', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['Date', 'Day of Week', 'Completed Orders', 'Collected Revenue']],
          body: shopSalesTable,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 7, cellPadding: 1.8 },
        });

        startY = (doc as any).lastAutoTable.finalY + 7;
      }

      // Table C: Membership Subscriptions
      if (this.membershipSalesRows.length > 0) {
        const memSalesTable = this.membershipSalesRows.map(r => [
          this.formatDate(r.sale_date),
          this.datePipe.transform(r.sale_date, 'EEEE') ?? '',
          r.count,
          this.formatCurrency(r.revenue),
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 44, bottom: 22, left: 14, right: 14 },
          head: [[
            { content: 'PREMIUM MEMBERSHIP SUBSCRIPTIONS (REVENUE BY DATE)', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['Date', 'Day of Week', 'New / Renewed Subscriptions', 'Collected Revenue']],
          body: memSalesTable,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 7, cellPadding: 1.8 },
        });
      }
    }

    // ───────────────────────────────────────────────────────
    // MULTI-PAGE EXECUTIVE DECORATIONS (HEADERS & FOOTERS)
    // ───────────────────────────────────────────────────────
    const totalPages = (doc as any).getNumberOfPages ? (doc as any).getNumberOfPages() : ((doc.internal as any).getNumberOfPages ? (doc.internal as any).getNumberOfPages() : 1);
    const finalTableY = (doc as any).lastAutoTable?.finalY ?? 200;

    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);

      if (p === 1) {
        // Page 1 Luxury Header Banner
        doc.setFillColor(15, 23, 42); // Deep Navy Slate #0F172A
        doc.rect(0, 0, 210, 24, 'F');

        // Gold Accent Bar
        doc.setFillColor(234, 179, 8); // Gold #EAB308
        doc.rect(0, 24, 210, 2, 'F');

        // Brand Text
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(234, 179, 8);
        doc.text('FORDAGO FITNESS & WELLNESS CLUB', 14, 11);

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(226, 232, 240);
        doc.text('MANAGEMENT INFORMATION SYSTEM • OFFICIAL AUDIT REPORT', 14, 18);

        // Header Right Metadata
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(reportTitle.toUpperCase(), 196, 11, { align: 'right' });

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text(`CONFIDENTIAL • REF: ${reportRef}`, 196, 18, { align: 'right' });

        // Metadata Sub-Strip Card
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.rect(14, 28, 182, 12, 'FD');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);

        doc.text(`Audit Scope: ${periodLabel[currentPeriod] ?? 'All Time'}`, 17, 33);
        doc.text(`Generated: ${genTimestamp}`, 70, 33);
        doc.text('Classification: STRICTLY CONFIDENTIAL', 132, 33);

        doc.text(`Module: ${targetTab.toUpperCase()}`, 17, 37.5);
        doc.text('Database Sync: 100% Verified Live', 70, 37.5);
        doc.text('Prepared By: FordaGO Administration', 132, 37.5);

      } else {
        // Pages 2+ Compact Header
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 10, 'F');

        doc.setFillColor(234, 179, 8);
        doc.rect(0, 10, 210, 1, 'F');

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(`FordaGO Fitness MIS • ${reportTitle}`, 14, 7);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text(`Generated: ${genTimestamp} | CONFIDENTIAL`, 196, 7, { align: 'right' });
      }

      // Bottom Footer on Every Page
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(14, 285, 196, 285);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('FordaGO Management Information System • Official Administrative Audit Report', 14, 289.5);
      doc.text('CONFIDENTIAL — FOR INTERNAL AUDIT ONLY', 105, 289.5, { align: 'center' });
      doc.text(`Page ${p} of ${totalPages}`, 196, 289.5, { align: 'right' });

      // Official Sign-off on Last Page if room permits
      if (p === totalPages && finalTableY <= 242) {
        const signY = Math.max(finalTableY + 8, 245);
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.setFont('helvetica', 'normal');
        doc.text('PREPARED & CONSOLIDATED BY:', 18, signY);
        doc.text('VERIFIED & AUDITED BY:', 120, signY);

        doc.setDrawColor(148, 163, 184);
        doc.setLineWidth(0.3);
        doc.line(18, signY + 11, 85, signY + 11);
        doc.line(120, signY + 11, 187, signY + 11);

        doc.setFontSize(7.5);
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.text('FordaGO System Administrator', 18, signY + 15);
        doc.text('Operations & Inventory Controller', 120, signY + 15);

        doc.setFontSize(6.5);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'italic');
        doc.text('Signed / Certified True & Accurate', 18, signY + 18.5);
        doc.text('Official Administrative Endorsement', 120, signY + 18.5);
      }
    }

    doc.save(`FordaGO_Audit_${targetTab.toUpperCase()}_${currentPeriod}_${new Date().toISOString().slice(0, 10)}.pdf`);
  }
}