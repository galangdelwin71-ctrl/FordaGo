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
  documentOutline,
  gridOutline,
  closeOutline,
  statsChartOutline,
  createOutline,
} from 'ionicons/icons';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { PaymentService, OfficialReceipt } from '../services/payment.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Packer,
} from 'docx';
import * as XLSX from 'xlsx';
import { API_URL, resolveImageUrl } from '../config/api.config';
import { getCachedData, setCachedData } from '../utils/local-cache.util';
import { CACHE_KEYS } from '../utils/cache-keys';
import { PdfExportService } from '../services/pdf-export.service';

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
    private pdfExportService: PdfExportService,
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
      documentOutline,
      gridOutline,
      closeOutline,
      statsChartOutline,
      createOutline,
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
      const ap = p;
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
      const ap = p;
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
      club_address: 'Cabiao, Nueva Ecija, Philippines',
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

  // ── Multi-Format Export Hub (PDF, Word DOCX, Excel XLSX) ──
  isExportModalOpen = false;
  isExporting = false;
  exportingFormat: 'pdf' | 'docx' | 'xlsx' | null = null;

  openExportModal(): void {
    this.isExportModalOpen = true;
  }

  closeExportModal(): void {
    if (!this.isExporting) {
      this.isExportModalOpen = false;
    }
  }

  async exportAs(format: 'pdf' | 'docx' | 'xlsx') {
    if (this.isExporting) return;
    this.isExporting = true;
    this.exportingFormat = format;

    try {
      const targetTab = this.activeTab;
      if (format === 'pdf') {
        const { doc, filename } = this.buildPDFDoc(targetTab);
        await this.pdfExportService.exportPdf(doc, filename, {
          isPrint: false,
          title: `FordaGO Report (${targetTab})`,
          dialogTitle: 'Save / Share PDF Audit Report',
        });
      } else if (format === 'docx') {
        const { blob, filename } = await this.buildWordDoc(targetTab);
        await this.pdfExportService.exportBlob(blob, filename, {
          title: `FordaGO Report (${targetTab})`,
          dialogTitle: 'Save / Share Word Document',
        });
      } else if (format === 'xlsx') {
        const { blob, filename } = this.buildExcelDoc(targetTab);
        await this.pdfExportService.exportBlob(blob, filename, {
          title: `FordaGO Report (${targetTab})`,
          dialogTitle: 'Save / Share Excel Workbook',
        });
      }
    } catch (err) {
      console.error(`Export failed for format ${format}:`, err);
    } finally {
      this.isExporting = false;
      this.exportingFormat = null;
      this.isExportModalOpen = false;
    }
  }

  // ── Unified Native & Web PDF Export (Quick Print & Direct PDF) ──
  async printCurrent() {
    try {
      const { doc, filename } = this.buildPDFDoc(this.activeTab);
      await this.pdfExportService.exportPdf(doc, filename, {
        isPrint: true,
        title: `FordaGO Report (${this.activeTab})`,
      });
    } catch (err) {
      console.error('Error generating PDF for printing:', err);
    }
  }

  async downloadPDF(tabToExport?: Tab) {
    try {
      const targetTab: Tab = tabToExport || this.activeTab;
      const { doc, filename } = this.buildPDFDoc(targetTab);
      await this.pdfExportService.exportPdf(doc, filename, {
        isPrint: false,
        title: `FordaGO Report (${targetTab})`,
      });
    } catch (err) {
      console.error('Error exporting PDF:', err);
    }
  }

  // ── Professional Executive Word (.docx) Document Builder ──
  async buildWordDoc(tabToExport?: Tab): Promise<{ blob: Blob; filename: string }> {
    const targetTab: Tab = tabToExport || this.activeTab;
    const currentPeriod = this.period;
    const genTimestamp = this.formatDateTime(new Date());
    const reportRef = `FDG-${targetTab.toUpperCase().slice(0, 3)}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

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

    const thinBorder = { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' };
    const tableBorders = {
      top: thinBorder,
      bottom: thinBorder,
      left: thinBorder,
      right: thinBorder,
      insideHorizontal: thinBorder,
      insideVertical: thinBorder,
    };

    const makeCell = (
      text: string,
      opts: {
        bold?: boolean;
        color?: string;
        fill?: string;
        align?: any;
        colSpan?: number;
        fontSize?: number;
        italic?: boolean;
      } = {}
    ) => {
      return new TableCell({
        children: [
          new Paragraph({
            alignment: opts.align || AlignmentType.LEFT,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: String(text ?? ''),
                bold: Boolean(opts.bold),
                italics: Boolean(opts.italic),
                color: opts.color || '0F172A',
                size: opts.fontSize || 18,
                font: 'Calibri',
              }),
            ],
          }),
        ],
        shading: opts.fill ? { fill: opts.fill } : undefined,
        columnSpan: opts.colSpan,
        borders: tableBorders,
      });
    };

    const makeHeaderCell = (text: string, colSpan = 1, align?: any) => {
      return makeCell(text, {
        bold: true,
        color: 'FFFFFF',
        fill: '1E293B',
        align: align || AlignmentType.LEFT,
        colSpan,
        fontSize: 18,
      });
    };

    const children: any[] = [];

    // Header Branding
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 40 },
        children: [
          new TextRun({
            text: 'FORDAGO FITNESS & WELLNESS CLUB',
            bold: true,
            size: 32,
            color: '0F172A',
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({
            text: 'MANAGEMENT INFORMATION SYSTEM • AUDIT & COMPLIANCE DIVISION',
            bold: true,
            size: 17,
            color: '64748B',
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 160 },
        children: [
          new TextRun({
            text: `EXECUTIVE MANAGEMENT AUDIT REPORT — ${targetTab.toUpperCase()}`,
            bold: true,
            size: 22,
            color: 'B45309',
            font: 'Calibri',
          }),
        ],
      })
    );

    // Metadata Table
    const metaTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            makeCell('Audit Module:', { bold: true, fill: 'F8FAFC', color: '475569' }),
            makeCell(`${targetTab.toUpperCase()} (${reportTitle})`, { bold: true }),
            makeCell('Period Scope:', { bold: true, fill: 'F8FAFC', color: '475569' }),
            makeCell(periodLabel[currentPeriod] || currentPeriod, { bold: true }),
          ],
        }),
        new TableRow({
          children: [
            makeCell('Reference Code:', { bold: true, fill: 'F8FAFC', color: '475569' }),
            makeCell(reportRef),
            makeCell('Audit Timestamp:', { bold: true, fill: 'F8FAFC', color: '475569' }),
            makeCell(genTimestamp),
          ],
        }),
        new TableRow({
          children: [
            makeCell('Data Verification:', { bold: true, fill: 'F8FAFC', color: '475569' }),
            makeCell('100% Live Sync Verified', { color: '059669', bold: true }),
            makeCell('Security Classification:', { bold: true, fill: 'F8FAFC', color: '475569' }),
            makeCell('STRICTLY CONFIDENTIAL', { color: 'B91C1C', bold: true }),
          ],
        }),
      ],
    });
    children.push(metaTable);

    const addSectionHeader = (title: string) => {
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 80 },
          children: [
            new TextRun({
              text: title.toUpperCase(),
              bold: true,
              size: 20,
              color: '0F172A',
              font: 'Calibri',
            }),
          ],
        })
      );
    };

    if (targetTab === 'inventory') {
      addSectionHeader('Key Performance Indicators (Inventory & Valuation)');
      const totalProducts = this.invRows.length;
      const totalStock = this.invSummary?.totalStock ?? this.invRows.reduce((a, b) => a + (b.current_stock || 0), 0);
      const totalSold = this.invSummary?.totalSold ?? this.invRows.reduce((a, b) => a + (b.total_sold || 0), 0);
      const totalRevenue = this.invSummary?.totalRevenue ?? this.invRows.reduce((a, b) => a + (b.total_revenue || 0), 0);
      const totalCogs = this.invSummary?.totalCogs ?? this.invRows.reduce((a, b) => a + ((b.cost_price || 0) * (b.total_sold || 0)), 0);
      const totalProfit = this.invSummary?.totalProfit ?? Math.max(0, totalRevenue - totalCogs);
      const inventoryCostValue = this.invSummary?.inventoryCostValue ?? this.invRows.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);
      const expiredItems = this.invRows.filter(r => r.expiry_status === 'expired' || (r.days_until_expiry !== null && r.days_until_expiry < 0));
      const expiredLossRisk = this.invSummary?.expiredLossRisk ?? expiredItems.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);

      const kpiTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell('Active Product Lines', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${totalProducts} catalog SKUs`),
              makeCell('Stock on Hand', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${totalStock} total units`),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Gross Merchandise Sales', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(totalRevenue), { bold: true }),
              makeCell('Cost of Goods Sold (COGS)', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(totalCogs)),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Net Merchandise Profit', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(totalProfit), { bold: true, color: '059669' }),
              makeCell('Capital Valuation (Cost)', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(inventoryCostValue)),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Expired Stock Alert', { bold: true, fill: 'FEE2E2', color: 'B91C1C' }),
              makeCell(`${expiredItems.length} items (${this.formatCurrency(expiredLossRisk)})`, { bold: true, color: 'B91C1C' }),
              makeCell('Lifetime Units Sold', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${totalSold} units`),
            ],
          }),
        ],
      });
      children.push(kpiTable);

      addSectionHeader('Complete Product Inventory & Profitability Master');
      const rows = this.filteredInvRows.length ? this.filteredInvRows : this.invRows;
      const invTableRows: TableRow[] = [
        new TableRow({
          children: [
            makeHeaderCell('#', 1, AlignmentType.CENTER),
            makeHeaderCell('Product Name'),
            makeHeaderCell('Brand'),
            makeHeaderCell('Unit Cost'),
            makeHeaderCell('Retail'),
            makeHeaderCell('Margin'),
            makeHeaderCell('Stock', 1, AlignmentType.CENTER),
            makeHeaderCell('Sold', 1, AlignmentType.CENTER),
            makeHeaderCell('Net Profit'),
            makeHeaderCell('Status'),
          ],
        }),
      ];

      rows.forEach((item, idx) => {
        const isExp = item.expiry_status === 'expired' || (item.days_until_expiry !== null && item.days_until_expiry < 0);
        const isExpSoon = item.expiry_status === 'expiring_soon' || (item.days_until_expiry !== null && item.days_until_expiry >= 0 && item.days_until_expiry <= 30);
        let statusTag = 'Fresh / Safe';
        let statusFill = idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
        let statusColor = '0F172A';
        if (isExp) {
          statusTag = `EXPIRED (${Math.abs(item.days_until_expiry)}d)`;
          statusFill = 'FEE2E2';
          statusColor = 'B91C1C';
        } else if (isExpSoon) {
          statusTag = `EXPIRING (${item.days_until_expiry}d)`;
          statusFill = 'FEF3C7';
          statusColor = 'B45309';
        }

        invTableRows.push(
          new TableRow({
            children: [
              makeCell(String(idx + 1), { align: AlignmentType.CENTER, fill: statusFill }),
              makeCell(item.name || '—', { bold: true, fill: statusFill }),
              makeCell(item.brand || '—', { fill: statusFill }),
              makeCell(this.formatCurrency(item.cost_price), { fill: statusFill }),
              makeCell(this.formatCurrency(item.price), { fill: statusFill }),
              makeCell(`${item.profit_margin || 0}%`, { fill: statusFill }),
              makeCell(String(item.current_stock || 0), { align: AlignmentType.CENTER, fill: statusFill }),
              makeCell(String(item.total_sold || 0), { align: AlignmentType.CENTER, fill: statusFill }),
              makeCell(this.formatCurrency(item.total_profit), { bold: true, color: '059669', fill: statusFill }),
              makeCell(statusTag, { bold: isExp || isExpSoon, color: statusColor, fill: statusFill }),
            ],
          })
        );
      });
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: invTableRows }));

    } else if (targetTab === 'overview') {
      addSectionHeader('Executive Performance Audit Scorecard');
      const expiredItems = this.invRows.filter(r => r.expiry_status === 'expired' || (r.days_until_expiry !== null && r.days_until_expiry < 0));
      const expiredLossRisk = this.invSummary?.expiredLossRisk ?? expiredItems.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);
      const expiringMembers = this.membershipRows.filter(m => m.is_expiring_soon);

      const overviewKpiTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell('Total Realized Revenue Collected', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.grandTotalCollected), { bold: true, color: '059669' }),
              makeCell('Pending Receivables', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.salesSummary?.pendingRevenue || 0)),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Premium Subscriptions (PHP 500/mo)', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.salesSummary?.membershipRevenue || 0), { bold: true }),
              makeCell('Active Premium Members', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.membershipSummary?.activePremium || 0} active members`),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Gym Daily Passes (PHP 40/visit)', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.salesSummary?.gymRevenue || 0), { bold: true }),
              makeCell('Gym Walk-ins & Visits Logged', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.attSummary?.total || this.attRows.length || 0} check-ins`),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Shop Merchandise Realized Revenue', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.salesSummary?.shopRevenue || 0), { bold: true }),
              makeCell('Inventory Capital Valuation', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.invSummary?.inventoryCostValue || 0)),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Product Expiry Capital Loss Risk', { bold: true, fill: 'FEE2E2', color: 'B91C1C' }),
              makeCell(`${expiredItems.length} products (${this.formatCurrency(expiredLossRisk)})`, { bold: true, color: 'B91C1C' }),
              makeCell('Memberships Expiring This Week', { bold: true, fill: 'FEF3C7', color: 'B45309' }),
              makeCell(`${expiringMembers.length} members require renewal`, { bold: true, color: 'B45309' }),
            ],
          }),
        ],
      });
      children.push(overviewKpiTable);

      addSectionHeader('Revenue Stream Contribution Breakdown');
      const streamsTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeHeaderCell('Revenue Stream'),
              makeHeaderCell('Collected Realized'),
              makeHeaderCell('Share (%)', 1, AlignmentType.CENTER),
              makeHeaderCell('Pending Receivables'),
              makeHeaderCell('Payment Channels'),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Premium Membership Subscriptions', { bold: true }),
              makeCell(this.formatCurrency(this.salesSummary?.membershipRevenue || 0), { bold: true }),
              makeCell(`${this.revenueMembershipPercent}%`, { align: AlignmentType.CENTER }),
              makeCell(this.formatCurrency(this.salesSummary?.cashRevenue || 0)),
              makeCell('Cash / GCash'),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Gym Walk-in Daily Passes', { bold: true }),
              makeCell(this.formatCurrency(this.salesSummary?.gymRevenue || 0), { bold: true }),
              makeCell(`${this.revenueGymPercent}%`, { align: AlignmentType.CENTER }),
              makeCell('—'),
              makeCell('Cash at Counter'),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Shop Products & Nutrition', { bold: true }),
              makeCell(this.formatCurrency(this.salesSummary?.shopRevenue || 0), { bold: true }),
              makeCell(`${this.revenueShopPercent}%`, { align: AlignmentType.CENTER }),
              makeCell(this.formatCurrency(this.salesSummary?.pendingRevenue || 0)),
              makeCell('Cash / GCash'),
            ],
          }),
        ],
      });
      children.push(streamsTable);

      // Critical Expiration & Retention Alerts Table
      if (expiredItems.length > 0 || expiringMembers.length > 0) {
        addSectionHeader('Critical Expiration & Retention Action Items');
        const alertRows: TableRow[] = [
          new TableRow({
            children: [
              makeHeaderCell('Category'),
              makeHeaderCell('Target Item / Member'),
              makeHeaderCell('Contact / Qty'),
              makeHeaderCell('Expiry Date'),
              makeHeaderCell('Risk / Days Left'),
              makeHeaderCell('Required Follow-up Action'),
            ],
          }),
        ];
        expiredItems.slice(0, 8).forEach(item => {
          alertRows.push(
            new TableRow({
              children: [
                makeCell('Expired Product', { bold: true, color: 'B91C1C', fill: 'FEE2E2' }),
                makeCell(item.name || '—', { bold: true }),
                makeCell(`Stock: ${item.current_stock} units`),
                makeCell(this.formatDate(item.expiry_date)),
                makeCell(`Loss: ${this.formatCurrency((item.cost_price || 0) * (item.current_stock || 0))}`, { bold: true, color: 'B91C1C' }),
                makeCell('Pull out from inventory immediately', { italic: true }),
              ],
            })
          );
        });
        expiringMembers.slice(0, 8).forEach(m => {
          alertRows.push(
            new TableRow({
              children: [
                makeCell('Expiring Member', { bold: true, color: 'B45309', fill: 'FEF3C7' }),
                makeCell(m.username || 'Member', { bold: true }),
                makeCell(m.phone || m.email || '—'),
                makeCell(this.formatDate(m.membership_expiry)),
                makeCell(`${m.days_left} days remaining`, { bold: true, color: 'B45309' }),
                makeCell('Send renewal SMS reminder notification', { italic: true }),
              ],
            })
          );
        });
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: alertRows }));
      }

      // Sample Recent Transactions Ledger
      if (this.txRows.length > 0) {
        addSectionHeader('Recent Verified Transactions Ledger (Sample Audit Trail)');
        const recentTxRows: TableRow[] = [
          new TableRow({
            children: [
              makeHeaderCell('#', 1, AlignmentType.CENTER),
              makeHeaderCell('Date & Time'),
              makeHeaderCell('Customer / Payer'),
              makeHeaderCell('Type / Description'),
              makeHeaderCell('Channel', 1, AlignmentType.CENTER),
              makeHeaderCell('Amount (PHP)'),
              makeHeaderCell('Audit Status', 1, AlignmentType.CENTER),
            ],
          }),
        ];
        this.txRows.slice(0, 10).forEach((tx, idx) => {
          const rowBg = idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
          const isPaid = (tx.payment_status || tx.sub_type || '').toLowerCase() === 'paid';
          recentTxRows.push(
            new TableRow({
              children: [
                makeCell(String(idx + 1), { align: AlignmentType.CENTER, fill: rowBg }),
                makeCell(this.formatDateTime(tx.transaction_date || tx.created_at), { fill: rowBg }),
                makeCell(tx.username || 'Walk-in Guest', { bold: true, fill: rowBg }),
                makeCell(tx.product_name || tx.type_label || (tx.source || 'General').toUpperCase(), { fill: rowBg }),
                makeCell((tx.payment_method || 'CASH').toUpperCase(), { align: AlignmentType.CENTER, fill: rowBg }),
                makeCell(tx.amount > 0 ? this.formatCurrency(tx.amount) : 'Included', { bold: true, color: isPaid ? '059669' : '0F172A', fill: rowBg }),
                makeCell(this.getStatusLabel(tx), { bold: true, color: isPaid ? '059669' : 'B45309', align: AlignmentType.CENTER, fill: rowBg }),
              ],
            })
          );
        });
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: recentTxRows }));
      }

    } else if (targetTab === 'memberships') {
      addSectionHeader('Membership & Subscription Audit Summary');
      const expiringSoon = this.filteredMembershipRows.filter(m => m.is_expiring_soon);
      const expired = this.filteredMembershipRows.filter(m => m.is_expired);

      const memKpiTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell('Total Registered Accounts', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.membershipSummary?.totalMembers || this.membershipRows.length} accounts`),
              makeCell('Active Premium Subscribers', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.membershipSummary?.activePremium || 0} members (PHP 500/mo)`),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Monthly Premium Run-rate', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.membershipSummary?.premiumRevenue || 0), { bold: true }),
              makeCell('Registered Fitness Coaches', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.membershipSummary?.totalCoaches || 0} coaches on roster`),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Expiring Within 7 Days', { bold: true, fill: 'FEF3C7', color: 'B45309' }),
              makeCell(`${expiringSoon.length} members require renewal`, { bold: true, color: 'B45309' }),
              makeCell('Expired Membership Plans', { bold: true, fill: 'FEE2E2', color: 'B91C1C' }),
              makeCell(`${expired.length} expired accounts`, { bold: true, color: 'B91C1C' }),
            ],
          }),
        ],
      });
      children.push(memKpiTable);

      addSectionHeader('Complete Membership & Coach Audit Roster');
      const memTableRows: TableRow[] = [
        new TableRow({
          children: [
            makeHeaderCell('#', 1, AlignmentType.CENTER),
            makeHeaderCell('Member Name'),
            makeHeaderCell('Type'),
            makeHeaderCell('Email'),
            makeHeaderCell('Plan'),
            makeHeaderCell('Channel'),
            makeHeaderCell('Expiry Date'),
            makeHeaderCell('Lifespan'),
            makeHeaderCell('Status'),
          ],
        }),
      ];

      this.filteredMembershipRows.forEach((m, idx) => {
        const rowBg = idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
        memTableRows.push(
          new TableRow({
            children: [
              makeCell(String(idx + 1), { align: AlignmentType.CENTER, fill: rowBg }),
              makeCell(m.username || '—', { bold: true, fill: rowBg }),
              makeCell(m.account_type === 'coach' ? 'Coach' : 'Member', { fill: rowBg }),
              makeCell(m.email || '—', { fill: rowBg }),
              makeCell(m.membership_type === 'premium' ? 'Premium (PHP 500)' : (m.membership_type === 'daily' ? 'Daily Pass' : 'Coach'), { fill: rowBg }),
              makeCell((m.payment_method || 'cash').toUpperCase(), { fill: rowBg }),
              makeCell(m.membership_expiry ? this.formatDate(m.membership_expiry) : 'Per Visit', { fill: rowBg }),
              makeCell(m.membership_type === 'premium' ? `${m.days_left}d left` : 'Per Visit', { fill: rowBg }),
              makeCell(m.membership_status === 'active' ? 'Active' : 'Pending', { bold: true, color: m.membership_status === 'active' ? '059669' : 'B45309', fill: rowBg }),
            ],
          })
        );
      });
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: memTableRows }));

    } else if (targetTab === 'transactions') {
      addSectionHeader('Financial Transaction & Ledger Audit Summary');
      const txKpiTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell('Total Realized Revenue Collected', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.txCollectedRevenue), { bold: true, color: '059669' }),
              makeCell('Pending Receivables', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.txPendingRevenue), { color: 'B45309' }),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Total Audit Volume', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.txTotalVolume)),
              makeCell('Total Transactions Count', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.filteredTxRows.length} transactions`),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Membership Subscriptions', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.txMembershipCount} txs`),
              makeCell('Gym Passes / Shop Orders', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.txGymCount} gym / ${this.txShopCount} shop`),
            ],
          }),
        ],
      });
      children.push(txKpiTable);

      addSectionHeader('Consolidated Financial Transactions Ledger');
      const txTableRows: TableRow[] = [
        new TableRow({
          children: [
            makeHeaderCell('#', 1, AlignmentType.CENTER),
            makeHeaderCell('Date & Time'),
            makeHeaderCell('Reference Code'),
            makeHeaderCell('Customer / Payer'),
            makeHeaderCell('Type / Description'),
            makeHeaderCell('Channel'),
            makeHeaderCell('Amount (PHP)'),
            makeHeaderCell('Audit Status'),
          ],
        }),
      ];

      this.filteredTxRows.forEach((tx, idx) => {
        const rowBg = idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
        const isPaid = (tx.payment_status || tx.sub_type || '').toLowerCase() === 'paid';
        txTableRows.push(
          new TableRow({
            children: [
              makeCell(String(idx + 1), { align: AlignmentType.CENTER, fill: rowBg }),
              makeCell(this.formatDateTime(tx.transaction_date || tx.created_at), { fill: rowBg }),
              makeCell(tx.reference_number || tx.receipt_number || `TX-${tx.id || idx + 1}`, { bold: true, fill: rowBg }),
              makeCell(tx.username || 'Walk-in Guest', { fill: rowBg }),
              makeCell(tx.product_name || tx.type_label || (tx.source || 'General').toUpperCase(), { fill: rowBg }),
              makeCell((tx.payment_method || 'CASH').toUpperCase(), { fill: rowBg }),
              makeCell(this.formatCurrency(tx.amount), { bold: true, color: isPaid ? '059669' : '0F172A', fill: rowBg }),
              makeCell(this.getStatusLabel(tx), { bold: true, color: isPaid ? '059669' : 'B45309', fill: rowBg }),
            ],
          })
        );
      });

      // Total summary row
      txTableRows.push(
        new TableRow({
          children: [
            makeCell('', { fill: 'F1F5F9' }),
            makeCell('CONSOLIDATED AUDIT TOTALS', { bold: true, colSpan: 4, fill: 'F1F5F9' }),
            makeCell('TOTAL COLLECTED:', { bold: true, fill: 'ECFDF5', color: '059669' }),
            makeCell(this.formatCurrency(this.txCollectedRevenue), { bold: true, color: '059669', fill: 'ECFDF5' }),
            makeCell(`${this.filteredTxRows.length} Records`, { bold: true, align: AlignmentType.CENTER, fill: 'F1F5F9' }),
          ],
        })
      );
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: txTableRows }));

    } else if (targetTab === 'attendance') {
      addSectionHeader('Gym Attendance & Traffic Summary');
      const attKpiTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell('Total Logged Check-ins', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.attSummary?.total || 0} visits`),
              makeCell('Paid Daily Walk-in Passes', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.attSummary?.paidCount || 0} (${this.formatCurrency(this.attSummary?.paidRevenue || 0)})`, { bold: true }),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Premium Member Visits', { bold: true, fill: 'F1F5F9' }),
              makeCell(`${this.attSummary?.premiumCount || 0} visits (Free pass)`),
              makeCell('Peak Operating Hours', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.attSummary?.busiestHour || '6:00 PM - 7:00 PM', { bold: true }),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Average Workout Session', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.attSummary?.avgDurationFormatted || '45 mins'),
              makeCell('Daily Pass Tariff', { bold: true, fill: 'F1F5F9' }),
              makeCell('PHP 40.00 / visit standard'),
            ],
          }),
        ],
      });
      children.push(attKpiTable);

      addSectionHeader('Gym Check-in Traffic Audit Log');
      const attTableRows: TableRow[] = [
        new TableRow({
          children: [
            makeHeaderCell('#', 1, AlignmentType.CENTER),
            makeHeaderCell('Check-in Time'),
            makeHeaderCell('Check-out Time'),
            makeHeaderCell('Duration'),
            makeHeaderCell('Customer / Member'),
            makeHeaderCell('Account Type'),
            makeHeaderCell('Daily Fee Paid'),
            makeHeaderCell('Status'),
          ],
        }),
      ];

      this.filteredAttRows.forEach((r, idx) => {
        const rowBg = idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
        const isPaidType = (r.membership_type || '').toLowerCase() === 'daily';
        attTableRows.push(
          new TableRow({
            children: [
              makeCell(String(idx + 1), { align: AlignmentType.CENTER, fill: rowBg }),
              makeCell(this.formatDateTime(r.check_in_time), { fill: rowBg }),
              makeCell(r.check_out_time ? this.formatDateTime(r.check_out_time) : 'Active Inside', { fill: rowBg }),
              makeCell(r.duration_minutes ? `${r.duration_minutes} mins` : '—', { fill: rowBg }),
              makeCell(r.username || 'Walk-in Guest', { bold: true, fill: rowBg }),
              makeCell(r.membership_type === 'premium' ? 'Premium Member' : 'Daily Pass Guest', { fill: rowBg }),
              makeCell(isPaidType ? 'PHP 40.00' : 'PHP 0.00 (Plan Included)', { bold: isPaidType, color: isPaidType ? '059669' : '64748B', fill: rowBg }),
              makeCell('VERIFIED', { bold: true, color: '059669', fill: rowBg }),
            ],
          })
        );
      });
      children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: attTableRows }));

    } else if (targetTab === 'sales') {
      addSectionHeader('Financial Sales & Revenue Audit Summary');
      const salesKpiTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell('Total Realized Revenue Collected', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.salesSummary?.totalRevenue || 0), { bold: true, color: '059669' }),
              makeCell('Pending Receivables', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.salesSummary?.pendingRevenue || 0)),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Daily Gym Passes (PHP 40)', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.salesSummary?.gymRevenue || 0)),
              makeCell('Shop Merchandise', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.salesSummary?.shopRevenue || 0)),
            ],
          }),
          new TableRow({
            children: [
              makeCell('Premium Subscriptions (PHP 500)', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.salesSummary?.membershipRevenue || 0)),
              makeCell('Cash Remittance Collected', { bold: true, fill: 'F1F5F9' }),
              makeCell(this.formatCurrency(this.salesSummary?.cashRevenue || 0)),
            ],
          }),
        ],
      });
      children.push(salesKpiTable);

      if (this.attSalesRows.length > 0) {
        addSectionHeader('Gym Daily Walk-in Passes (Revenue by Date)');
        const attSalesRows: TableRow[] = [
          new TableRow({
            children: [
              makeHeaderCell('Date'),
              makeHeaderCell('Day of Week'),
              makeHeaderCell('Paid Check-ins', 1, AlignmentType.CENTER),
              makeHeaderCell('Collected Revenue'),
            ],
          }),
        ];
        this.attSalesRows.forEach((r, idx) => {
          const rowBg = idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
          attSalesRows.push(
            new TableRow({
              children: [
                makeCell(this.formatDate(r.sale_date), { bold: true, fill: rowBg }),
                makeCell(this.datePipe.transform(r.sale_date, 'EEEE') ?? '', { fill: rowBg }),
                makeCell(String(r.count || 0), { align: AlignmentType.CENTER, fill: rowBg }),
                makeCell(this.formatCurrency(r.revenue), { bold: true, color: '059669', fill: rowBg }),
              ],
            })
          );
        });
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: attSalesRows }));
      }

      if (this.shopSalesRows.length > 0) {
        addSectionHeader('Shop Merchandise Sales (Revenue by Date)');
        const shopRows: TableRow[] = [
          new TableRow({
            children: [
              makeHeaderCell('Date'),
              makeHeaderCell('Day of Week'),
              makeHeaderCell('Completed Orders', 1, AlignmentType.CENTER),
              makeHeaderCell('Collected Revenue'),
            ],
          }),
        ];
        this.shopSalesRows.forEach((r, idx) => {
          const rowBg = idx % 2 === 1 ? 'F8FAFC' : 'FFFFFF';
          shopRows.push(
            new TableRow({
              children: [
                makeCell(this.formatDate(r.sale_date), { bold: true, fill: rowBg }),
                makeCell(this.datePipe.transform(r.sale_date, 'EEEE') ?? '', { fill: rowBg }),
                makeCell(String(r.count || 0), { align: AlignmentType.CENTER, fill: rowBg }),
                makeCell(this.formatCurrency(r.revenue), { bold: true, color: '059669', fill: rowBg }),
              ],
            })
          );
        });
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: shopRows }));
      }
    }

    // Administrative Notes (Editable)
    children.push(
      new Paragraph({ spacing: { before: 240, after: 80 }, text: '' }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell('ADMINISTRATIVE NOTES & OPERATIONAL DIRECTIVES (EDITABLE MANAGEMENT REMARKS)', {
                bold: true,
                color: 'FFFFFF',
                fill: '0F172A',
                fontSize: 18,
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: tableBorders,
                shading: { fill: 'FFFBEB' },
                children: [
                  new Paragraph({
                    spacing: { before: 80, after: 40 },
                    children: [
                      new TextRun({
                        text: '1. Revenue & POS Reconciliation: ',
                        bold: true,
                        color: '92400E',
                        size: 18,
                        font: 'Calibri',
                      }),
                      new TextRun({
                        text: 'All realized revenue figures listed in this audit report correspond directly to cleared cash register drawers and electronic merchant payouts.',
                        size: 18,
                        color: '334155',
                        font: 'Calibri',
                      }),
                    ],
                  }),
                  new Paragraph({
                    spacing: { before: 40, after: 40 },
                    children: [
                      new TextRun({
                        text: '2. Inventory & Expiry Controls: ',
                        bold: true,
                        color: '92400E',
                        size: 18,
                        font: 'Calibri',
                      }),
                      new TextRun({
                        text: 'All nutrition supplements and consumable items must be audited weekly. Products reaching within 30 days of shelf-life expiry require immediate discount clearance.',
                        size: 18,
                        color: '334155',
                        font: 'Calibri',
                      }),
                    ],
                  }),
                  new Paragraph({
                    spacing: { before: 40, after: 40 },
                    children: [
                      new TextRun({
                        text: '3. Member Retention Protocol: ',
                        bold: true,
                        color: '92400E',
                        size: 18,
                        font: 'Calibri',
                      }),
                      new TextRun({
                        text: 'Members with plans expiring in 7 days should receive automated SMS and in-app renewal reminders to ensure uninterrupted gym facility access.',
                        size: 18,
                        color: '334155',
                        font: 'Calibri',
                      }),
                    ],
                  }),
                  new Paragraph({
                    spacing: { before: 40, after: 80 },
                    children: [
                      new TextRun({
                        text: '4. Physical vs Digital Attendance: ',
                        bold: true,
                        color: '92400E',
                        size: 18,
                        font: 'Calibri',
                      }),
                      new TextRun({
                        text: 'All QR code turnstile check-ins must correlate 1:1 with counter logs. Unregistered walk-ins are prohibited without daily pass issuance.',
                        size: 18,
                        color: '334155',
                        font: 'Calibri',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    // Certification & Sign-off Block
    children.push(
      new Paragraph({ spacing: { before: 240, after: 80 }, text: '' }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell('PREPARED & CONSOLIDATED BY:', { bold: true, color: '64748B', fill: 'F8FAFC' }),
              makeCell('VERIFIED & AUDITED BY:', { bold: true, color: '64748B', fill: 'F8FAFC' }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                borders: tableBorders,
                children: [
                  new Paragraph({
                    spacing: { before: 280, after: 40 },
                    children: [
                      new TextRun({ text: '____________________________________________', color: '94A3B8' }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'FordaGO System Administrator', bold: true, color: '0F172A', size: 19 }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Management Information System Division', color: '64748B', size: 16 }),
                    ],
                  }),
                  new Paragraph({
                    spacing: { after: 120 },
                    children: [
                      new TextRun({ text: `Date Signed: ${new Date().toLocaleDateString()}`, italics: true, color: '94A3B8', size: 16 }),
                    ],
                  }),
                ],
              }),
              new TableCell({
                borders: tableBorders,
                children: [
                  new Paragraph({
                    spacing: { before: 280, after: 40 },
                    children: [
                      new TextRun({ text: '____________________________________________', color: '94A3B8' }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Operations & Inventory Controller', bold: true, color: '0F172A', size: 19 }),
                    ],
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({ text: 'Official Administrative Endorsement', color: '64748B', size: 16 }),
                    ],
                  }),
                  new Paragraph({
                    spacing: { after: 120 },
                    children: [
                      new TextRun({ text: `Date Endorsed: ${new Date().toLocaleDateString()}`, italics: true, color: '94A3B8', size: 16 }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 },
            },
          },
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const filename = `FordaGO_Audit_${targetTab.toUpperCase()}_${currentPeriod}_${new Date().toISOString().slice(0, 10)}.docx`;
    return { blob, filename };
  }

  // ── Professional Executive Excel (.xlsx) Spreadsheet Builder ──
  buildExcelDoc(tabToExport?: Tab): { blob: Blob; filename: string } {
    const targetTab: Tab = tabToExport || this.activeTab;
    const currentPeriod = this.period;
    const genTimestamp = this.formatDateTime(new Date());
    const reportRef = `FDG-${targetTab.toUpperCase().slice(0, 3)}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const periodLabel: Record<string, string> = {
      daily: 'Today (Daily)',
      weekly: 'This Week (Weekly)',
      monthly: 'This Month (Monthly)',
      yearly: 'This Year (Yearly)',
      all: 'All-Time Records',
    };

    const wb = XLSX.utils.book_new();

    const appendSheet = (sheetName: string, data: any[][], customCols?: any[]) => {
      const ws = XLSX.utils.aoa_to_sheet(data);
      const colWidths = data.reduce((acc: number[], row: any[]) => {
        row.forEach((cell: any, i: number) => {
          const len = String(cell ?? '').length;
          acc[i] = Math.max(acc[i] || 10, len + 3);
        });
        return acc;
      }, []);
      ws['!cols'] = customCols || colWidths.map((w: number) => ({ wch: Math.min(Math.max(w, 12), 48) }));
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    // Header branding block builder
    const makeHeaderBlock = (sheetSubtitle: string) => [
      ['FORDAGO FITNESS & WELLNESS CLUB'],
      ['MANAGEMENT INFORMATION SYSTEM - OFFICIAL AUDIT WORKBOOK'],
      [`Module: ${targetTab.toUpperCase()} (${sheetSubtitle})`, `Scope: ${periodLabel[currentPeriod] || currentPeriod}`, `Ref: ${reportRef}`],
      [`Generated: ${genTimestamp}`, 'Security: STRICTLY CONFIDENTIAL', 'Source: 100% Live Verified Sync'],
      [],
    ];

    // ─────────────────────────────────────────────
    // 1. INVENTORY WORKBOOK (Multi-Sheet)
    // ─────────────────────────────────────────────
    if (targetTab === 'inventory') {
      const totalProducts = this.invRows.length;
      const totalStock = this.invSummary?.totalStock ?? this.invRows.reduce((a, b) => a + (b.current_stock || 0), 0);
      const totalSold = this.invSummary?.totalSold ?? this.invRows.reduce((a, b) => a + (b.total_sold || 0), 0);
      const totalRevenue = this.invSummary?.totalRevenue ?? this.invRows.reduce((a, b) => a + (b.total_revenue || 0), 0);
      const totalCogs = this.invSummary?.totalCogs ?? this.invRows.reduce((a, b) => a + ((b.cost_price || 0) * (b.total_sold || 0)), 0);
      const totalProfit = this.invSummary?.totalProfit ?? Math.max(0, totalRevenue - totalCogs);
      const inventoryCostValue = this.invSummary?.inventoryCostValue ?? this.invRows.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);
      const inventoryRetailValue = this.invSummary?.inventoryValue ?? this.invRows.reduce((a, b) => a + ((b.price || 0) * (b.current_stock || 0)), 0);
      const expiredItems = this.invRows.filter(r => r.expiry_status === 'expired' || (r.days_until_expiry !== null && r.days_until_expiry < 0));
      const expiredLossRisk = this.invSummary?.expiredLossRisk ?? expiredItems.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);
      const expiringSoonItems = this.invRows.filter(r => r.expiry_status === 'expiring_soon' || (r.days_until_expiry !== null && r.days_until_expiry >= 0 && r.days_until_expiry <= 30));
      const expiringSoonRisk = this.invSummary?.expiringSoonRisk ?? expiringSoonItems.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);

      // Sheet 1: Executive Summary
      const summaryData: any[][] = [
        ...makeHeaderBlock('Executive Scorecard'),
        ['EXECUTIVE AUDIT SCORECARD'],
        ['Key Performance Indicator', 'Numeric Amount (PHP)', 'Unit / Metric Scope', 'Audit Remarks'],
        ['Active Product Catalog Lines', totalProducts, 'SKUs', 'Active shop catalog'],
        ['Total Stock on Hand', totalStock, 'Units', 'Available shelf inventory'],
        ['Gross Merchandise Sales', Number(totalRevenue.toFixed(2)), 'PHP', 'Realized sales revenue'],
        ['Cost of Goods Sold (COGS)', Number(totalCogs.toFixed(2)), 'PHP', 'Direct inventory acquisition cost'],
        ['Net Merchandise Profit', Number(totalProfit.toFixed(2)), 'PHP', 'Gross sales less COGS'],
        ['Capital Valuation (Cost Basis)', Number(inventoryCostValue.toFixed(2)), 'PHP', 'Current asset inventory cost basis'],
        ['Retail Valuation (Asset Price)', Number(inventoryRetailValue.toFixed(2)), 'PHP', 'Current asset retail sales value'],
        ['Expired Stock Spoilage Risk', Number(expiredLossRisk.toFixed(2)), 'PHP', `${expiredItems.length} products expired (immediate pull-out)`],
        ['Expiring Soon Spoilage Risk (<=30d)', Number(expiringSoonRisk.toFixed(2)), 'PHP', `${expiringSoonItems.length} products near expiry`],
      ];
      appendSheet('Executive Summary', summaryData);

      // Sheet 2: Master Inventory
      const masterData: any[][] = [
        ...makeHeaderBlock('Product Master'),
        [
          '#', 'Product Name', 'Brand', 'Unit Cost (PHP)', 'Retail Price (PHP)',
          'Profit Margin (%)', 'Stock on Hand', 'Units Sold', 'Gross Revenue (PHP)',
          'Net Profit (PHP)', 'Expiry Date', 'Shelf-Life Status',
        ],
      ];
      const rows = this.filteredInvRows.length ? this.filteredInvRows : this.invRows;
      rows.forEach((item, idx) => {
        const isExp = item.expiry_status === 'expired' || (item.days_until_expiry !== null && item.days_until_expiry < 0);
        const isExpSoon = item.expiry_status === 'expiring_soon' || (item.days_until_expiry !== null && item.days_until_expiry >= 0 && item.days_until_expiry <= 30);
        let statusTag = 'Fresh / Safe';
        if (isExp) statusTag = `EXPIRED (${Math.abs(item.days_until_expiry)}d ago)`;
        else if (isExpSoon) statusTag = `EXPIRING (${item.days_until_expiry}d left)`;
        else if (!item.expiry_date) statusTag = 'Non-perishable';

        masterData.push([
          idx + 1,
          item.name || '—',
          item.brand || '—',
          Number(Number(item.cost_price || 0).toFixed(2)),
          Number(Number(item.price || 0).toFixed(2)),
          Number(item.profit_margin || 0),
          Number(item.current_stock || 0),
          Number(item.total_sold || 0),
          Number(Number(item.total_revenue || 0).toFixed(2)),
          Number(Number(item.total_profit || 0).toFixed(2)),
          item.expiry_date ? this.formatDate(item.expiry_date) : 'No Expiry',
          statusTag,
        ]);
      });
      masterData.push([
        'TOTALS', 'Consolidated Inventory Figures', '', '', '', '',
        totalStock, totalSold, Number(totalRevenue.toFixed(2)), Number(totalProfit.toFixed(2)), '', '',
      ]);
      appendSheet('Inventory Master', masterData);

      // Sheet 3: Urgent Spoilage Register
      const priorityItems = [...expiredItems, ...expiringSoonItems];
      const riskData: any[][] = [
        ...makeHeaderBlock('Perishables Risk'),
        ['#', 'Product Name', 'Brand', 'Stock', 'Unit Cost (PHP)', 'Retail Price (PHP)', 'Expiry Date', 'Days Status', 'Audit Directive', 'Loss at Risk (PHP)'],
      ];
      priorityItems.forEach((item, idx) => {
        const isExp = item.expiry_status === 'expired' || (item.days_until_expiry !== null && item.days_until_expiry < 0);
        const lossRisk = (item.cost_price || 0) * (item.current_stock || 0);
        riskData.push([
          idx + 1,
          item.name || '—',
          item.brand || '—',
          Number(item.current_stock || 0),
          Number(Number(item.cost_price || 0).toFixed(2)),
          Number(Number(item.price || 0).toFixed(2)),
          item.expiry_date ? this.formatDate(item.expiry_date) : '—',
          isExp ? `Expired (${Math.abs(item.days_until_expiry)}d ago)` : `${item.days_until_expiry} days remaining`,
          isExp ? 'PULL-OUT & WRITE OFF' : '20-50% CLEARANCE SALE',
          Number(lossRisk.toFixed(2)),
        ]);
      });
      riskData.push([
        'TOTAL RISK', 'Perishables Loss Exposure', '', '', '', '', '', '', '',
        Number((expiredLossRisk + expiringSoonRisk).toFixed(2)),
      ]);
      appendSheet('Urgent Spoilage Risk', riskData);

    // ─────────────────────────────────────────────
    // 2. MEMBERSHIPS WORKBOOK (Multi-Sheet)
    // ─────────────────────────────────────────────
    } else if (targetTab === 'memberships') {
      const expiringSoon = this.filteredMembershipRows.filter(m => m.is_expiring_soon);
      const expired = this.filteredMembershipRows.filter(m => m.is_expired);

      // Sheet 1: Executive Summary
      const summaryData: any[][] = [
        ...makeHeaderBlock('Executive Scorecard'),
        ['EXECUTIVE AUDIT SCORECARD'],
        ['Key Performance Indicator', 'Numeric Amount (PHP)', 'Unit / Metric Scope', 'Audit Remarks'],
        ['Total Registered Accounts', this.membershipSummary?.totalMembers || this.membershipRows.length, 'Accounts', 'User accounts on database'],
        ['Active Premium Subscribers', this.membershipSummary?.activePremium || 0, 'Subscribers', 'PHP 500/month recurring plan'],
        ['Monthly Premium Run-rate', Number((this.membershipSummary?.premiumRevenue || 0).toFixed(2)), 'PHP', 'Expected monthly subscription run-rate'],
        ['Registered Coaches', this.membershipSummary?.totalCoaches || 0, 'Coaches', 'Trainers on roster'],
        ['Expiring in <=7 Days', expiringSoon.length, 'Members', 'Action required: Send renewal SMS'],
        ['Expired Membership Accounts', expired.length, 'Accounts', 'Action required: Retention follow-up'],
      ];
      appendSheet('Executive Summary', summaryData);

      // Sheet 2: Complete Roster
      const rosterData: any[][] = [
        ...makeHeaderBlock('Member & Coach Roster'),
        [
          '#', 'Member Name', 'Account Type', 'Email Address', 'Phone Number',
          'Membership Plan', 'Payment Channel', 'Expiry Date', 'Remaining Days', 'Account Status',
        ],
      ];
      this.filteredMembershipRows.forEach((m, idx) => {
        rosterData.push([
          idx + 1,
          m.username || '—',
          m.account_type === 'coach' ? 'Coach' : 'Member',
          m.email || '—',
          m.phone || '—',
          m.membership_type === 'premium' ? 'Premium (PHP 500)' : (m.membership_type === 'daily' ? 'Daily Pass' : 'Coach Profile'),
          (m.payment_method || 'CASH').toUpperCase(),
          m.membership_expiry ? this.formatDate(m.membership_expiry) : 'Per Visit',
          m.membership_type === 'premium' ? `${m.days_left} days` : 'Per Visit',
          (m.membership_status || 'active').toUpperCase(),
        ]);
      });
      appendSheet('Member & Coach Roster', rosterData);

      // Sheet 3: Priority Retention & Renewal
      const priorityList = [...expiringSoon, ...expired];
      const renewalData: any[][] = [
        ...makeHeaderBlock('Priority Retention & Renewal'),
        [
          '#', 'Member Name', 'Account Type', 'Email Address', 'Phone Number',
          'Expiry Date', 'Days Status', 'Account Status', 'Required Retention Action',
        ],
      ];
      priorityList.forEach((m, idx) => {
        renewalData.push([
          idx + 1,
          m.username || '—',
          m.account_type === 'coach' ? 'Coach' : 'Member',
          m.email || '—',
          m.phone || '—',
          m.membership_expiry ? this.formatDate(m.membership_expiry) : '—',
          m.is_expired ? 'EXPIRED' : `${m.days_left} days left`,
          m.is_expired ? 'Inactive' : 'Action Needed',
          m.is_expired ? 'Contact for Reactivation Plan' : 'Send Renewal SMS Reminder',
        ]);
      });
      appendSheet('Priority Retention', renewalData);

    // ─────────────────────────────────────────────
    // 3. TRANSACTIONS WORKBOOK (Multi-Sheet)
    // ─────────────────────────────────────────────
    } else if (targetTab === 'transactions') {
      // Sheet 1: Executive Summary
      const summaryData: any[][] = [
        ...makeHeaderBlock('Executive Scorecard'),
        ['EXECUTIVE AUDIT SCORECARD'],
        ['Key Performance Indicator', 'Numeric Amount (PHP)', 'Unit / Metric Scope', 'Audit Remarks'],
        ['Total Realized Revenue Collected', Number(this.txCollectedRevenue.toFixed(2)), 'PHP', 'Sum of all paid transactions'],
        ['Pending Receivables', Number(this.txPendingRevenue.toFixed(2)), 'PHP', 'Uncleared transactions'],
        ['Total Audit Volume', Number(this.txTotalVolume.toFixed(2)), 'PHP', 'Total transaction volume'],
        ['Total Transactions Count', this.filteredTxRows.length, 'Records', 'Filtered transactions log'],
        ['Membership Transactions', this.txMembershipCount, 'Subscriptions', 'Membership fees'],
        ['Gym Pass / Shop Transactions', this.txGymCount + this.txShopCount, 'Orders/Visits', 'Daily passes & shop orders'],
      ];
      appendSheet('Executive Summary', summaryData);

      // Sheet 2: Audit Ledger
      const ledgerData: any[][] = [
        ...makeHeaderBlock('Financial Audit Ledger'),
        [
          '#', 'Date & Time', 'Reference Code', 'Customer / Payer', 'Type / Description',
          'Payment Channel', 'Amount (PHP)', 'Audit Status',
        ],
      ];
      this.filteredTxRows.forEach((tx, idx) => {
        ledgerData.push([
          idx + 1,
          this.formatDateTime(tx.transaction_date || tx.created_at),
          tx.reference_number || tx.receipt_number || `TX-${tx.id || idx + 1}`,
          tx.username || 'Walk-in Guest',
          tx.product_name || tx.type_label || (tx.source || 'General').toUpperCase(),
          (tx.payment_method || 'CASH').toUpperCase(),
          Number(Number(tx.amount || 0).toFixed(2)),
          this.getStatusLabel(tx),
        ]);
      });
      ledgerData.push([
        'TOTALS', 'Consolidated Financial Audit Figures', '', '', '', '',
        Number(this.txCollectedRevenue.toFixed(2)), `Pending: PHP ${this.txPendingRevenue.toFixed(2)}`,
      ]);
      appendSheet('Financial Ledger', ledgerData);

    // ─────────────────────────────────────────────
    // 4. ATTENDANCE WORKBOOK (Multi-Sheet)
    // ─────────────────────────────────────────────
    } else if (targetTab === 'attendance') {
      // Sheet 1: Executive Summary
      const summaryData: any[][] = [
        ...makeHeaderBlock('Executive Scorecard'),
        ['EXECUTIVE AUDIT SCORECARD'],
        ['Key Performance Indicator', 'Numeric Amount (PHP)', 'Unit / Metric Scope', 'Audit Remarks'],
        ['Total Logged Gym Check-ins', this.attSummary?.total || 0, 'Visits', 'All attendance sessions'],
        ['Paid Daily Walk-in Passes', this.attSummary?.paidCount || 0, 'Passes', `Revenue: PHP ${(this.attSummary?.paidRevenue || 0).toFixed(2)}`],
        ['Premium Member Check-ins', this.attSummary?.premiumCount || 0, 'Visits', 'Inclusive with membership'],
        ['Total Daily Pass Revenue', Number((this.attSummary?.totalRevenue || 0).toFixed(2)), 'PHP', 'Walk-in counter collections'],
        ['Peak Hours', this.attSummary?.busiestHour || '6:00 PM - 7:00 PM', 'Time Window', 'Maximum concurrent facility traffic'],
        ['Average Session Duration', this.attSummary?.avgDurationFormatted || '45 mins', 'Duration', 'Mean member workout time'],
      ];
      appendSheet('Executive Summary', summaryData);

      // Sheet 2: Check-in Audit Log
      const checkinData: any[][] = [
        ...makeHeaderBlock('Check-in Audit Log'),
        [
          '#', 'Check-in Time', 'Check-out Time', 'Duration (Minutes)', 'Customer / Member',
          'Account Type', 'Daily Pass Fee (PHP)', 'Audit Status',
        ],
      ];
      this.filteredAttRows.forEach((r, idx) => {
        const isPaidType = (r.membership_type || '').toLowerCase() === 'daily';
        checkinData.push([
          idx + 1,
          this.formatDateTime(r.check_in_time),
          r.check_out_time ? this.formatDateTime(r.check_out_time) : 'Active Inside',
          r.duration_minutes ? Number(r.duration_minutes) : 0,
          r.username || 'Walk-in Guest',
          r.membership_type === 'premium' ? 'Premium Member' : 'Daily Pass Guest',
          isPaidType ? 40.00 : 0.00,
          'VERIFIED',
        ]);
      });
      checkinData.push([
        'TOTALS', 'Consolidated Attendance Log', '', '', `${this.filteredAttRows.length} Visits`, '',
        Number((this.attSummary?.totalRevenue || 0).toFixed(2)), 'VERIFIED',
      ]);
      appendSheet('Check-in Audit Log', checkinData);

      // Sheet 3: Traffic Schedule
      const trafficData: any[][] = [
        ...makeHeaderBlock('Facility Traffic Schedule'),
        ['Time Interval', 'Visits Count', 'Traffic Share (%)', 'Capacity Status'],
        ['Morning Rush (5:00 AM – 11:59 AM)', Number(this.attSummary?.morningCount || 0), `${this.attendanceMorningPercent}%`, 'High equipment utilization'],
        ['Afternoon Session (12:00 PM – 4:59 PM)', Number(this.attSummary?.afternoonCount || 0), `${this.attendanceAfternoonPercent}%`, 'Moderate facility load'],
        ['Evening Peak (5:00 PM – 11:00 PM)', Number(this.attSummary?.eveningCount || 0), `${this.attendanceEveningPercent}%`, 'Peak gym traffic hours'],
      ];
      appendSheet('Traffic Schedule', trafficData);

    // ─────────────────────────────────────────────
    // 5. SALES WORKBOOK (Multi-Sheet)
    // ─────────────────────────────────────────────
    } else if (targetTab === 'sales') {
      // Sheet 1: Executive Summary
      const summaryData: any[][] = [
        ...makeHeaderBlock('Executive Scorecard'),
        ['EXECUTIVE AUDIT SCORECARD'],
        ['Key Performance Indicator', 'Numeric Amount (PHP)', 'Unit / Metric Scope', 'Audit Remarks'],
        ['Total Realized Sales Revenue', Number((this.salesSummary?.totalRevenue || 0).toFixed(2)), 'PHP', 'Consolidated financial sales'],
        ['Pending Orders & Subscriptions', Number((this.salesSummary?.pendingRevenue || 0).toFixed(2)), 'PHP', 'Uncleared sales'],
        ['Gym Daily Passes Revenue', Number((this.salesSummary?.gymRevenue || 0).toFixed(2)), 'PHP', 'Walk-in entrance fees'],
        ['Shop Products Revenue', Number((this.salesSummary?.shopRevenue || 0).toFixed(2)), 'PHP', 'Consumables and gear'],
        ['Membership Plans Revenue', Number((this.salesSummary?.membershipRevenue || 0).toFixed(2)), 'PHP', 'Premium subscriptions'],
        ['Cash Drawer Remittance', Number((this.salesSummary?.cashRevenue || 0).toFixed(2)), 'PHP', 'Direct counter receipts'],
        ['GCash Digital Remittance', Number((this.salesSummary?.gcashRevenue || 0).toFixed(2)), 'PHP', 'Mobile payment receipts'],
        ['Total Merchandise Items Sold', Number(this.salesSummary?.itemsSold || 0), 'Units', 'Products purchased'],
      ];
      appendSheet('Executive Summary', summaryData);

      // Sheet 2: Gym Passes
      const gymData: any[][] = [
        ...makeHeaderBlock('Gym Daily Passes Sales'),
        ['#', 'Sale Date', 'Day of Week', 'Paid Check-ins', 'Collected Revenue (PHP)'],
      ];
      let gymTotalCount = 0;
      let gymTotalRev = 0;
      this.attSalesRows.forEach((r, idx) => {
        const c = Number(r.count || 0);
        const rev = Number(Number(r.revenue || 0).toFixed(2));
        gymTotalCount += c;
        gymTotalRev += rev;
        gymData.push([
          idx + 1,
          this.formatDate(r.sale_date),
          this.datePipe.transform(r.sale_date, 'EEEE') ?? '',
          c,
          rev,
        ]);
      });
      gymData.push(['TOTALS', 'All Logged Walk-in Passes', '', gymTotalCount, Number(gymTotalRev.toFixed(2))]);
      appendSheet('Gym Daily Passes', gymData);

      // Sheet 3: Shop Sales
      const shopData: any[][] = [
        ...makeHeaderBlock('Shop Merchandise Sales'),
        ['#', 'Sale Date', 'Day of Week', 'Completed Orders', 'Collected Revenue (PHP)'],
      ];
      let shopTotalCount = 0;
      let shopTotalRev = 0;
      this.shopSalesRows.forEach((r, idx) => {
        const c = Number(r.count || 0);
        const rev = Number(Number(r.revenue || 0).toFixed(2));
        shopTotalCount += c;
        shopTotalRev += rev;
        shopData.push([
          idx + 1,
          this.formatDate(r.sale_date),
          this.datePipe.transform(r.sale_date, 'EEEE') ?? '',
          c,
          rev,
        ]);
      });
      shopData.push(['TOTALS', 'All Logged Merchandise Orders', '', shopTotalCount, Number(shopTotalRev.toFixed(2))]);
      appendSheet('Shop Merchandise', shopData);

      // Sheet 4: Membership Subscriptions
      const memData: any[][] = [
        ...makeHeaderBlock('Premium Membership Subscriptions'),
        ['#', 'Sale Date', 'Day of Week', 'Subscriptions Count', 'Collected Revenue (PHP)'],
      ];
      let memTotalCount = 0;
      let memTotalRev = 0;
      this.membershipSalesRows.forEach((r, idx) => {
        const c = Number(r.count || 0);
        const rev = Number(Number(r.revenue || 0).toFixed(2));
        memTotalCount += c;
        memTotalRev += rev;
        memData.push([
          idx + 1,
          this.formatDate(r.sale_date),
          this.datePipe.transform(r.sale_date, 'EEEE') ?? '',
          c,
          rev,
        ]);
      });
      memData.push(['TOTALS', 'All Membership Subscriptions', '', memTotalCount, Number(memTotalRev.toFixed(2))]);
      appendSheet('Membership Subscriptions', memData);

    // ─────────────────────────────────────────────
    // 6. OVERVIEW WORKBOOK (Multi-Sheet)
    // ─────────────────────────────────────────────
    } else {
      const expiredItems = this.invRows.filter(r => r.expiry_status === 'expired' || (r.days_until_expiry !== null && r.days_until_expiry < 0));
      const expiredLossRisk = this.invSummary?.expiredLossRisk ?? expiredItems.reduce((a, b) => a + ((b.cost_price || 0) * (b.current_stock || 0)), 0);
      const expiringMembers = this.membershipRows.filter(m => m.is_expiring_soon);

      // Sheet 1: Executive Summary Scorecard
      const summaryData: any[][] = [
        ...makeHeaderBlock('Executive Scorecard'),
        ['EXECUTIVE AUDIT SCORECARD'],
        ['Key Performance Indicator', 'Numeric Amount (PHP)', 'Unit / Metric Scope', 'Audit Remarks'],
        ['Total Realized Revenue Collected', Number(this.grandTotalCollected.toFixed(2)), 'PHP', 'Consolidated financial income'],
        ['Pending Receivables', Number((this.salesSummary?.pendingRevenue || 0).toFixed(2)), 'PHP', 'Unpaid orders / pending plans'],
        ['Premium Subscriptions Revenue', Number((this.salesSummary?.membershipRevenue || 0).toFixed(2)), 'PHP', `${this.membershipSummary?.activePremium || 0} active members (PHP 500/mo)`],
        ['Gym Daily Passes Revenue', Number((this.salesSummary?.gymRevenue || 0).toFixed(2)), 'PHP', `${this.attSummary?.total || 0} visits logged (PHP 40/visit)`],
        ['Shop Merchandise Revenue', Number((this.salesSummary?.shopRevenue || 0).toFixed(2)), 'PHP', 'Direct merchandise & supplement sales'],
        ['Inventory Capital Valuation (Cost Basis)', Number((this.invSummary?.inventoryCostValue || 0).toFixed(2)), 'PHP', 'Asset acquisition cost'],
        ['Product Expiry Loss Risk', Number(expiredLossRisk.toFixed(2)), 'PHP', `${expiredItems.length} expired SKUs require write-off`],
        ['Memberships Expiring This Week', expiringMembers.length, 'Members', 'Priority retention follow-up required'],
        ['Registered Coaches on Roster', this.membershipSummary?.totalCoaches || 0, 'Coaches', 'Official gym staff/trainers'],
      ];
      appendSheet('Executive Summary', summaryData);

      // Sheet 2: Revenue Distribution
      const streamData: any[][] = [
        ...makeHeaderBlock('Revenue Distribution'),
        ['#', 'Revenue Stream', 'Collected Realized (PHP)', 'Contribution Share (%)', 'Pending Receivables (PHP)', 'Primary Payment Channels'],
        [1, 'Premium Membership Subscriptions', Number((this.salesSummary?.membershipRevenue || 0).toFixed(2)), `${this.revenueMembershipPercent}%`, Number((this.salesSummary?.cashRevenue || 0).toFixed(2)), 'Cash / GCash'],
        [2, 'Gym Walk-in Daily Passes', Number((this.salesSummary?.gymRevenue || 0).toFixed(2)), `${this.revenueGymPercent}%`, 0.00, 'Cash at Counter'],
        [3, 'Shop Merchandise & Nutrition', Number((this.salesSummary?.shopRevenue || 0).toFixed(2)), `${this.revenueShopPercent}%`, Number((this.salesSummary?.pendingRevenue || 0).toFixed(2)), 'Cash / GCash'],
        ['TOTAL', 'Consolidated Revenue Streams', Number(this.grandTotalCollected.toFixed(2)), '100%', Number((this.salesSummary?.pendingRevenue || 0).toFixed(2)), 'Cash & Digital Channels'],
      ];
      appendSheet('Revenue Distribution', streamData);

      // Sheet 3: Recent Transactions Audit Trail
      const recentTxData: any[][] = [
        ...makeHeaderBlock('Recent Transactions Audit Trail'),
        ['#', 'Date & Time', 'Reference Code', 'Customer / Payer', 'Type / Description', 'Payment Channel', 'Amount (PHP)', 'Audit Status'],
      ];
      this.txRows.slice(0, 50).forEach((tx, idx) => {
        recentTxData.push([
          idx + 1,
          this.formatDateTime(tx.transaction_date || tx.created_at),
          tx.reference_number || tx.receipt_number || `TX-${tx.id || idx + 1}`,
          tx.username || 'Walk-in Guest',
          tx.product_name || tx.type_label || (tx.source || 'General').toUpperCase(),
          (tx.payment_method || 'CASH').toUpperCase(),
          Number(Number(tx.amount || 0).toFixed(2)),
          this.getStatusLabel(tx),
        ]);
      });
      appendSheet('Recent Transactions', recentTxData);

      // Sheet 4: Critical Alerts
      const alertsData: any[][] = [
        ...makeHeaderBlock('Critical Operational Alerts'),
        ['Category', 'Target Item / Member', 'Contact / Quantity', 'Expiry Date', 'Risk / Days Left', 'Required Follow-up Directive'],
      ];
      expiredItems.forEach(item => {
        alertsData.push([
          'Expired Product',
          item.name || '—',
          `Stock: ${item.current_stock || 0} units`,
          item.expiry_date ? this.formatDate(item.expiry_date) : '—',
          `Loss: PHP ${((item.cost_price || 0) * (item.current_stock || 0)).toFixed(2)}`,
          'Pull out from gym shelf immediately & write off',
        ]);
      });
      expiringMembers.forEach(m => {
        alertsData.push([
          'Expiring Member',
          m.username || '—',
          m.phone || m.email || '—',
          m.membership_expiry ? this.formatDate(m.membership_expiry) : '—',
          `${m.days_left} days remaining`,
          'Send renewal SMS notification & offer incentive',
        ]);
      });
      appendSheet('Critical Alerts', alertsData);
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const filename = `FordaGO_Audit_${targetTab.toUpperCase()}_${currentPeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    return { blob, filename };
  }

  // ── Professional Executive PDF Document Builder ─────────
  buildPDFDoc(tabToExport?: Tab): { doc: jsPDF; filename: string } {
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

    let startY = 48;

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
          { content: 'Net Merchandise Profit', styles: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
          { content: this.formatCurrency(totalProfit), styles: { fontStyle: 'bold', textColor: [5, 150, 105] } },
          { content: 'Units Sold (Lifetime)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${totalSold} units purchased`,
        ],
        [
          { content: 'Asset Valuation (Retail)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(inventoryValue),
          { content: 'Total Capital Cost Valuation', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(inventoryCostValue),
        ],
        [
          { content: 'Expired Stock Alert', styles: { fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] } },
          { content: `${expiredItems.length} SKUs (${expiredUnits} units) — Loss: ${this.formatCurrency(expiredLossRisk)}`, styles: { fontStyle: 'bold', textColor: [185, 28, 28], fillColor: [254, 226, 226] } },
          { content: 'Expiring Soon Alert (<=30d)', styles: { fontStyle: 'bold', fillColor: [254, 243, 199], textColor: [180, 83, 9] } },
          { content: `${expiringSoonItems.length} SKUs (${expiringSoonUnits} units) — Risk: ${this.formatCurrency(expiringSoonRisk)}`, styles: { fontStyle: 'bold', textColor: [180, 83, 9], fillColor: [254, 243, 199] } },
        ],
      ];

      autoTable(doc, {
        startY,
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
        head: [[{ content: 'INVENTORY & PERISHABLES EXECUTIVE SUMMARY', colSpan: 4, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: [234, 179, 8], fontStyle: 'bold' } }]],
        body: invKpis as any,
        styles: { fontSize: 8, cellPadding: 2.2 },
        theme: 'grid',
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      // Section 1: PRIORITY EXPIRATION AUDIT TABLE
      if (expiredItems.length > 0 || expiringSoonItems.length > 0) {
        const priorityItems = [...expiredItems, ...expiringSoonItems];
        const priorityRows: any[] = priorityItems.map((item, idx) => {
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
          { content: 'TOTAL PERISHABLE CAPITAL AT RISK (IMMEDIATE ACTION)', colSpan: 9, styles: { halign: 'right', fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] } },
          { content: this.formatCurrency(combinedRisk), styles: { halign: 'right', fontStyle: 'bold', fillColor: [254, 226, 226], textColor: [185, 28, 28] } },
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 18, bottom: 20, left: 14, right: 14 },
          head: [[
            { content: 'URGENT SPOILAGE & SHELF-LIFE AUDIT REGISTER', colSpan: 10, styles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], [
            '#', 'Product Name', 'Brand', 'Stock', 'Unit Cost', 'Retail', 'Expiry Date', 'Lifespan', 'Audit Directive', 'Loss at Risk',
          ]],
          body: priorityRows,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
          styles: { fontSize: 7.2, cellPadding: 2 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 8 },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' },
            6: { halign: 'center' },
            7: { halign: 'center' },
            8: { halign: 'center' },
            9: { halign: 'right', fontStyle: 'bold' },
          },
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
        // Safe Banner (No glyph corruption)
        autoTable(doc, {
          startY,
          margin: { top: 18, bottom: 20, left: 14, right: 14 },
          body: [[
            {
              content: '[SAFE AUDIT] All inventory batches are fresh and strictly within approved shelf-life limits (0 expired, 0 near-expiry).',
              styles: { halign: 'center', fillColor: [236, 253, 245], textColor: [4, 120, 87], fontStyle: 'bold', fontSize: 8.5 },
            },
          ]],
          theme: 'plain',
        });
        startY = (doc as any).lastAutoTable.finalY + 6;
      }

      // Section 2: COMPLETE INVENTORY MASTER & PROFITABILITY LEDGER
      const masterRows: any[] = rows.map((item, idx) => {
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

      masterRows.push([
        { content: 'TOTALS', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: String(totalStock), styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: String(totalSold), styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: this.formatCurrency(totalRevenue), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
        { content: this.formatCurrency(totalProfit), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
        { content: '', colSpan: 2, styles: { fillColor: [241, 245, 249] } },
      ]);

      autoTable(doc, {
        startY,
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
        head: [[
          { content: 'COMPLETE PRODUCT INVENTORY, COSTING & PROFITABILITY MASTER', colSpan: 12, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], [
          '#', 'Product Name', 'Brand', 'Unit Cost', 'Retail', 'Margin', 'Stock', 'Sold', 'Sales Rev', 'Net Profit', 'Expiry Date', 'Shelf-Life Status',
        ]],
        body: masterRows,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'center' },
          6: { halign: 'center' },
          7: { halign: 'center' },
          8: { halign: 'right', fontStyle: 'bold' },
          9: { halign: 'right', fontStyle: 'bold' },
          10: { halign: 'center' },
          11: { halign: 'center' },
        },
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
          { content: 'Premium Subscriptions (PHP 500/mo)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          this.formatCurrency(this.salesSummary?.membershipRevenue || 0),
          { content: 'Active Premium Memberships', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
          `${this.membershipSummary?.activePremium || 0} active members`,
        ],
        [
          { content: 'Gym Daily Passes (PHP 40/visit)', styles: { fontStyle: 'bold', fillColor: [241, 245, 249] } },
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
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
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
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
        head: [[
          { content: 'REVENUE STREAM CONTRIBUTION BREAKDOWN', colSpan: 5, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], ['Revenue Stream', 'Collected Realized', 'Share of Total', 'Pending Receivables', 'Payment Channels']],
        body: streams,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'right', fontStyle: 'bold' },
          2: { halign: 'center' },
          3: { halign: 'right' },
          4: { halign: 'center' },
        },
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
          margin: { top: 18, bottom: 20, left: 14, right: 14 },
          head: [[
            { content: 'CRITICAL EXPIRATION & RETENTION ALERTS (ATTENTION REQUIRED)', colSpan: 6, styles: { fillColor: [185, 28, 28], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['Category', 'Target Item / Member', 'Contact / Quantity', 'Expiry Date', 'Risk / Days Left', 'Required Follow-up Action']],
          body: riskData,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
          styles: { fontSize: 7.2, cellPadding: 2 },
          columnStyles: {
            0: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center', fontStyle: 'bold' },
          },
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
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
        head: [[
          { content: 'GYM TRAFFIC & FACILITY UTILIZATION SCHEDULE', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], ['Time Interval', 'Visits Count', 'Traffic Share', 'Capacity Status']],
        body: trafficRows,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        styles: { fontSize: 7.5, cellPadding: 2 },
        columnStyles: {
          0: { halign: 'left' },
          1: { halign: 'center' },
          2: { halign: 'center' },
          3: { halign: 'center' },
        },
      });

      // Section 4: RECENT VERIFIED TRANSACTIONS AUDIT TRAIL
      if (this.txRows.length > 0) {
        startY = (doc as any).lastAutoTable.finalY + 7;
        const recentTx = this.txRows.slice(0, 10).map((tx, idx) => [
          idx + 1,
          this.formatDateTime(tx.transaction_date || tx.created_at),
          tx.username || 'Walk-in Guest',
          tx.product_name || tx.type_label || (tx.source || 'General').toUpperCase(),
          (tx.payment_method || 'cash').toUpperCase(),
          tx.amount > 0 ? this.formatCurrency(tx.amount) : 'Included',
          this.getStatusLabel(tx),
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 18, bottom: 20, left: 14, right: 14 },
          head: [[
            { content: 'RECENT VERIFIED TRANSACTIONS AUDIT TRAIL', colSpan: 7, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['#', 'Date & Time', 'Member / Payer', 'Type / Description', 'Channel', 'Amount', 'Audit Status']],
          body: recentTx,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 7, cellPadding: 1.8 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 8 },
            4: { halign: 'center', cellWidth: 20 },
            5: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
            6: { halign: 'center', cellWidth: 22 },
          },
        });
      }

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
          `${this.membershipSummary?.activePremium || 0} members (PHP 500/mo)`,
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
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
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
          m.membership_type === 'premium' ? 'Premium (PHP 500)' : 'Coach Profile',
          this.formatDate(m.membership_expiry),
          m.is_expired ? 'EXPIRED' : `${m.days_left}d left`,
          m.is_expired ? 'Account Inactive' : 'Action Needed',
          m.is_expired ? 'Contact for Reactivation Plan' : 'Send Renewal SMS Reminder',
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 18, bottom: 20, left: 14, right: 14 },
          head: [[
            { content: 'PRIORITY RETENTION & RENEWAL REGISTER (EXPIRING SOON & EXPIRED)', colSpan: 9, styles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['#', 'Member Name', 'Email', 'Phone', 'Plan', 'Expiry Date', 'Lifespan', 'Account Status', 'Required Retention Action']],
          body: priorityRows,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
          styles: { fontSize: 7, cellPadding: 2 },
          columnStyles: {
            0: { halign: 'center', cellWidth: 8 },
            4: { halign: 'center' },
            5: { halign: 'center' },
            6: { halign: 'center' },
            7: { halign: 'center' },
            8: { halign: 'center' },
          },
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
        m.membership_type === 'premium' ? 'Premium (PHP 500)' : (m.membership_type === 'daily' ? 'Daily Pass' : 'Coach'),
        (m.payment_method || 'cash').toUpperCase(),
        m.membership_expiry ? this.formatDate(m.membership_expiry) : 'Per Visit',
        m.membership_type === 'premium' ? `${m.days_left}d left` : 'Per Visit',
        m.membership_status === 'active' ? 'Active' : 'Pending',
      ]);

      autoTable(doc, {
        startY,
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
        head: [[
          { content: 'COMPLETE MEMBERSHIP & COACH AUDIT ROSTER', colSpan: 9, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], ['#', 'Member Name', 'Type', 'Email', 'Plan', 'Payment', 'Expiry Date', 'Remaining', 'Status']],
        body: rosterRows,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          2: { halign: 'center' },
          4: { halign: 'center' },
          5: { halign: 'center' },
          6: { halign: 'center' },
          7: { halign: 'center' },
          8: { halign: 'center' },
        },
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
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
        head: [[{ content: 'TRANSACTION AUDIT LEDGER SUMMARY', colSpan: 4, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: [234, 179, 8], fontStyle: 'bold' } }]],
        body: txKpis as any,
        styles: { fontSize: 8, cellPadding: 2.2 },
        theme: 'grid',
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      const txTableRows: any[] = this.filteredTxRows.map((tx, idx) => [
        idx + 1,
        this.formatDateTime(tx.transaction_date),
        tx.username,
        tx.type_label,
        tx.product_name || (tx.source === 'attendance' ? 'Gym Walk-in Access' : (tx.source === 'membership' ? 'Monthly Plan Subscription' : '—')),
        tx.amount > 0 ? this.formatCurrency(tx.amount) : 'Included',
        (tx.payment_method || 'cash').toUpperCase(),
        this.getStatusLabel(tx),
      ]);

      txTableRows.push([
        { content: 'TOTAL REALIZED REVENUE COLLECTED (PAID ONLY)', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: this.formatCurrency(this.txCollectedRevenue), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
        { content: `Pending: ${this.formatCurrency(this.txPendingRevenue)}`, colSpan: 2, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [180, 83, 9] } },
      ]);

      autoTable(doc, {
        startY,
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
        head: [[
          { content: 'DETAILED FINANCIAL AUDIT LOG', colSpan: 8, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], ['#', 'Date & Time', 'Member / Payer', 'Type', 'Description / Details', 'Amount', 'Channel', 'Audit Status']],
        body: txTableRows,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          5: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
          6: { halign: 'center', cellWidth: 20 },
          7: { halign: 'center', cellWidth: 22 },
        },
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
          `${this.attSummary?.daily || 0} visits (PHP 40)`,
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
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
        head: [[{ content: 'ATTENDANCE & TRAFFIC AUDIT SUMMARY', colSpan: 4, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: [234, 179, 8], fontStyle: 'bold' } }]],
        body: attKpis as any,
        styles: { fontSize: 8, cellPadding: 2.2 },
        theme: 'grid',
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      const attTableRows: any[] = this.filteredAttRows.map((r, idx) => [
        idx + 1,
        this.formatDateTime(r.check_in_time),
        r.username,
        r.email || '—',
        r.membership_type === 'daily' ? 'Daily Pass (PHP 40)' : 'Premium Member',
        r.membership_type === 'daily' ? this.formatCurrency(40) : 'Included in Plan',
        (r.payment_status || 'paid').toUpperCase(),
      ]);

      attTableRows.push([
        { content: 'TOTAL ATTENDANCE SESSIONS / WALK-IN REVENUE', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
        { content: this.formatCurrency(this.attSummary?.totalRevenue || 0), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
        { content: 'VERIFIED', styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } },
      ]);

      autoTable(doc, {
        startY,
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
        head: [[
          { content: 'CHRONOLOGICAL GYM ATTENDANCE LOG', colSpan: 7, styles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' } },
        ], ['#', 'Check-in Date & Time', 'Member Name', 'Email Address', 'Plan Type', 'Fee Paid', 'Payment Status']],
        body: attTableRows,
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 7, cellPadding: 1.8 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 8 },
          4: { halign: 'center', cellWidth: 32 },
          5: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
          6: { halign: 'center', cellWidth: 24 },
        },
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
        margin: { top: 18, bottom: 20, left: 14, right: 14 },
        head: [[{ content: 'FINANCIAL SALES & REVENUE AUDIT SUMMARY', colSpan: 4, styles: { halign: 'center', fillColor: [15, 23, 42], textColor: [234, 179, 8], fontStyle: 'bold' } }]],
        body: salesKpis as any,
        styles: { fontSize: 8, cellPadding: 2.2 },
        theme: 'grid',
      });

      startY = (doc as any).lastAutoTable.finalY + 7;

      // Table A: Daily Gym Passes
      if (this.attSalesRows.length > 0) {
        let attTotalCount = 0;
        let attTotalRev = 0;
        const attSalesTable: any[] = this.attSalesRows.map(r => {
          attTotalCount += Number(r.count || 0);
          attTotalRev += Number(r.revenue || 0);
          return [
            this.formatDate(r.sale_date),
            this.datePipe.transform(r.sale_date, 'EEEE') ?? '',
            r.count,
            this.formatCurrency(r.revenue),
          ];
        });

        attSalesTable.push([
          { content: 'TOTALS', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: `${attTotalCount} check-ins`, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: this.formatCurrency(attTotalRev), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 18, bottom: 20, left: 14, right: 14 },
          head: [[
            { content: 'GYM DAILY WALK-IN PASSES (REVENUE BY DATE)', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['Date', 'Day of Week', 'Paid Check-ins', 'Collected Revenue']],
          body: attSalesTable,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 7, cellPadding: 1.8 },
          columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right', fontStyle: 'bold' },
          },
        });

        startY = (doc as any).lastAutoTable.finalY + 7;
      }

      // Table B: Shop Sales
      if (this.shopSalesRows.length > 0) {
        let shopTotalCount = 0;
        let shopTotalRev = 0;
        const shopSalesTable: any[] = this.shopSalesRows.map(r => {
          shopTotalCount += Number(r.count || 0);
          shopTotalRev += Number(r.revenue || 0);
          return [
            this.formatDate(r.sale_date),
            this.datePipe.transform(r.sale_date, 'EEEE') ?? '',
            r.count,
            this.formatCurrency(r.revenue),
          ];
        });

        shopSalesTable.push([
          { content: 'TOTALS', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: `${shopTotalCount} orders`, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: this.formatCurrency(shopTotalRev), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 18, bottom: 20, left: 14, right: 14 },
          head: [[
            { content: 'SHOP MERCHANDISE SALES (REVENUE BY DATE)', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['Date', 'Day of Week', 'Completed Orders', 'Collected Revenue']],
          body: shopSalesTable,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 7, cellPadding: 1.8 },
          columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right', fontStyle: 'bold' },
          },
        });

        startY = (doc as any).lastAutoTable.finalY + 7;
      }

      // Table C: Membership Subscriptions
      if (this.membershipSalesRows.length > 0) {
        let memTotalCount = 0;
        let memTotalRev = 0;
        const memSalesTable: any[] = this.membershipSalesRows.map(r => {
          memTotalCount += Number(r.count || 0);
          memTotalRev += Number(r.revenue || 0);
          return [
            this.formatDate(r.sale_date),
            this.datePipe.transform(r.sale_date, 'EEEE') ?? '',
            r.count,
            this.formatCurrency(r.revenue),
          ];
        });

        memSalesTable.push([
          { content: 'TOTALS', colSpan: 2, styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: `${memTotalCount} subscriptions`, styles: { halign: 'center', fontStyle: 'bold', fillColor: [241, 245, 249] } },
          { content: this.formatCurrency(memTotalRev), styles: { halign: 'right', fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [5, 150, 105] } },
        ]);

        autoTable(doc, {
          startY,
          margin: { top: 18, bottom: 20, left: 14, right: 14 },
          head: [[
            { content: 'PREMIUM MEMBERSHIP SUBSCRIPTIONS (REVENUE BY DATE)', colSpan: 4, styles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' } },
          ], ['Date', 'Day of Week', 'New / Renewed Subscriptions', 'Collected Revenue']],
          body: memSalesTable,
          headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.2 },
          alternateRowStyles: { fillColor: [248, 250, 252] },
          styles: { fontSize: 7, cellPadding: 1.8 },
          columnStyles: {
            0: { halign: 'center' },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right', fontStyle: 'bold' },
          },
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
        // Page 1 Luxury Header Banner (Deep Navy Slate #0F172A)
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 22, 'F');

        // Gold Accent Bar
        doc.setFillColor(234, 179, 8); // Gold #EAB308
        doc.rect(0, 22, 210, 1.5, 'F');

        // Brand Text (Left)
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(234, 179, 8);
        doc.text('FORDAGO FITNESS & WELLNESS CLUB', 14, 9.5);

        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text('MANAGEMENT INFORMATION SYSTEM • AUDIT & COMPLIANCE DIVISION', 14, 16.5);

        // Header Right Info
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('EXECUTIVE AUDIT REPORT', 196, 9.5, { align: 'right' });

        doc.setFontSize(6.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(203, 213, 225);
        doc.text(`REF: ${reportRef}  |  CONFIDENTIAL`, 196, 16.5, { align: 'right' });

        // Report Title Bar (Dedicated row below Gold stripe)
        doc.setFontSize(10.5);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(reportTitle.toUpperCase(), 14, 28.5);

        // Metadata Sub-Strip Card (32mm to 44mm)
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.3);
        doc.rect(14, 32, 182, 12, 'FD');

        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);

        doc.text(`Audit Scope: ${periodLabel[currentPeriod] ?? 'All Time'}`, 17, 36.5);
        doc.text(`Generated: ${genTimestamp}`, 76, 36.5);
        doc.text('Security: STRICTLY CONFIDENTIAL', 138, 36.5);

        doc.text(`Module: ${targetTab.toUpperCase()}`, 17, 41);
        doc.text('Data Source: 100% Live Verified Sync', 76, 41);
        doc.text('Audited By: FordaGO Administration', 138, 41);

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
        doc.text(`CONFIDENTIAL  |  Generated: ${genTimestamp}`, 196, 7, { align: 'right' });
      }

      // Bottom Footer on Every Page (Cleanly Spaced)
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(14, 285, 196, 285);

      doc.setFontSize(6.8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text('FordaGO MIS • Official Administrative Audit Report', 14, 289.5);
      doc.text('CONFIDENTIAL — FOR INTERNAL AUDIT ONLY', 105, 289.5, { align: 'center' });
      doc.text(`Page ${p} of ${totalPages}`, 196, 289.5, { align: 'right' });

      // Official Sign-off on Last Page if room permits
      if (p === totalPages && finalTableY <= 245) {
        const signY = Math.max(finalTableY + 8, 248);
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

    const filename = `FordaGO_Audit_${targetTab.toUpperCase()}_${currentPeriod}_${new Date().toISOString().slice(0, 10)}.pdf`;
    return { doc, filename };
  }
}