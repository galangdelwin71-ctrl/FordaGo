import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonHeader, IonToolbar, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  paperPlaneOutline,
  chevronUpOutline,
  chevronDownOutline,
  trashOutline,
  logInOutline,
  logOutOutline,
  walkOutline,
  timeOutline,
  megaphoneOutline,
  peopleOutline,
  personOutline,
  personAddOutline,
  cardOutline,
  cartOutline,
  informationCircleOutline,
  notificationsOutline,
  createOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  closeOutline,
  addOutline,
  refreshOutline,
  searchOutline,
  eyeOutline,
  checkmarkOutline,
  closeCircleOutline,
  barbellOutline,
  pricetagOutline,
  readerOutline,
  fitnessOutline,
  calendarOutline,
  mailOutline,
  callOutline,
  imageOutline,
  downloadOutline,
  qrCodeOutline,
  cubeOutline,
  warningOutline,
  starOutline,
  chatbubbleEllipsesOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  flashOutline,
  cashOutline,
  keyOutline,
  documentTextOutline,
  lockClosedOutline,
  layersOutline,
  optionsOutline,
  ellipsisVerticalOutline,
  statsChartOutline,
  barChartOutline,
  clipboardOutline,
  fingerPrintOutline,
  arrowBackOutline,
  calendarNumberOutline,
  cameraOutline,
  checkmarkDoneOutline,
  chevronForwardOutline,
  closeCircle,
  cloudOfflineOutline,
  locationOutline,
  pauseCircleOutline,
  personCircleOutline,
  receiptOutline,
  scanOutline,
  sendOutline,
  sparkles,
  timerOutline,
  todayOutline,
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { NoNegativeDirective } from '../directives/no-negative.directive';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_URL, resolveImageUrl } from '../config/api.config';
import { CoachingService } from '../services/coaching.service';
import { ToastService } from '../services/toast.service';
import { NotificationCenterService } from '../services/notification-center.service';
import { PullToRefreshComponent } from '../shared/pull-to-refresh/pull-to-refresh.component';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [IonHeader, IonToolbar, IonContent, IonIcon, IonSpinner, CommonModule, FormsModule, NoNegativeDirective, PullToRefreshComponent],
})
export class AdminPage implements OnInit, OnDestroy {
  /** Resolves relative /storage/... avatar paths to the correct backend URL. */
  resolveImg(path: string | null | undefined): string {
    return resolveImageUrl(path);
  }

  handleRefresh(event: any): void {
    try {
      this.loadAll();
    } finally {
      setTimeout(() => {
        event?.target?.complete?.();
      }, 700);
    }
  }
  private readonly maxProductImageDimension = 1200;
  private readonly productImageQuality = 0.82;
  private readonly maxProductImagePayloadLength = 8_000_000;
  // Stage 6 (Loading Speed Plan): thumbnail rendition saved to the new
  // thumbnail_url column, used by the Shop/Equipment grid views instead of
  // downloading the full 1200px image just to show it at a small size.
  // 300px/0.7 keeps the payload small while still looking sharp in a grid
  // card -- independent of maxProductImageDimension/productImageQuality
  // above, which stay unchanged for the full-size/detail-view image.
  private readonly thumbnailImageDimension = 300;
  private readonly thumbnailImageQuality = 0.7;

  activeTab: 'overview' | 'members' | 'schedule' | 'inventory' | 'equipment' | 'coaches' | 'notifs' | 'attendance' | 'feedback' | 'logs' = 'overview';
  private readonly api = this.resolveApiBase();

  private resolveApiBase(): string {
    return API_URL;
  }

  // ── Role helpers ─────────────────────────────────────
  get currentRole(): string { return this.auth.user?.role || 'admin'; }
  get isSuperAdmin(): boolean { return this.currentRole === 'super_admin'; }
  get isEmployee(): boolean { return this.currentRole === 'employee'; }
  get panelLabel(): string {
    if (this.isSuperAdmin) return 'Super Admin Panel';
    if (this.isEmployee) return 'Employee Panel';
    return 'Admin Panel';
  }
  /** Short initials shown in the header avatar badge (e.g. 'SA' for Super Admin). */
  get panelInitials(): string {
    if (this.isSuperAdmin) return 'SA';
    if (this.isEmployee) return 'EP';
    return 'AD';
  }
  /** Coach account management is admin/super_admin only — backend enforces
   *  this via role:admin,super_admin on /admin/coaches (employees excluded),
   *  so the tab itself is hidden for employees rather than shown-then-403ing. */
  get canManageCoaches(): boolean { return !this.isEmployee; }
  private readonly superAdminAssignableRoles = [
    { value: 'user', label: 'Member (User)' },
    { value: 'employee', label: 'Employee' },
    { value: 'admin', label: 'Admin' },
  ];
  private readonly adminAssignableRoles = [
    { value: 'user', label: 'Member (User)' },
    { value: 'employee', label: 'Employee' },
  ];
  private readonly defaultAssignableRoles = [
    { value: 'user', label: 'Member (User)' }
  ];

  /** Roles the current user is allowed to assign when creating accounts */
  get assignableRoles(): { value: string; label: string }[] {
    if (this.isSuperAdmin) return this.superAdminAssignableRoles;
    if (this.currentRole === 'admin') return this.adminAssignableRoles;
    return this.defaultAssignableRoles;
  }

  /**
   * Role-based authorization check for deleting member/user accounts.
   * - Never allow deleting yourself
   * - super_admin can delete anyone
   * - admin can delete employee and user accounts, but not admins/super_admins
   * - employee can only delete regular member (user) accounts
   */
  canDeleteMember(m: any): boolean {
    if (!m) return false;
    const currentUserId = this.auth.user?.id;
    if (currentUserId && Number(m.id) === Number(currentUserId)) return false;

    if (this.isSuperAdmin) return true;

    if (this.currentRole === 'admin') {
      return m.role !== 'admin' && m.role !== 'super_admin';
    }

    if (this.isEmployee) {
      return m.role === 'user';
    }

    return false;
  }

  // ── Confirm Dialog ───────────────────────────────────
  confirmDialog: {
    show: boolean;
    label?: string;
    name?: string;
    title?: string;
    message?: string;
    actionLabel?: string;
    icon?: string;
    onConfirm: () => void;
  } = {
    show: false,
    label: '',
    name: '',
    title: '',
    message: 'This action cannot be undone.',
    actionLabel: 'Delete',
    icon: 'trash-outline',
    onConfirm: () => {},
  };
  showLogoutDialog = false;

  private askConfirm(
    label: string,
    name: string,
    onConfirm: () => void,
    options?: { title?: string; message?: string; actionLabel?: string; icon?: string }
  ) {
    this.confirmDialog = {
      show: true,
      label,
      name,
      title: options?.title || `Delete ${label}?`,
      message: options?.message || 'This action cannot be undone.',
      actionLabel: options?.actionLabel || 'Delete',
      icon: options?.icon || 'trash-outline',
      onConfirm,
    };
  }

  // ── Overview ────────────────────────────────────────
  totalMembers = 0;
  activeToday = 0;
  lowStockCount = 0;
  pendingOrders = 0;
  expiringMembers: any[] = [];
  lowStockThreshold = 5;
  outOfStockProducts: any[] = [];
  lowStockProducts: any[] = [];
  allLowStockAlerts: any[] = [];

  quickRestockModal: {
    show: boolean;
    product: any;
    currentStock: number;
    newStock: number | null;
    isSaving: boolean;
  } = {
    show: false,
    product: null as any,
    currentStock: 0,
    newStock: null,
    isSaving: false,
  };

  get todayFormatted(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  get todayFormattedShort(): string {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  get greetingTime(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  get activeMembersCount(): number {
    return this.members.filter(m => m.membership_status === 'active').length;
  }

  calculateDaysLeft(expiryStr?: string | null): number | null {
    if (!expiryStr) return null;
    const expiry = new Date(expiryStr);
    if (isNaN(expiry.getTime())) return null;
    const now = new Date();
    const expiryMidnight = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate()).getTime();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return Math.round((expiryMidnight - todayMidnight) / (1000 * 60 * 60 * 24));
  }

  processInventoryData(data: any[]): void {
    this.products = Array.isArray(data) ? data : [];
    this.outOfStockProducts = this.products.filter(p => Number(p.stock) <= 0);
    this.lowStockProducts = this.products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= this.lowStockThreshold);
    this.allLowStockAlerts = [...this.outOfStockProducts, ...this.lowStockProducts];
    this.lowStockCount = this.allLowStockAlerts.length;
  }

  openQuickRestock(p: any, event?: Event): void {
    if (event) event.stopPropagation();
    const current = Number(p.stock) || 0;
    this.quickRestockModal = {
      show: true,
      product: p,
      currentStock: current,
      newStock: null,
      isSaving: false,
    };
  }

  closeQuickRestock(): void {
    this.quickRestockModal.show = false;
    this.quickRestockModal.product = null;
    this.quickRestockModal.newStock = null;
    this.quickRestockModal.isSaving = false;
  }

  applyStockIncrement(qty: number): void {
    const base = this.quickRestockModal.newStock !== null
      ? Number(this.quickRestockModal.newStock)
      : this.quickRestockModal.currentStock;
    this.quickRestockModal.newStock = Math.max(0, base + qty);
  }

  saveQuickRestock(): void {
    const p = this.quickRestockModal.product;
    if (!p) return;
    const qty = this.quickRestockModal.newStock !== null
      ? Number(this.quickRestockModal.newStock)
      : null;
    if (qty === null || isNaN(qty) || qty < 0) {
      this.toast.error('Please enter a valid stock quantity.');
      return;
    }
    this.quickRestockModal.isSaving = true;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    const payload = {
      ...p,
      stock: qty
    };

    this.http.put(`${this.api}/inventory/products/${p.id}`, payload, { headers }).subscribe({
      next: () => {
        this.quickRestockModal.isSaving = false;
        p.stock = qty;
        this.processInventoryData(this.products);
        this.toast.success(`Restocked ${p.name} to ${qty} units!`);
        this.closeQuickRestock();
      },
      error: () => {
        this.quickRestockModal.isSaving = false;
        this.toast.error('Failed to restock product. Please try again.');
      }
    });
  }

  navigateToProduct(p: any, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeTab = 'inventory';
    this.showAllProducts = true;
    this.productSearch = p.name;
    this.editProduct(p);
  }

  quickAddMember(): void {
    this.activeTab = 'members';
    this.showAddMember = true;
    this.editingMember = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  quickAddProduct(): void {
    this.activeTab = 'inventory';
    this.showAddProduct = true;
    this.editingProduct = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  quickAddCoach(): void {
    this.activeTab = 'coaches';
    this.showAddCoach = true;
    this.editingCoach = null;
    this.coachFormMode = 'new';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  quickAddScheduleSession(): void {
    this.activeTab = 'schedule';
    this.showAddSession = true;
    this.editingSession = null;
    if (!this.newSession.date) {
      this.newSession.date = this.toIsoDate(new Date());
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  quickCheckIn(): void {
    this.activeTab = 'attendance';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  quickOpenReports(): void {
    this.router.navigate(['/admin-reports']);
  }

  quickOpenLogs(): void {
    this.activeTab = 'logs';
    this.loadActivityLogs();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  navigateToMembers(filterStatus: 'all' | 'pending' | 'active' = 'all'): void {
    this.activeTab = 'members';
    this.memberSearch = '';
    this.memberStatusFilter = filterStatus;
    this.memberTypeFilter = 'all';
    this.showAllMembers = true;
  }

  navigateToAttendance(): void {
    this.activeTab = 'attendance';
  }

  navigateToLowStock(): void {
    this.activeTab = 'inventory';
    this.showAllProducts = true;
    this.productSearch = '';
  }

  navigateToPendingOrders(): void {
    this.activeTab = 'inventory';
    this.showAllPendingOrders = true;
    this.pendingOrderSearch = '';
    setTimeout(() => {
      const el = document.getElementById('pending-orders-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  viewExpiringMember(member: any): void {
    this.activeTab = 'members';
    this.memberSearch = member?.username || '';
    this.showAllMembers = true;
  }

  // ── Members ─────────────────────────────────────────
  members: any[] = [];
  memberSearch = '';
  memberStatusFilter: 'all' | 'pending' | 'active' = 'all';
  memberTypeFilter: 'all' | 'premium' | 'daily' = 'all';
  showAllMembers = false;
  latestMemberId: number | null = null;

  toggleShowAllMembers() {
    this.showAllMembers = !this.showAllMembers;
  }

  get pendingMembers() {
    return this.members.filter(m => m.membership_status !== 'active' && m.role !== 'admin');
  }

  get filteredMembers() {
    const q = this.memberSearch.toLowerCase();
    return this.members.filter(m => {
      const matchesSearch = !q || m.username?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q);
      const matchesStatus = this.memberStatusFilter === 'all'
        ? true
        : this.memberStatusFilter === 'pending'
          ? m.membership_status !== 'active'
          : m.membership_status === 'active';
      const matchesType = this.memberTypeFilter === 'all'
        ? true
        : this.memberTypeFilter === 'daily'
          ? m.membership_type === 'daily'
          : m.membership_type !== 'daily';
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  get displayedMembers() {
    if (this.showAllMembers || this.memberSearch.trim()) {
      return this.filteredMembers;
    }
    return this.filteredMembers.slice(0, 3);
  }

  // ── Schedule ─────────────────────────────────────────
  sessions: any[] = [];

  // ── Inventory ────────────────────────────────────────
  products: any[] = [];
  // Flat line-item rows straight from GET /inventory/orders. Never rendered
  // directly -- the template iterates `pendingOrderGroups` below, which packs
  // these back into one card per checkout (per order_group_id), matching
  // what the member sees on their side after placing a cart order.
  orders: any[] = [];

  // Orders packed by order_group_id -- one card per checkout instead of one
  // per product line. Falls back to the order's own id as the group key for
  // any legacy row that predates order_groups (order_group_id is null).
  //
  // Cached fields, not `get` accessors -- a getter here rebuilt a brand-new
  // array of brand-new objects on every template read, and since the
  // template reads it more than once per pass (an *ngIf, then an *ngFor),
  // Angular saw a different reference each time and threw
  // ExpressionChangedAfterItHasBeenCheckedError in dev mode (the page
  // "acting up"/crashing when opening the Orders tab). It also meant a
  // group's `cancelling` flag could be wiped mid-request by the next read.
  // Rebuilt only when `orders` itself changes.
  orderGroups: any[] = [];
  pendingOrderGroups: any[] = [];

  private rebuildOrderGroups(): void {
    const groups = new Map<number, any>();
    for (const o of this.orders) {
      const groupId = o.order_group_id ?? o.id;
      let group = groups.get(groupId);
      if (!group) {
        group = {
          id: groupId,
          username: o.username,
          email: o.email,
          items: [],
          total: 0,
          paymentMethod: o.group_payment_method || o.payment_method || 'cash',
          status: o.group_status || o.status,
          date: o.group_created_at || o.created_at,
          cancelling: false,
        };
        groups.set(groupId, group);
      }
      group.items.push({ name: o.product_name || 'Unknown product', quantity: o.quantity, total: o.total });
      group.total += Number(o.total) || 0;
    }
    this.orderGroups = Array.from(groups.values()).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    this.pendingOrderGroups = this.orderGroups.filter(g => g.status === 'pending');
  }

  // ── Inventory / Shop Search & View More ──────────────
  productSearch = '';
  showAllProducts = false;
  productsLimit = 3;

  get filteredProducts(): any[] {
    const q = this.productSearch.trim().toLowerCase();
    if (!q) return this.products;
    return this.products.filter(p =>
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  get displayedProducts(): any[] {
    if (this.showAllProducts || this.productSearch.trim()) {
      return this.filteredProducts;
    }
    return this.filteredProducts.slice(0, this.productsLimit);
  }

  // ── Pending Orders Search & View More ────────────────
  pendingOrderSearch = '';
  showAllPendingOrders = false;
  pendingOrdersLimit = 3;

  get filteredPendingOrderGroups(): any[] {
    const q = this.pendingOrderSearch.trim().toLowerCase();
    if (!q) return this.pendingOrderGroups;
    return this.pendingOrderGroups.filter(g =>
      (g.username && g.username.toLowerCase().includes(q)) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.items && g.items.some((it: any) => it.name && it.name.toLowerCase().includes(q)))
    );
  }

  get displayedPendingOrderGroups(): any[] {
    if (this.showAllPendingOrders || this.pendingOrderSearch.trim()) {
      return this.filteredPendingOrderGroups;
    }
    return this.filteredPendingOrderGroups.slice(0, this.pendingOrdersLimit);
  }

  // ── Equipment ────────────────────────────────────────
  equipment: any[] = [];
  equipmentSearch = '';
  showAllEquipment = false;
  equipmentLimit = 3;

  get filteredEquipment(): any[] {
    const q = this.equipmentSearch.trim().toLowerCase();
    if (!q) return this.equipment;
    return this.equipment.filter(e =>
      (e.name && e.name.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q)) ||
      (e.status && e.status.toLowerCase().includes(q)) ||
      (e.weight_scale && e.weight_scale.toLowerCase().includes(q))
    );
  }

  get displayedEquipment(): any[] {
    if (this.showAllEquipment || this.equipmentSearch.trim()) {
      return this.filteredEquipment;
    }
    return this.filteredEquipment.slice(0, this.equipmentLimit);
  }

  // ── Notifications ────────────────────────────────────
  notifications: any[] = [];
  notifMessage = '';
  notifTitle = '';
  notifTargetUserId: number | null = null;
  notifRecipientType: 'all' | 'specific' = 'all';
  notifRecipientSearch = '';
  showRecipientDropdown = false;
  notifViewMode: 'broadcasts' | 'members' = 'broadcasts';
  broadcastSearch = '';
  showAllBroadcasts = false;
  broadcastLimit = 4;
  notifMemberSearch = '';
  selectedNotifMember: any = null;

  showNotifDetailModal = false;
  selectedNotifDetail: any = null;

  get selectedNotifTargetMember(): any {
    return this.members.find(m => m.id === this.notifTargetUserId);
  }

  get filteredRecipientMembers(): any[] {
    const q = this.notifRecipientSearch.trim().toLowerCase();
    if (!q) return this.members;
    return this.members.filter(m =>
      (m.username && m.username.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  }

  setNotifRecipientType(type: 'all' | 'specific') {
    this.notifRecipientType = type;
    if (type === 'all') {
      this.notifTargetUserId = null;
      this.showRecipientDropdown = false;
    } else {
      if (!this.notifTargetUserId) {
        this.showRecipientDropdown = true;
      }
    }
  }

  selectNotifTargetMember(m: any) {
    this.notifTargetUserId = m.id;
    this.notifRecipientType = 'specific';
    this.showRecipientDropdown = false;
    this.notifRecipientSearch = '';
  }

  clearNotifTargetMember() {
    this.notifTargetUserId = null;
    this.showRecipientDropdown = true;
  }

  openNotifsTab() {
    this.activeTab = 'notifs';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get broadcastNotifications(): any[] {
    return this.notifications.filter(n => {
      const title = (n.title || '').toLowerCase();
      // Exclude personal workout session alerts from admin broadcast/notif view
      if (title.includes('missed workout') || title.includes('workout session') || n.session_key) {
        return false;
      }
      return !n.user_id || n.user_id === this.auth.user?.id;
    });
  }

  get unreadAdminNotifsCount(): number {
    return this.broadcastNotifications.filter(n => !n.is_read).length;
  }

  get filteredBroadcastNotifications(): any[] {
    const q = this.broadcastSearch.trim().toLowerCase();
    if (!q) return this.broadcastNotifications;
    return this.broadcastNotifications.filter(n =>
      (n.message && n.message.toLowerCase().includes(q)) ||
      (n.title && n.title.toLowerCase().includes(q))
    );
  }

  get displayedBroadcastNotifications(): any[] {
    if (this.showAllBroadcasts || this.broadcastSearch.trim()) {
      return this.filteredBroadcastNotifications;
    }
    return this.filteredBroadcastNotifications.slice(0, this.broadcastLimit);
  }

  get membersForNotifications(): any[] {
    const map = new Map<number, any>();
    for (const m of this.members) {
      map.set(m.id, {
        id: m.id,
        username: m.username,
        email: m.email,
        role: m.role,
        membership_type: m.membership_type,
        photo_url: m.photo_url,
        notifications: [],
        unreadCount: 0
      });
    }

    for (const n of this.notifications) {
      const title = (n.title || '').toLowerCase();
      if (title.includes('missed workout') || title.includes('workout session') || n.session_key) {
        continue;
      }
      if (n.user_id) {
        let entry = map.get(n.user_id);
        if (!entry) {
          entry = {
            id: n.user_id,
            username: n.user?.username || 'Member #' + n.user_id,
            email: n.user?.email || '',
            role: n.user?.role || 'member',
            membership_type: 'regular',
            photo_url: null,
            notifications: [],
            unreadCount: 0
          };
          map.set(n.user_id, entry);
        }
        entry.notifications.push(n);
        if (!n.is_read) entry.unreadCount++;
      }
    }

    const list = Array.from(map.values()).sort((a, b) => b.notifications.length - a.notifications.length);
    const q = this.notifMemberSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(m =>
      (m.username && m.username.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  }

  get selectedMemberNotifications(): any[] {
    if (!this.selectedNotifMember) return [];
    return this.notifications.filter(n => {
      const title = (n.title || '').toLowerCase();
      if (title.includes('missed workout') || title.includes('workout session') || n.session_key) {
        return false;
      }
      return n.user_id === this.selectedNotifMember.id;
    });
  }

  selectNotifMember(m: any) {
    this.selectedNotifMember = m;
  }

  clearSelectedNotifMember() {
    this.selectedNotifMember = null;
  }

  getNotifTypeCategory(n: any): { label: string; icon: string; cssClass: string } {
    const title = (n?.title || '').toLowerCase();
    const msg = (n?.message || '').toLowerCase();
    if (title.includes('registration') || title.includes('registered') || msg.includes('nag-register')) {
      return { label: 'REGISTRATION', icon: 'person-add-outline', cssClass: 'type-reg' };
    }
    if (title.includes('verification') || title.includes('renewal') || title.includes('membership') || msg.includes('premium pass') || msg.includes('renew')) {
      return { label: 'MEMBERSHIP', icon: 'card-outline', cssClass: 'type-membership' };
    }
    if (title.includes('order') || msg.includes('order') || msg.includes('item')) {
      return { label: 'SHOP ORDER', icon: 'cart-outline', cssClass: 'type-order' };
    }
    if (!n?.user_id) {
      return { label: 'BROADCAST', icon: 'megaphone-outline', cssClass: 'type-broadcast' };
    }
    return { label: 'NOTICE', icon: 'information-circle-outline', cssClass: 'type-notice' };
  }

  viewNotification(n: any) {
    this.selectedNotifDetail = n;
    this.showNotifDetailModal = true;
    if (!n.is_read) {
      n.is_read = true;
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.patch(`${this.api}/notifications/read`, { ids: [n.id] }, { headers }).subscribe({
        error: () => {}
      });
    }
  }

  navigateToMemberFromNotif(n: any) {
    this.showNotifDetailModal = false;
    this.activeTab = 'members';
    this.showAllMembers = true;
    this.memberStatusFilter = 'all';
    this.memberTypeFilter = 'all';
    const match = n?.message?.match(/@([a-zA-Z0-9_.-]+)/);
    if (match && match[1]) {
      this.memberSearch = match[1];
    } else if (n?.title) {
      const nameMatch = n.title.match(/:\s*(.+)$/);
      if (nameMatch && nameMatch[1]) {
        this.memberSearch = nameMatch[1].trim();
      }
    }
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }

  navigateToOrdersFromNotif() {
    this.showNotifDetailModal = false;
    this.navigateToPendingOrders();
  }

  markAllNotifsAsRead() {
    const unread = this.broadcastNotifications.filter(n => !n.is_read);
    if (unread.length === 0) {
      this.toast.info('All notifications are already marked as read');
      return;
    }
    unread.forEach(n => n.is_read = true);
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.patch(`${this.api}/notifications/read`, { all: true }, { headers }).subscribe({
      next: () => this.toast.success('All notifications marked as read'),
      error: () => {}
    });
  }

  formatNotifDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  }

  // ── Attendance ───────────────────────────────────────
  attendanceToday:   any[] = [];
  attendancePending: any[] = [];
  equipmentScanLogs: any[] = [];
  // Loading/error flags -- kept separate from an empty array so the
  // template (and whoever's debugging) can tell "genuinely no records for
  // this date" apart from "the request failed" instead of both collapsing
  // into the same empty-state message. Previously every one of these three
  // lists' error handlers just silently reset to `[]`, which is exactly
  // what made a dead API_BASE_URL / offline ngrok tunnel indistinguishable
  // from an ordinary empty day.
  attendancePendingLoading = false;
  attendancePendingError   = false;
  attendanceTodayLoading   = false;
  attendanceTodayError     = false;
  equipmentScanLogsLoading = false;
  equipmentScanLogsError   = false;
  selectedReportDate = '';
  gymQrCode = 'FORDAGO_GYM_CHECKIN_V1';
  gymQrImageUrl = '';
  showQrCode = false;
  isLoadingQrCode = false;
  qrCodeError = '';

  attendanceSearch = '';
  attendanceStatusFilter: 'all' | 'pending' | 'paid' = 'all';
  attendanceTypeFilter: 'all' | 'premium' | 'daily' = 'all';
  attendanceViewMode: 'attendance' | 'equipment' = 'attendance';

  get isTodaySelected(): boolean {
    return this.selectedReportDate === this.toIsoDate(new Date());
  }

  get filteredAttendance() {
    const q = this.attendanceSearch.trim().toLowerCase();
    return this.attendanceToday.filter(a => {
      const matchesSearch = !q
        || a.username?.toLowerCase().includes(q)
        || a.email?.toLowerCase().includes(q);
      const matchesStatus = this.attendanceStatusFilter === 'all'
        ? true
        : this.attendanceStatusFilter === 'pending'
          ? a.payment_status === 'pending'
          : a.payment_status === 'paid';
      const matchesType = this.attendanceTypeFilter === 'all'
        ? true
        : this.attendanceTypeFilter === 'daily'
          ? (a.membership_type === 'daily' || a.user_plan === 'daily')
          : (a.membership_type !== 'daily' && a.user_plan !== 'daily');
      return matchesSearch && matchesStatus && matchesType;
    });
  }

  get filteredEquipmentScanLogs() {
    const q = this.attendanceSearch.trim().toLowerCase();
    return this.equipmentScanLogs.filter(log => {
      return !q
        || log.username?.toLowerCase().includes(q)
        || log.email?.toLowerCase().includes(q)
        || log.equipment_name?.toLowerCase().includes(q)
        || log.equipment_code?.toLowerCase().includes(q);
    });
  }

  showAllAttendance = false;
  attendanceLimit = 4;
  showAllEquipmentLogs = false;
  equipmentLogsLimit = 4;

  get displayedAttendance() {
    if (this.showAllAttendance || this.attendanceSearch.trim()) {
      return this.filteredAttendance;
    }
    return this.filteredAttendance.slice(0, this.attendanceLimit);
  }

  get displayedEquipmentScanLogs() {
    if (this.showAllEquipmentLogs || this.attendanceSearch.trim()) {
      return this.filteredEquipmentScanLogs;
    }
    return this.filteredEquipmentScanLogs.slice(0, this.equipmentLogsLimit);
  }

  // ── Coaches ──────────────────────────────────────────
  coaches: any[] = [];
  coachesLoading = false;
  coachesError = false;
  coachSearch = '';
  coachStatusFilter: 'all' | 'active' | 'inactive' = 'all';
  showAllCoaches = false;
  coachesLimit = 3;

  showAddCoach = false;
  editingCoach: any = null;
  /** 'new' creates a brand-new user+coach account; 'promote' attaches a
   *  coach profile to an existing member (see AdminCoachController::store). */
  coachFormMode: 'new' | 'promote' = 'new';
  newCoach = {
    user_id: null as number | null,
    username: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    first_name: '',
    last_name: '',
    bio: '',
    specialty: '',
    photo_url: '',
    rate: 0,
  };

  get filteredCoaches() {
    const q = this.coachSearch.trim().toLowerCase();
    return this.coaches.filter(c => {
      const matchesSearch = !q
        || c.username?.toLowerCase().includes(q)
        || c.email?.toLowerCase().includes(q)
        || c.specialty?.toLowerCase().includes(q);
      const matchesStatus = this.coachStatusFilter === 'all'
        ? true
        : this.coachStatusFilter === 'active'
          ? !!c.is_active
          : !c.is_active;
      return matchesSearch && matchesStatus;
    });
  }

  get displayedCoaches() {
    if (this.showAllCoaches || this.coachSearch.trim()) {
      return this.filteredCoaches;
    }
    return this.filteredCoaches.slice(0, this.coachesLimit);
  }

  /** Members who don't already have a coach profile — the only valid pool
   *  for the "promote existing user" flow. */
  get promotableMembers() {
    const coachUserIds = new Set(this.coaches.map(c => c.user_id));
    return this.members.filter(m => !coachUserIds.has(m.id));
  }

  // ── Membership edit ──────────────────────────────────
  editingMembershipFor: any = null;
  membershipForm = { membership_type: 'premium', membership_expiry: '' };

  constructor(
    public auth: AuthService,
    public router: Router,
    private http: HttpClient,
    private coaching: CoachingService,
    private toast: ToastService,
    private notificationCenter: NotificationCenterService
  ) {
    addIcons({
      paperPlaneOutline,
      chevronUpOutline,
      chevronDownOutline,
      trashOutline,
      logInOutline,
      logOutOutline,
      walkOutline,
      timeOutline,
      megaphoneOutline,
      peopleOutline,
      personOutline,
      personAddOutline,
      cardOutline,
      cartOutline,
      informationCircleOutline,
      notificationsOutline,
      createOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      closeOutline,
      addOutline,
      refreshOutline,
      searchOutline,
      eyeOutline,
      checkmarkOutline,
      closeCircleOutline,
      barbellOutline,
      pricetagOutline,
      readerOutline,
      fitnessOutline,
      calendarOutline,
      mailOutline,
      callOutline,
      imageOutline,
      downloadOutline,
      qrCodeOutline,
      cubeOutline,
      warningOutline,
      starOutline,
      chatbubbleEllipsesOutline,
      shieldCheckmarkOutline,
      sparklesOutline,
      flashOutline,
      cashOutline,
      keyOutline,
      documentTextOutline,
      lockClosedOutline,
      layersOutline,
      optionsOutline,
      ellipsisVerticalOutline,
      statsChartOutline,
      barChartOutline,
      clipboardOutline,
      fingerPrintOutline,
      arrowBackOutline,
      calendarNumberOutline,
      cameraOutline,
      checkmarkDoneOutline,
      chevronForwardOutline,
      closeCircle,
      cloudOfflineOutline,
      locationOutline,
      pauseCircleOutline,
      personCircleOutline,
      receiptOutline,
      scanOutline,
      sendOutline,
      sparkles,
      timerOutline,
      todayOutline,
    });
  }

  // ── Members load state ──────────────────────────────────
  membersLoading = false;
  membersError   = false;

  // ── Live Clock ──────────────────────────────────────────
  liveClock = '';
  liveClockDigits = '';
  liveClockPeriod = '';
  private liveClockInterval: any = null;

  ngOnInit() {
    this.selectedReportDate = this.toIsoDate(new Date());
    this.startLiveClock();
  }

  private startLiveClock() {
    this.updateClock();
    if (this.liveClockInterval) clearInterval(this.liveClockInterval);
    this.liveClockInterval = setInterval(() => this.updateClock(), 1000);
  }

  private updateClock() {
    const now = new Date();
    let hours = now.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(now.getMinutes()).padStart(2, '0');
    const secondsStr = String(now.getSeconds()).padStart(2, '0');

    this.liveClockDigits = `${hoursStr}:${minutesStr}:${secondsStr}`;
    this.liveClockPeriod = period;
    this.liveClock = `${this.liveClockDigits} ${period}`;
  }

  private stopLiveClock() {
    if (this.liveClockInterval) {
      clearInterval(this.liveClockInterval);
      this.liveClockInterval = null;
    }
  }

  /** Interval ID for attendance auto-poll (every 15 s while tab is open). */
  private attendancePollInterval: ReturnType<typeof setInterval> | null = null;

  ionViewWillEnter() {
    this.stopAttendancePoll();
    this.notificationCenter.startPolling();
    this.loadAll();
    this.startLiveClock();
    // Start auto-refresh for attendance every 15 seconds
    this.attendancePollInterval = setInterval(() => {
      this.loadDailyReports();
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.get<any[]>(`${this.api}/attendance/pending`, { headers }).subscribe({
        next: data => {
          this.attendancePending = data.map(a => ({ ...a, initials: this.getInitials(a.username) }));
        },
        error: () => {}
      });
    }, 15000);
  }

  ionViewWillLeave() {
    this.stopAttendancePoll();
    this.stopLiveClock();
  }

  ngOnDestroy() {
    this.stopAttendancePoll();
    this.stopLiveClock();
  }

  private stopAttendancePoll() {
    if (this.attendancePollInterval !== null) {
      clearInterval(this.attendancePollInterval);
      this.attendancePollInterval = null;
    }
  }

  loadAll() {
    const headers = { Authorization: `Bearer ${this.auth.token}` };

    // Members
    this.membersLoading = true;
    this.membersError   = false;
    this.http.get<any[]>(`${this.api}/users`, { headers }).subscribe({
      next: data => {
        this.membersLoading = false;
        // Sort newest created accounts to the top (by created_at desc or id desc)
        const sorted = [...data].sort((a, b) => {
          if (a.created_at && b.created_at) {
            const diff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            if (diff !== 0) return diff;
          }
          return (Number(b.id) || 0) - (Number(a.id) || 0);
        });
        const membersWithDays = sorted.map(m => {
          const daysLeft = this.calculateDaysLeft(m.membership_expiry);
          const expiryDate = m.membership_expiry
            ? new Date(m.membership_expiry).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A';
          return {
            ...m,
            daysLeft,
            expiryDate,
            initials: this.getInitials(m.username || `${m.first_name || ''} ${m.last_name || ''}`)
          };
        });
        this.members = membersWithDays;
        this.totalMembers = data.length;
        if (sorted.length > 0) {
          this.latestMemberId = sorted[0].id;
        } else {
          this.latestMemberId = null;
        }
        this.expiringMembers = membersWithDays
          .filter(m => m.membership_type === 'premium' && m.daysLeft !== null && m.daysLeft <= 7 && m.daysLeft >= 0);
      },
      error: () => {
        this.membersLoading = false;
        this.membersError   = true;
        this.members = [];
        this.totalMembers = 0;
        this.latestMemberId = null;
        this.expiringMembers = [];
      }
    });

    // Sessions
    this.http.get<any[]>(`${this.api}/schedule`, { headers }).subscribe({
      next: data => this.sessions = data,
      error: () => this.sessions = []
    });

    // Products
    this.http.get<any[]>(`${this.api}/inventory/products`, { headers }).subscribe({
      next: data => {
        this.processInventoryData(data);
      },
      error: () => this.processInventoryData([])
    });

    // Orders -- pendingOrders (overview stat) counts checkout groups, not
    // raw line-item rows, so a 3-item cart order shows as 1 pending order
    // here instead of 3.
    this.http.get<any[]>(`${this.api}/inventory/orders`, { headers }).subscribe({
      next: data => {
        this.orders = data;
        this.rebuildOrderGroups();
        this.pendingOrders = this.pendingOrderGroups.length;
      },
      error: () => { this.orders = []; this.rebuildOrderGroups(); this.pendingOrders = 0; }
    });

    // Equipment
    this.http.get<any[]>(`${this.api}/equipment`, { headers }).subscribe({
      next: data => this.equipment = data,
      error: () => this.equipment = []
    });

    if (!this.isEmployee) {
      this.loadActivityLogs();
    }

    // Notifications
    this.http.get<any[]>(`${this.api}/notifications`, { headers }).subscribe({
      next: data => this.notifications = data,
      error: () => this.notifications = []
    });

    // Feedback (admin/super_admin only)
    if (!this.isEmployee) {
      this.loadFeedbacks();
    }

    // Attendance — pending daily payments
    this.attendancePendingLoading = true;
    this.attendancePendingError   = false;
    this.http.get<any[]>(`${this.api}/attendance/pending`, { headers }).subscribe({
      next: data => {
        this.attendancePendingLoading = false;
        this.attendancePending = data.map(a => ({ ...a, initials: this.getInitials(a.username) }));
      },
      error: () => {
        this.attendancePendingLoading = false;
        this.attendancePendingError   = true;
        this.attendancePending = [];
      }
    });

    // Coaches — admin/super_admin only; the backend 403s an employee token,
    // so skip the call entirely rather than firing a request we know will
    // fail and flipping coachesError on for a tab the employee never sees.
    if (this.canManageCoaches) {
      this.loadCoaches();
    }

    // Activity Logs
    this.loadActivityLogs();

    this.loadDailyReports();
  }

  loadCoaches() {
    this.coachesLoading = true;
    this.coachesError   = false;
    this.coaching.getAdminCoaches().subscribe({
      next: data => {
        this.coachesLoading = false;
        this.coaches = data;
      },
      error: () => {
        this.coachesLoading = false;
        this.coachesError   = true;
        this.coaches = [];
      }
    });
  }

  private toIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  onReportDateChange() {
    this.loadDailyReports();
  }

  loadDailyReports() {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    const date = this.selectedReportDate || this.toIsoDate(new Date());

    this.attendanceTodayLoading = true;
    this.attendanceTodayError   = false;
    this.http.get<any[]>(`${this.api}/attendance/by-date?date=${encodeURIComponent(date)}`, { headers }).subscribe({
      next: data => {
        this.attendanceTodayLoading = false;
        this.attendanceToday = data.map(a => ({ ...a, initials: this.getInitials(a.username) }));
        if (date === this.toIsoDate(new Date())) {
          this.activeToday = this.attendanceToday.length;
        }
      },
      error: () => {
        this.attendanceTodayLoading = false;
        this.attendanceTodayError   = true;
        this.attendanceToday = [];
      }
    });

    this.equipmentScanLogsLoading = true;
    this.equipmentScanLogsError   = false;
    this.http.get<any[]>(`${this.api}/equipment/scan-logs?date=${encodeURIComponent(date)}`, { headers }).subscribe({
      next: data => {
        this.equipmentScanLogsLoading = false;
        this.equipmentScanLogs = data.map(log => ({ ...log, initials: this.getInitials(log.username) }));
      },
      error: () => {
        this.equipmentScanLogsLoading = false;
        this.equipmentScanLogsError   = true;
        this.equipmentScanLogs = [];
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  // ── Form toggles ─────────────────────────────────────
  showAddMember   = false;
  showAddSession  = false;
  showAddProduct  = false;
  showAddEquipment = false;

  editingMember:   any = null;
  editingSession:  any = null;
  editingProduct:  any = null;
  editingEquipment: any = null;

  showNewMemberPw   = false;
  showEditMemberPw  = false;

  newMember = {
    username: '',
    email: '',
    password: '',
    phone: '',
    gender: '',
    role: 'user',
    membership_type: 'premium' as 'daily' | 'premium',
    payment_method: 'cash' as 'cash' | 'gcash',
  };
  newSession   = {
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '60 min',
    location: '',
    coach: '',
    member_ids: [] as number[],
    member_names: [] as string[],
  };
  memberTagSearch = '';
  newProduct   = { name: '', brand: '', price: 0, stock: 0, image_url: '', thumbnail_url: '' };
  newEquipment = { name: '', category: '', icon: '', status: 'available', image_url: '', thumbnail_url: '', description: '', weight_scale: '' };

  private normalizeEquipmentStatus(value: string | undefined): string {
    const normalized = String(value || '').trim().toLowerCase();

    if (normalized === 'not available' || normalized === 'unavailable' || normalized === 'notavailable' || normalized === 'in-use' || normalized === 'occupied') {
      return 'unavailable';
    }

    if (normalized === 'available' || normalized === 'maintenance') {
      return normalized;
    }

    return 'available';
  }

  private normalizeEquipmentPayload(payload: any) {
    return {
      ...payload,
      name: String(payload?.name || '').trim(),
      category: String(payload?.category || '').trim() || null,
      icon: String(payload?.icon || '').trim() || null,
      status: this.normalizeEquipmentStatus(payload?.status),
      image_url: String(payload?.image_url || '').trim() || null,
      thumbnail_url: String(payload?.thumbnail_url || '').trim() || null,
      description: String(payload?.description || '').trim() || null,
      weight_scale: String(payload?.weight_scale || '').trim() || null,
    };
  }

  toggleAddMember()    { this.showAddMember    = !this.showAddMember;    this.editingMember    = null; }
  toggleAddSession()   {
    this.showAddSession   = !this.showAddSession;
    this.editingSession   = null;
    if (this.showAddSession && !this.newSession.date) {
      this.newSession.date = this.toIsoDate(new Date());
    }
  }
  toggleAddProduct()   { this.showAddProduct   = !this.showAddProduct;   this.editingProduct   = null; }
  toggleAddEquipment() { this.showAddEquipment = !this.showAddEquipment; this.editingEquipment = null; }
  toggleAddCoach()     { this.showAddCoach     = !this.showAddCoach;     this.editingCoach     = null; this.coachFormMode = 'new'; }

  // ── Member tagging & Quick Schedule helpers ──────────
  get filteredMentionMembers() {
    const q = this.memberTagSearch.trim().toLowerCase();
    if (!q) return this.members.slice(0, 8);
    return this.members.filter(m =>
      m.username?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    ).slice(0, 8);
  }

  toggleMemberMention(m: any, target: 'new' | 'edit') {
    const form = target === 'new' ? this.newSession : this.editingSession;
    if (!form) return;
    if (!form.member_ids) form.member_ids = [];
    if (!form.member_names) form.member_names = [];

    const idx = form.member_ids.indexOf(m.id);
    if (idx >= 0) {
      form.member_ids.splice(idx, 1);
      form.member_names.splice(idx, 1);
    } else {
      form.member_ids.push(m.id);
      form.member_names.push(m.username);
    }
  }

  isMemberMentioned(memberId: number, target: 'new' | 'edit'): boolean {
    const form = target === 'new' ? this.newSession : this.editingSession;
    return form?.member_ids?.includes(memberId) || false;
  }

  removeMentionedMember(memberId: number, target: 'new' | 'edit') {
    const form = target === 'new' ? this.newSession : this.editingSession;
    if (!form || !form.member_ids) return;
    const idx = form.member_ids.indexOf(memberId);
    if (idx >= 0) {
      form.member_ids.splice(idx, 1);
      if (form.member_names && form.member_names.length > idx) {
        form.member_names.splice(idx, 1);
      }
    }
  }

  setQuickDate(offsetDays: number, target: 'new' | 'edit') {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const dateStr = this.toIsoDate(d);
    if (target === 'new') {
      this.newSession.date = dateStr;
    } else if (this.editingSession) {
      this.editingSession.date = dateStr;
    }
  }

  openPicker(inputEl: HTMLInputElement) {
    if (!inputEl) return;
    try {
      if (typeof (inputEl as any).showPicker === 'function') {
        (inputEl as any).showPicker();
      } else {
        inputEl.focus();
      }
    } catch {
      inputEl.focus();
    }
  }

  setQuickTime(timeStr: string, target: 'new' | 'edit') {
    if (target === 'new') {
      this.newSession.time = timeStr;
    } else if (this.editingSession) {
      this.editingSession.time = timeStr;
    }
  }

  setQuickDuration(durationStr: string, target: 'new' | 'edit') {
    if (target === 'new') {
      this.newSession.duration = durationStr;
    } else if (this.editingSession) {
      this.editingSession.duration = durationStr;
    }
  }

  // ── Members actions ──────────────────────────────────
  openAddMember() { this.toggleAddMember(); }

  editMember(m: any) {
    this.editingMember = { ...m, password: '' };
    this.showAddMember = false;
    this.showEditMemberPw = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveMember() {
    if (!this.newMember.username || !this.newMember.email || !this.newMember.password) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.post<any>(`${this.api}/users/create`, this.newMember, { headers }).subscribe({
      next: () => {
        this.newMember = { username: '', email: '', password: '', phone: '', gender: '', role: 'user', membership_type: 'premium', payment_method: 'cash' };
        this.showAddMember = false;
        this.toast.success('Member created successfully');
        this.loadAll();
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed to add member')
    });
  }

  updateMember() {
    if (!this.editingMember) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put<any>(`${this.api}/users/${this.editingMember.id}`, this.editingMember, { headers }).subscribe({
      next: () => {
        this.editingMember = null;
        this.toast.success('Member updated successfully');
        this.loadAll();
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed to update member')
    });
  }

  deleteMember(m: any) {
    this.askConfirm('Member', m.username, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/users/${m.id}`, { headers }).subscribe({
        next: () => {
          this.members = this.members.filter(x => x.id !== m.id);
          this.totalMembers--;
          if (this.latestMemberId === m.id) {
            this.latestMemberId = this.members.length > 0 ? this.members[0].id : null;
          }
          this.toast.success('Member deleted successfully');
        },
        error: () => this.toast.error('Failed to delete member')
      });
    });
  }

  // ── Schedule actions ─────────────────────────────────
  openAddSession() { this.toggleAddSession(); }

  editSession(s: any) {
    let memberIds: number[] = [];
    let memberNames: string[] = [];

    if (Array.isArray(s.member_ids)) {
      memberIds = [...s.member_ids];
    } else if (typeof s.member_ids === 'string') {
      try {
        const parsed = JSON.parse(s.member_ids);
        if (Array.isArray(parsed)) memberIds = parsed;
      } catch {}
    }

    if (Array.isArray(s.member_names)) {
      memberNames = [...s.member_names];
    } else if (typeof s.member_names === 'string') {
      memberNames = s.member_names.split(',').map((x: string) => x.trim()).filter(Boolean);
    }

    this.editingSession = {
      ...s,
      duration: s.duration || '60 min',
      description: s.description || '',
      member_ids: memberIds,
      member_names: memberNames,
    };
    this.showAddSession = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveSession() {
    if (!this.newSession.title.trim()) {
      this.toast.warning('Please enter a session title');
      return;
    }
    if (!this.newSession.date) {
      this.toast.warning('Please select a date for the session');
      return;
    }

    const headers = { Authorization: `Bearer ${this.auth.token}` };
    const mentionedCount = this.newSession.member_ids?.length || 0;

    this.http.post<any>(`${this.api}/schedule`, this.newSession, { headers }).subscribe({
      next: (s) => {
        this.sessions.unshift(s);
        this.newSession = {
          title: '',
          description: '',
          date: '',
          time: '',
          duration: '60 min',
          location: '',
          coach: '',
          member_ids: [],
          member_names: [],
        };
        this.showAddSession = false;
        if (mentionedCount > 0) {
          this.toast.success(`Session saved! Notification sent to ${mentionedCount} tagged member(s).`);
        } else {
          this.toast.success('Session added successfully');
        }
      },
      error: (e) => {
        this.toast.error(e.error?.message || 'Failed to add session. Please check your connection.');
      }
    });
  }

  updateSession() {
    if (!this.editingSession || !this.editingSession.title || !this.editingSession.date) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(`${this.api}/schedule/${this.editingSession.id}`, this.editingSession, { headers }).subscribe({
      next: () => {
        this.editingSession = null;
        this.toast.success('Session updated successfully');
        this.loadAll();
      },
      error: (e) => this.toast.error(e.error?.message || 'Failed to update session')
    });
  }

  deleteSession(s: any) {
    this.askConfirm('Session', s.title, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/schedule/${s.id}`, { headers }).subscribe({
        next: () => {
          this.sessions = this.sessions.filter(x => x.id !== s.id);
          this.toast.success('Session deleted successfully');
        },
        error: () => this.toast.error('Failed to delete session')
      });
    });
  }

  // ── Inventory actions ─────────────────────────────────
  openAddProduct() { this.toggleAddProduct(); }

  editProduct(p: any) {
    this.editingProduct = { ...p };
    this.showAddProduct = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveProduct() {
    if (!this.newProduct.name) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.post<any>(`${this.api}/inventory/products`, this.newProduct, { headers }).subscribe({
      next: (p) => {
        this.products.unshift(p);
        this.processInventoryData(this.products);
        this.newProduct = { name: '', brand: '', price: 0, stock: 0, image_url: '', thumbnail_url: '' };
        this.showAddProduct = false;
        this.toast.success('Product added successfully');
        this.loadAll();
      },
      error: () => this.toast.error('Failed to add product')
    });
  }


  async onProductImageChange(event: Event, target: 'new' | 'edit'): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      // Stage 6: produces both the full-size rendition (unchanged behavior)
      // and a small thumbnail from the same file read, so the Shop grid can
      // fetch thumbnail_url instead of the full image_url payload.
      const { full, thumbnail } = await this.optimizeProductImageWithThumbnail(file);

      if (full.length > this.maxProductImagePayloadLength) {
        this.toast.warning('Image is still too large. Please choose a smaller photo.');
        return;
      }

      if (target === 'new') {
        this.newProduct.image_url = full;
        this.newProduct.thumbnail_url = thumbnail;
      } else if (this.editingProduct) {
        this.editingProduct.image_url = full;
        this.editingProduct.thumbnail_url = thumbnail;
      }
    } catch {
      this.toast.error('Failed to process image');
    } finally {
      (event.target as HTMLInputElement).value = '';
    }
  }

  /**
   * Reads an image file into a loaded &lt;img&gt; element, ready to be drawn
   * onto a canvas at whatever size/quality the caller needs. Shared by
   * optimizeProductImage() (single full-size rendition, used by coach
   * photos too) and optimizeProductImageWithThumbnail() (full + thumbnail,
   * Stage 6 for products/equipment only) so the file is only ever read and
   * decoded once regardless of how many renditions are produced from it.
   */
  private readImageElement(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Invalid image file'));
        image.src = reader.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private renderImageToDataUrl(image: HTMLImageElement, maxDimension: number, quality: number): string {
    const { width, height } = this.getResizedDimensions(image.width, image.height, maxDimension);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas is not available');
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  }

  // Existing single-rendition path -- signature and behavior UNCHANGED,
  // still used as-is by coach photos (onCoachImageChange), which are out
  // of scope for the Stage 6 thumbnail work below.
  private async optimizeProductImage(file: File): Promise<string> {
    const image = await this.readImageElement(file);
    return this.renderImageToDataUrl(image, this.maxProductImageDimension, this.productImageQuality);
  }

  /**
   * Stage 6 (image optimization, products/equipment only): produces BOTH
   * the existing full-size rendition and a much smaller thumbnail
   * rendition from one file read/decode. The thumbnail is what gets saved
   * to the new thumbnail_url column (see the backend migration), which is
   * what lets the Shop and Equipment grids fetch a far smaller payload on
   * every list load instead of the full image every single item carries
   * today.
   */
  private async optimizeProductImageWithThumbnail(file: File): Promise<{ full: string; thumbnail: string }> {
    const image = await this.readImageElement(file);
    return {
      full: this.renderImageToDataUrl(image, this.maxProductImageDimension, this.productImageQuality),
      thumbnail: this.renderImageToDataUrl(image, this.thumbnailImageDimension, this.thumbnailImageQuality),
    };
  }

  private getResizedDimensions(width: number, height: number, maxDimension: number) {
    if (width <= maxDimension && height <= maxDimension) {
      return { width, height };
    }

    const scale = Math.min(maxDimension / width, maxDimension / height);
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale))
    };
  }

  updateProduct() {
    if (!this.editingProduct) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(`${this.api}/inventory/products/${this.editingProduct.id}`, this.editingProduct, { headers }).subscribe({
      next: () => {
        this.editingProduct = null;
        this.toast.success('Product updated successfully');
        this.loadAll();
      },
      error: () => this.toast.error('Failed to update product')
    });
  }

  deleteProduct(p: any) {
    this.askConfirm('Product', p.name, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/inventory/products/${p.id}`, { headers }).subscribe({
        next: () => {
          this.products = this.products.filter(x => x.id !== p.id);
          this.processInventoryData(this.products);
          this.toast.success('Product deleted successfully');
          this.loadAll();
        },

        error: () => this.toast.error('Failed to delete product')
      });
    });
  }

  // Approve/reject act on the whole checkout group (order_group_id) --
  // matching the /inventory/order-groups/:id/approve|reject backend, which
  // flips every line item in the group atomically -- rather than a single
  // product line, so a member's multi-item cart is confirmed or declined as
  // one unit instead of leaving some items approved and others pending.
  approveOrderGroup(group: any) {
    if (group.cancelling) return;
    group.cancelling = true;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(`${this.api}/inventory/order-groups/${group.id}/approve`, {}, { headers }).subscribe({
      next: () => {
        this.orders = this.orders.filter(x => (x.order_group_id ?? x.id) !== group.id);
        this.rebuildOrderGroups();
        this.pendingOrders = this.pendingOrderGroups.length;
        this.toast.success('Order approved successfully');
      },
      error: (err) => {
        group.cancelling = false;
        this.toast.error(err?.error?.message || 'Failed to approve order');
      }
    });
  }

  rejectOrderGroup(group: any) {
    if (group.cancelling) return;
    group.cancelling = true;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(`${this.api}/inventory/order-groups/${group.id}/reject`, {}, { headers }).subscribe({
      next: () => {
        this.orders = this.orders.filter(x => (x.order_group_id ?? x.id) !== group.id);
        this.rebuildOrderGroups();
        this.pendingOrders = this.pendingOrderGroups.length;
        this.toast.success('Order rejected successfully');
      },
      error: (err) => {
        group.cancelling = false;
        this.toast.error(err?.error?.message || 'Failed to reject order');
      }
    });
  }

  // ── Equipment actions ─────────────────────────────────
  openAddEquipment() { this.toggleAddEquipment(); }

  editEquipment(e: any) {
    this.editingEquipment = { ...e };
    this.showAddEquipment = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async onEquipmentImageChange(event: Event, target: 'new' | 'edit'): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      // Stage 6: same full+thumbnail pair as onProductImageChange() above.
      const { full, thumbnail } = await this.optimizeProductImageWithThumbnail(file);
      if (full.length > this.maxProductImagePayloadLength) {
        this.toast.warning('Image is still too large. Please choose a smaller photo.');
        return;
      }
      if (target === 'new') {
        this.newEquipment.image_url = full;
        this.newEquipment.thumbnail_url = thumbnail;
      } else if (this.editingEquipment) {
        this.editingEquipment.image_url = full;
        this.editingEquipment.thumbnail_url = thumbnail;
      }
    } catch {
      this.toast.error('Failed to process image');
    } finally {
      (event.target as HTMLInputElement).value = '';
    }
  }

  saveEquipment() {
    if (!this.newEquipment.name) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    const payload = this.normalizeEquipmentPayload(this.newEquipment);

    this.http.post<any>(`${this.api}/equipment`, payload, { headers }).subscribe({
      next: (e) => {
        this.equipment.unshift(e);
        this.newEquipment = { name: '', category: '', icon: '', status: 'available', image_url: '', thumbnail_url: '', description: '', weight_scale: '' };
        this.showAddEquipment = false;
        this.toast.success('Equipment added successfully');
      },
      error: (err) => this.toast.error(err?.error?.message || 'Failed to add equipment')
    });
  }

  updateEquipment() {
    if (!this.editingEquipment) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    const payload = this.normalizeEquipmentPayload(this.editingEquipment);

    this.http.put(`${this.api}/equipment/${this.editingEquipment.id}`, payload, { headers }).subscribe({
      next: () => {
        this.editingEquipment = null;
        this.toast.success('Equipment updated successfully');
        this.loadAll();
      },
      error: (err) => this.toast.error(err?.error?.message || 'Failed to update equipment')
    });
  }

  deleteEquipment(e: any) {
    this.askConfirm('Equipment', e.name, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/equipment/${e.id}`, { headers }).subscribe({
        next: () => {
          this.equipment = this.equipment.filter(x => x.id !== e.id);
          this.toast.success('Equipment deleted successfully');
        },
        error: () => this.toast.error('Failed to delete equipment')
      });
    });
  }

  // ── Coaches actions ────────────────────────────────────
  openAddCoach() { this.toggleAddCoach(); }

  editCoach(c: any) {
    // The list endpoint returns the display field `profile_image` (photo_url
    // falling back to the user's own avatar) but the update endpoint takes
    // `photo_url` — seed the edit form from whichever image is currently
    // showing so the preview isn't blank on open.
    this.editingCoach = { ...c, photo_url: c.profile_image || '' };
    this.showAddCoach = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async onCoachImageChange(event: Event, target: 'new' | 'edit'): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const result = await this.optimizeProductImage(file);

      if (result.length > this.maxProductImagePayloadLength) {
        this.toast.warning('Image is still too large. Please choose a smaller photo.');
        return;
      }

      if (target === 'new') {
        this.newCoach.photo_url = result;
      } else if (this.editingCoach) {
        this.editingCoach.photo_url = result;
      }
    } catch {
      this.toast.error('Failed to process image');
    } finally {
      (event.target as HTMLInputElement).value = '';
    }
  }

  saveCoach() {
    const isPromote = this.coachFormMode === 'promote';

    if (isPromote && !this.newCoach.user_id) {
      this.toast.warning('Please select a member to promote.');
      return;
    }
    if (!isPromote && (!this.newCoach.username || !this.newCoach.email || !this.newCoach.password)) {
      this.toast.warning('Username, email and password are required for a new coach account.');
      return;
    }
    if (!isPromote && (!this.newCoach.first_name.trim() || !this.newCoach.last_name.trim())) {
      this.toast.warning('First name and last name are required for a new coach account.');
      return;
    }

    const rate = Number(this.newCoach.rate) || 0;
    if (rate < 0) {
      this.toast.warning('Rate cannot be negative.');
      return;
    }

    const payload: any = {
      bio: this.newCoach.bio,
      specialty: this.newCoach.specialty,
      photo_url: this.newCoach.photo_url,
      rate,
    };

    if (isPromote) {
      payload.user_id = this.newCoach.user_id;
    } else {
      payload.username   = this.newCoach.username;
      payload.email      = this.newCoach.email;
      payload.password   = this.newCoach.password;
      payload.phone      = this.newCoach.phone;
      payload.gender     = this.newCoach.gender;
      payload.first_name = this.newCoach.first_name.trim();
      payload.last_name  = this.newCoach.last_name.trim();
    }

    this.coaching.createCoach(payload).subscribe({
      next: () => {
        this.newCoach = { user_id: null, username: '', email: '', password: '', phone: '', gender: '', first_name: '', last_name: '', bio: '', specialty: '', photo_url: '', rate: 0 };
        this.coachFormMode = 'new';
        this.showAddCoach = false;
        this.toast.success('Coach account created successfully');
        this.loadCoaches();
      },
      error: (e) => this.toast.error(e?.error?.message || 'Failed to create coach')
    });
  }

  updateCoach() {
    if (!this.editingCoach) return;

    const rate = Number(this.editingCoach.rate) || 0;
    if (rate < 0) {
      this.toast.warning('Rate cannot be negative.');
      return;
    }

    const payload = {
      bio: this.editingCoach.bio,
      specialty: this.editingCoach.specialty,
      photo_url: this.editingCoach.photo_url,
      rate,
    };

    this.coaching.updateAdminCoach(this.editingCoach.user_id, payload).subscribe({
      next: () => {
        this.editingCoach = null;
        this.toast.success('Coach updated successfully');
        this.loadCoaches();
      },
      error: (e) => this.toast.error(e?.error?.message || 'Failed to update coach')
    });
  }

  // Soft-deactivate (backend never hard-deletes coach_profiles — see
  // AdminCoachController::destroy). Reversible via reactivateCoach(), so
  // this uses an in-app confirmation modal rather than a browser confirm()
  deactivateCoach(c: any) {
    this.askConfirm('Coach', c.username, () => {
      this.coaching.deleteAdminCoach(c.user_id).subscribe({
        next: () => {
          const idx = this.coaches.findIndex(x => x.user_id === c.user_id);
          if (idx !== -1) this.coaches[idx].is_active = false;
          this.toast.success('Coach deactivated successfully');
        },
        error: (e) => this.toast.error(e?.error?.message || 'Failed to deactivate coach')
      });
    }, {
      title: `Deactivate ${c.username}?`,
      message: 'Their profile is kept and can be reactivated later.',
      actionLabel: 'Deactivate',
      icon: 'pause-circle-outline'
    });
  }

  reactivateCoach(c: any) {
    this.coaching.updateAdminCoach(c.user_id, { is_active: true }).subscribe({
      next: () => {
        const idx = this.coaches.findIndex(x => x.user_id === c.user_id);
        if (idx !== -1) this.coaches[idx].is_active = true;
        this.toast.success('Coach reactivated successfully');
      },
      error: (e) => this.toast.error(e?.error?.message || 'Failed to reactivate coach')
    });
  }

  deleteCoach(c: any) {
    const coachName = c.first_name ? `${c.first_name} ${c.last_name}` : (c.username || `Coach #${c.user_id}`);
    this.askConfirm('Coach', coachName, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete<any>(`${this.api}/admin/coaches/${c.user_id}?permanent=true`, { headers }).subscribe({
        next: () => {
          this.coaches = this.coaches.filter(x => x.user_id !== c.user_id);
          this.toast.success(`Coach ${coachName} deleted permanently.`);
        },
        error: (e) => this.toast.error(e?.error?.message || 'Failed to delete coach account.')
      });
    }, {
      title: `Permanently Delete Coach?`,
      message: `Are you sure you want to delete ${coachName}? This removes their coach profile and credentials completely.`,
      actionLabel: 'Delete Coach',
      icon: 'trash-outline'
    });
  }

  // ── Notifications actions ─────────────────────────────
  sendNotification() {
    if (!this.notifMessage.trim()) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    const payload: any = {
      message: this.notifMessage.trim(),
      title: this.notifTitle.trim() || (this.notifTargetUserId ? 'Personal Notice' : 'Announcement')
    };
    if (this.notifTargetUserId) {
      payload.user_id = this.notifTargetUserId;
    }
    this.http.post<any>(`${this.api}/notifications`, payload, { headers }).subscribe({
      next: (res) => {
        const targetMember = this.notifTargetUserId ? this.members.find(m => m.id === this.notifTargetUserId) : null;
        const newNotif = {
          id: res?.id || Date.now(),
          user_id: this.notifTargetUserId,
          user: targetMember ? { id: targetMember.id, username: targetMember.username, email: targetMember.email, role: targetMember.role } : null,
          title: payload.title,
          message: this.notifMessage.trim(),
          is_read: false,
          created_at: new Date().toISOString()
        };
        this.notifications.unshift(newNotif);
        this.notifMessage = '';
        this.notifTitle = '';
        this.notifTargetUserId = null;
        this.toast.success('Notification sent successfully!');
      },
      error: () => this.toast.error('Failed to send notification')
    });
  }

  deleteNotification(n: any, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.askConfirm('Notification', (n.title || n.message?.substring(0, 30)) + '...', () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/notifications/${n.id}`, { headers }).subscribe({
        next: () => {
          this.notifications = this.notifications.filter(x => x.id !== n.id);
          if (this.selectedNotifDetail?.id === n.id) {
            this.showNotifDetailModal = false;
            this.selectedNotifDetail = null;
          }
          this.toast.success('Notification deleted successfully');
        },
        error: (err) => {
          // If already removed or not found (404), clean up local list
          if (err?.status === 404 || err?.status === 200) {
            this.notifications = this.notifications.filter(x => x.id !== n.id);
            if (this.selectedNotifDetail?.id === n.id) {
              this.showNotifDetailModal = false;
              this.selectedNotifDetail = null;
            }
            this.toast.success('Notification removed');
            return;
          }
          this.toast.error('Failed to delete notification');
        }
      });
    });
  }

  // ── Attendance actions ────────────────────────────────
  async toggleGymQrCode() {
    this.showQrCode = !this.showQrCode;

    if (!this.showQrCode || this.gymQrImageUrl) {
      return;
    }

    await this.loadGymQrCode();
  }

  async regenerateGymQrCode() {
    await this.loadGymQrCode(true);
  }

  downloadGymQrCode() {
    if (!this.gymQrImageUrl) return;

    const link = document.createElement('a');
    link.href = this.gymQrImageUrl;
    link.download = 'fordago-gym-attendance-qr.png';
    link.click();
  }

  private async loadGymQrCode(forceRefresh = false) {
    if (this.isLoadingQrCode) return;
    if (this.gymQrImageUrl && !forceRefresh) return;

    this.isLoadingQrCode = true;
    this.qrCodeError = '';

    try {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      const data = await firstValueFrom(
        this.http.get<{ qr_code?: string }>(`${this.api}/attendance/qr-code`, { headers })
      );
      const qrValue = String(data?.qr_code || '').trim();

      if (!qrValue) {
        throw new Error('Attendance QR payload is empty.');
      }

      this.gymQrCode = qrValue;
      this.gymQrImageUrl = await QRCode.toDataURL(qrValue, {
        width: 260,
        margin: 1,
        color: {
          dark: '#111111',
          light: '#FFFFFF',
        },
      });
    } catch (error) {
      this.gymQrImageUrl = '';
      // HttpErrorResponse (network/CORS/4xx/5xx) vs a plain Error (empty
      // payload above) need different messages -- a raw HttpErrorResponse's
      // own .message is a generic "Http failure response for ..." string
      // that isn't useful to a non-technical admin reading this on screen.
      if (error instanceof HttpErrorResponse) {
        this.qrCodeError = error.status === 0
          ? 'Could not reach the server. Check that the backend/tunnel is running and API_BASE_URL is correct.'
          : `Server error (${error.status}) while loading the QR code.`;
      } else {
        this.qrCodeError = error instanceof Error ? error.message : 'Failed to generate QR code.';
      }
    } finally {
      this.isLoadingQrCode = false;
    }
  }

  exportAttendancePdf() {
    const doc = new jsPDF();
    const reportDate = this.selectedReportDate || this.toIsoDate(new Date());

    doc.setFontSize(14);
    doc.text('FordaGO Attendance Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Date: ${reportDate}`, 14, 22);
    doc.text(`Generated: ${this.formatDateTime(new Date())}`, 14, 27);
    doc.text(`Total Records: ${this.attendanceToday.length}`, 14, 32);

    const rows = this.attendanceToday.map((a, index) => [
      index + 1,
      a.id || '-',
      a.username || '-',
      a.email || '-',
      a.membership_type || '-',
      this.formatDateTime(a.check_in_time),
      a.payment_status === 'paid' ? 'Confirmed' : 'Pending',
    ]);

    autoTable(doc, {
      startY: 36,
      head: [['#', 'Attendance ID', 'Member', 'Email', 'Plan', 'Check-in DateTime', 'Status']],
      body: rows.length ? rows : [['-', '-', 'No attendance records', '-', '-', '-', '-']],
      styles: { fontSize: 8.5 },
      headStyles: { fillColor: [20, 20, 20] },
    });

    doc.save(`fordago-attendance-${reportDate}.pdf`);
  }

  exportEquipmentLogsPdf() {
    const doc = new jsPDF();
    const reportDate = this.selectedReportDate || this.toIsoDate(new Date());

    doc.setFontSize(14);
    doc.text('FordaGO Equipment QR Scan Report', 14, 16);
    doc.setFontSize(10);
    doc.text(`Date: ${reportDate}`, 14, 22);
    doc.text(`Generated: ${this.formatDateTime(new Date())}`, 14, 27);
    doc.text(`Total Records: ${this.equipmentScanLogs.length}`, 14, 32);

    const rows = this.equipmentScanLogs.map((log, index) => [
      index + 1,
      log.id || '-',
      log.username || '-',
      log.email || '-',
      log.equipment_name || '-',
      log.equipment_code || '-',
      this.formatDateTime(log.scanned_at),
    ]);

    autoTable(doc, {
      startY: 36,
      head: [['#', 'Log ID', 'Member', 'Email', 'Equipment', 'Code', 'Scan DateTime']],
      body: rows.length ? rows : [['-', '-', 'No equipment scans', '-', '-', '-', '-']],
      styles: { fontSize: 8.5 },
      headStyles: { fillColor: [20, 20, 20] },
    });

    doc.save(`fordago-equipment-scans-${reportDate}.pdf`);
  }

  private formatDateTime(value: string | Date) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  confirmCheckin(a: any) {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(`${this.api}/attendance/${a.id}/confirm`, {}, { headers }).subscribe({
      next: () => {
        this.attendancePending = this.attendancePending.filter(x => x.id !== a.id);
        const rec = this.attendanceToday.find(x => x.id === a.id);
        if (rec) rec.payment_status = 'paid';
        this.toast.success('Check-in confirmed successfully');
      },
      error: () => this.toast.error('Failed to confirm check-in')
    });
  }

  rejectCheckin(a: any) {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(`${this.api}/attendance/${a.id}/reject`, {}, { headers }).subscribe({
      next: () => {
        this.attendancePending = this.attendancePending.filter(x => x.id !== a.id);
        this.attendanceToday   = this.attendanceToday.filter(x => x.id !== a.id);
        this.toast.success('Check-in rejected');
      },
      error: () => this.toast.error('Failed to reject check-in')
    });
  }

  setTodayReportDate() {
    this.selectedReportDate = this.toIsoDate(new Date());
    this.loadDailyReports();
  }

  deleteAttendance(a: any) {
    this.askConfirm('Attendance Record', `${a.username} (${this.formatDateTime(a.check_in_time)})`, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.put(`${this.api}/attendance/${a.id}/reject`, {}, { headers }).subscribe({
        next: () => {
          this.attendancePending = this.attendancePending.filter(x => x.id !== a.id);
          this.attendanceToday   = this.attendanceToday.filter(x => x.id !== a.id);
          this.toast.success('Attendance record deleted');
        },
        error: () => this.toast.error('Failed to delete attendance record')
      });
    });
  }

  // ── Membership activation ─────────────────────────────
  openMembershipEdit(m: any) {
    const targetMember = this.members.find(x => x.id === (m.user_id || m.id)) || m;
    this.editingMembershipFor = targetMember;
    this.membershipForm = {
      membership_type: targetMember.membership_type || targetMember.user_plan || 'premium',
      membership_expiry: targetMember.membership_expiry
        ? new Date(targetMember.membership_expiry).toISOString().split('T')[0]
        : '',
    };
  }

  saveMembership() {
    if (!this.editingMembershipFor) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(
      `${this.api}/users/${this.editingMembershipFor.id}/membership`,
      this.membershipForm,
      { headers }
    ).subscribe({
      next: () => {
        const idx = this.members.findIndex(m => m.id === this.editingMembershipFor.id);
        if (idx !== -1) Object.assign(this.members[idx], { ...this.membershipForm, membership_status: 'active' });
        this.editingMembershipFor = null;
        this.toast.success('Membership updated successfully');
      },
      error: () => this.toast.error('Failed to update membership')
    });
  }

  quickApprove(m: any) {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    const payload = {
      membership_type: m.membership_type || 'daily',
      membership_expiry: m.membership_expiry
        ? new Date(m.membership_expiry).toISOString().split('T')[0]
        : '',
    };
    this.http.put(`${this.api}/users/${m.id}/membership`, payload, { headers }).subscribe({
      next: () => {
        const idx = this.members.findIndex(x => x.id === m.id);
        if (idx !== -1) Object.assign(this.members[idx], { ...payload, membership_status: 'active' });
        this.toast.success('Member approved successfully');
      },
      error: () => this.toast.error('Failed to approve member')
    });
  }

  declineMember(m: any) {
    this.askConfirm('Decline & Remove', m.username, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/users/${m.id}`, { headers }).subscribe({
        next: () => {
          this.members = this.members.filter(x => x.id !== m.id);
          this.totalMembers--;
          this.toast.success('Member declined and removed');
        },
        error: () => this.toast.error('Failed to decline member')
      });
    });
  }

  // ── Feedback ────────────────────────────────────────────
  feedbacks: any[] = [];
  feedbacksLoading = false;
  feedbacksError   = false;
  feedbackSummary = { total: 0, avg_rating: 0, promoters: 0, passives: 0, detractors: 0, nps: 0 };
  feedbackSearch = '';
  feedbackFilter: 'all' | 'promoter' | 'passive' | 'detractor' = 'all';

  get filteredFeedbacks(): any[] {
    const q = this.feedbackSearch.trim().toLowerCase();
    return this.feedbacks.filter(f => {
      const matchSearch = !q
        || (f.user?.username ?? '').toLowerCase().includes(q)
        || (f.user?.first_name ?? '').toLowerCase().includes(q)
        || (f.user?.last_name ?? '').toLowerCase().includes(q)
        || (f.reason ?? '').toLowerCase().includes(q);
      const matchFilter = this.feedbackFilter === 'all'
        ? true
        : this.feedbackFilter === 'promoter'
          ? f.rating >= 9
          : this.feedbackFilter === 'passive'
            ? (f.rating >= 7 && f.rating < 9)
            : f.rating < 7;
      return matchSearch && matchFilter;
    });
  }

  getFeedbackSentiment(rating: number): { label: string; cls: string; emoji: string } {
    if (rating >= 9) return { label: 'Promoter', cls: 'fb-promoter', emoji: '😊' };
    if (rating >= 7) return { label: 'Passive', cls: 'fb-passive', emoji: '😐' };
    return { label: 'Detractor', cls: 'fb-detractor', emoji: '😞' };
  }

  getFeedbackStars(rating: number): number[] {
    return Array.from({ length: 10 }, (_, i) => i + 1);
  }

  getFeedbackUserName(f: any): string {
    const fn = f.user?.first_name || '';
    const ln = f.user?.last_name || '';
    const full = (fn + ' ' + ln).trim();
    return full || (f.user?.username ? `@${f.user.username}` : (f.user_id ? `Member (${f.user_id})` : 'Anonymous Member'));
  }

  loadFeedbacks() {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.feedbacksLoading = true;
    this.feedbacksError = false;
    this.http.get<any[]>(`${this.api}/feedback`, { headers }).subscribe({
      next: data => {
        this.feedbacksLoading = false;
        this.feedbacks = data;
      },
      error: () => {
        this.feedbacksLoading = false;
        this.feedbacksError = true;
        this.feedbacks = [];
      }
    });
    this.http.get<any>(`${this.api}/feedback/summary`, { headers }).subscribe({
      next: data => this.feedbackSummary = data,
      error: () => {}
    });
  }

  // ── Feedback Detail & Summary ───────────────────────────
  selectedFeedback: any = null;
  showFeedbackModal = false;
  feedbackSummaryModal = {
    show: false,
    total: 0,
    avgRating: 0,
    nps: 0,
    positiveRate: 0,
    promoters: 0,
    passives: 0,
    detractors: 0,
    keyThemes: [] as string[],
    summaryText: ''
  };

  openFeedbackDetail(f: any) {
    this.selectedFeedback = f;
    this.showFeedbackModal = true;
  }

  closeFeedbackDetail() {
    this.selectedFeedback = null;
    this.showFeedbackModal = false;
  }

  generateFeedbackSummary() {
    const list = this.feedbacks || [];
    const total = list.length;
    if (total === 0) {
      this.toast.info('No feedback records to analyze yet.');
      return;
    }

    const promoters = list.filter(f => f.rating >= 9).length;
    const passives = list.filter(f => f.rating >= 7 && f.rating < 9).length;
    const detractors = list.filter(f => f.rating < 7).length;
    const sumRatings = list.reduce((acc, f) => acc + (Number(f.rating) || 0), 0);
    const avgRating = Number((sumRatings / total).toFixed(1));
    const nps = Math.round(((promoters - detractors) / total) * 100);
    const positiveRate = Math.round(((promoters + passives) / total) * 100);

    // Keyword & theme analysis from comments
    const comments = list.map(f => (f.reason || '').toLowerCase()).join(' ');
    const themes: string[] = [];
    if (comments.includes('clean') || comments.includes('linis')) themes.push('Facility Cleanliness');
    if (comments.includes('coach') || comments.includes('trainer')) themes.push('Coach & Trainer Guidance');
    if (comments.includes('equipment') || comments.includes('machine') || comments.includes('gamit')) themes.push('Equipment Availability');
    if (comments.includes('crowd') || comments.includes('siksikan') || comments.includes('busy')) themes.push('Peak Hour Capacity');
    if (comments.includes('price') || comments.includes('mura') || comments.includes('worth')) themes.push('Membership Value');
    if (themes.length === 0) themes.push('General Gym Experience', 'Staff Service Quality');

    let summaryText = `Based on ${total} verified member reviews, FordaGO currently holds an Average Rating of ${avgRating}/10 with an NPS Score of ${nps}. `;
    if (nps >= 50) {
      summaryText += `Member sentiment is exceptionally positive (${positiveRate}% favorable). Members highly appreciate the workout environment and gym facility operations.`;
    } else if (nps >= 0) {
      summaryText += `Member sentiment is healthy and stable (${positiveRate}% favorable). Key operational attention should focus on equipment maintenance and evening peak traffic.`;
    } else {
      summaryText += `Attention is recommended: ${detractors} out of ${total} reviews expressed concerns. Review the feedback comments below to address specific member issues.`;
    }

    this.feedbackSummaryModal = {
      show: true,
      total,
      avgRating,
      nps,
      positiveRate,
      promoters,
      passives,
      detractors,
      keyThemes: themes,
      summaryText
    };
  }

  closeFeedbackSummary() {
    this.feedbackSummaryModal.show = false;
  }

  // ── Stock Badge Helper ──────────────────────────────────
  getStockBadge(stock: number): { label: string; cls: string; icon: string } {
    if (stock <= 0) return { label: 'Out of Stock', cls: 'stock-empty', icon: 'close-circle-outline' };
    if (stock <= 5) return { label: `${stock} units left`, cls: 'stock-low', icon: 'warning-outline' };
    return { label: `${stock} in stock`, cls: 'stock-healthy', icon: 'checkmark-circle-outline' };
  }

  // ── Activity Logs (Audit Trail) ────────────────────────
  activityLogs: any[] = [];
  activityLogsLoading = false;
  activityLogsError = false;
  activityLogStats = { total_today: 0, logins_today: 0, modifications_today: 0, active_sessions: 0 };
  activityLogStaffList: any[] = [];
  activityLogSearch = '';
  activityLogCategoryFilter: 'all' | 'auth' | 'modifications' | 'active_sessions' | 'members' | 'inventory' | 'equipment' | 'attendance' = 'all';
  activityLogStaffFilter: string = 'all';
  selectedActivityLog: any = null;

  get filteredActivityLogs(): any[] {
    const q = (this.activityLogSearch || '').trim().toLowerCase();
    return this.activityLogs.filter(log => {
      const matchSearch = !q
        || (log.action_title || '').toLowerCase().includes(q)
        || (log.description || '').toLowerCase().includes(q)
        || (log.action_description || '').toLowerCase().includes(q)
        || (log.username || '').toLowerCase().includes(q)
        || (log.full_name || '').toLowerCase().includes(q)
        || (log.user?.username || '').toLowerCase().includes(q)
        || (log.user?.first_name || '').toLowerCase().includes(q)
        || (log.action_type || '').toLowerCase().includes(q)
        || (log.action || '').toLowerCase().includes(q)
        || (log.ip_address || '').toLowerCase().includes(q);

      const action = (log.action_type || log.action || '').toLowerCase();
      const entity = (log.entity_type || '').toLowerCase();

      const matchCategory = this.activityLogCategoryFilter === 'all'
        ? true
        : this.activityLogCategoryFilter === 'auth'
          ? (action === 'login' || action === 'logout')
          : this.activityLogCategoryFilter === 'modifications'
            ? (action !== 'login' && action !== 'logout')
            : this.activityLogCategoryFilter === 'active_sessions'
              ? (action === 'login' && !log.logout_at)
              : this.activityLogCategoryFilter === 'members'
                ? (action.includes('member') || action.includes('user') || entity === 'user')
                : this.activityLogCategoryFilter === 'inventory'
                  ? (action.includes('inventory') || action.includes('product') || action.includes('order') || entity === 'product')
                  : this.activityLogCategoryFilter === 'equipment'
                    ? (action.includes('equipment') || entity === 'equipment')
                    : this.activityLogCategoryFilter === 'attendance'
                      ? (action.includes('attendance') || entity === 'attendance')
                      : true;

      const matchStaff = this.activityLogStaffFilter === 'all'
        ? true
        : String(log.user_id) === String(this.activityLogStaffFilter);

      return matchSearch && matchCategory && matchStaff;
    });
  }

  filterLogsByKpi(category: 'all' | 'auth' | 'modifications' | 'active_sessions' | 'members' | 'inventory' | 'equipment' | 'attendance'): void {
    if (this.activityLogCategoryFilter === category && category !== 'all') {
      this.activityLogCategoryFilter = 'all';
    } else {
      this.activityLogCategoryFilter = category;
    }
    // Smoothly scroll down to timeline list for immediate visual confirmation
    setTimeout(() => {
      const el = document.getElementById('activityLogsTimeline');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  }

  getCategoryFilterLabel(): string {
    switch (this.activityLogCategoryFilter) {
      case 'auth': return 'Staff Logins & Logouts';
      case 'modifications': return 'System Modifications';
      case 'active_sessions': return 'Active Staff Sessions';
      case 'members': return 'Members & Users';
      case 'inventory': return 'Inventory & Orders';
      case 'equipment': return 'Equipment Management';
      case 'attendance': return 'Attendance Records';
      default: return 'All Events';
    }
  }



  loadActivityLogs() {
    if (this.isEmployee) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.activityLogsLoading = true;
    this.activityLogsError = false;

    this.http.get<any>(`${this.api}/admin/activity-logs?per_page=100`, { headers }).subscribe({
      next: res => {
        this.activityLogsLoading = false;
        if (res) {
          const logList = res.logs?.data || res.logs || res.data?.data || res.data || (Array.isArray(res) ? res : []);
          this.activityLogs = Array.isArray(logList) ? logList : [];
          this.activityLogStats = res.stats || res.metrics || this.activityLogStats;
          this.activityLogStaffList = res.staff_list || [];
        }
      },
      error: () => {
        this.activityLogsLoading = false;
        this.activityLogsError = true;
        this.activityLogs = [];
      }
    });
  }

  getActivityActionIcon(action: string): string {
    const a = (action || '').toLowerCase();
    switch (a) {
      case 'login': return 'log-in-outline';
      case 'logout': return 'log-out-outline';
      case 'create_member':
      case 'member_add': return 'person-add-outline';
      case 'update_member':
      case 'member_update':
      case 'update_membership': return 'create-outline';
      case 'delete_member':
      case 'member_delete':
      case 'coach_delete': return 'trash-outline';
      case 'create_product':
      case 'inventory_add': return 'add-outline';
      case 'update_product':
      case 'inventory_update': return 'create-outline';
      case 'delete_product':
      case 'inventory_delete': return 'trash-outline';
      case 'approve_order': return 'checkmark-circle-outline';
      case 'create_equipment': return 'barbell-outline';
      case 'update_equipment':
      case 'equipment_update': return 'create-outline';
      case 'delete_equipment': return 'trash-outline';
      case 'confirm_attendance':
      case 'attendance_checkin': return 'checkmark-outline';
      case 'reject_attendance': return 'close-outline';
      default: return 'document-text-outline';
    }
  }

  getActivityActionClass(action: string): string {
    if (action === 'login') return 'action-login';
    if (action === 'logout') return 'action-logout';
    if (action.includes('delete') || action.includes('reject')) return 'action-danger';
    if (action.includes('approve') || action.includes('confirm') || action.includes('create')) return 'action-success';
    return 'action-info';
  }

  formatSessionDuration(minutes: number | null | undefined): string {
    if (minutes === null || minutes === undefined) return '';
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remMins = minutes % 60;
    return remMins > 0 ? `${hours}h ${remMins}m` : `${hours}h`;
  }

  cleanLogText(text: string | null | undefined, log?: any): string {
    if (!text) return '';
    let result = String(text);
    const targetName = log?.target_name || log?.payload?.target_name;
    const targetRole = log?.payload?.target_role ? (log.payload.target_role.charAt(0).toUpperCase() + log.payload.target_role.slice(1)) : 'Staff User';

    // Replace any "user #\d+ (@username)" or "user #\d+" with actual name
    result = result.replace(/user\s*#(\d+)(?:\s*\(@?([a-zA-Z0-9_.\-]+)\))?/gi, (match, id, handle) => {
      if (targetName) {
        return handle && targetName !== handle ? `${targetName} (@${handle})` : targetName;
      }
      if (handle) {
        return `@${handle}`;
      }
      return `${targetRole} (${id})`;
    });

    // Strip redundant parenthetical role tags right after user name, e.g. "Super Admin (super_admin)" -> "Super Admin"
    result = result.replace(/\s*\((super_admin|admin|employee|member)\)/gi, '');

    return result;
  }

  getLogActorName(log: any): string {
    if (!log) return 'Staff User';
    const fullName = (log.full_name || '').trim();
    if (fullName) return fullName;
    const userFirst = (log.user?.first_name || '').trim();
    const userLast = (log.user?.last_name || '').trim();
    if (userFirst || userLast) {
      return `${userFirst} ${userLast}`.trim();
    }
    return log.username || log.user?.username || 'Staff User';
  }

  shouldShowActorHandle(log: any): boolean {
    if (!log) return false;
    const rawHandle = (log.username || log.user?.username || '').trim();
    if (!rawHandle) return false;
    const name = this.getLogActorName(log);
    // If username is identical to the display name (e.g. "Super Admin" and "@Super Admin"), hide the redundant handle!
    const cleanHandle = rawHandle.toLowerCase().replace(/[@\s_]/g, '');
    const cleanName = name.toLowerCase().replace(/[@\s_]/g, '');
    return cleanHandle !== cleanName;
  }

  getLogRoleLabel(log: any): string {
    const rawRole = (log?.role || log?.user?.role || 'staff').toLowerCase();
    switch (rawRole) {
      case 'super_admin': return 'SUPER ADMIN';
      case 'admin':       return 'ADMIN';
      case 'employee':    return 'EMPLOYEE';
      default:            return rawRole.replace(/_/g, ' ').toUpperCase();
    }
  }

  cleanLogTitle(log: any): string {
    if (!log) return 'Activity Record';
    let title = log.action_title || log.title || 'Activity Record';
    const targetName = log.target_name || log.payload?.target_name;
    if (targetName) {
      title = title.replace(/^(Updated|Created|Deleted|Approved Membership for)\s+([A-Za-z]+)\s+@([a-zA-Z0-9_.\-]+)$/i, (m: string, p1: string, p2: string, h: string) => {
        return targetName !== h ? `${p1} ${p2}: ${targetName}` : m;
      });
    }
    return this.cleanLogText(title, log);
  }

  viewActivityPayload(log: any) {
    this.selectedActivityLog = log;
  }

  closeActivityPayload() {
    this.selectedActivityLog = null;
  }

  /**
   * Extracts Before & After changes from activity log payload or description
   */
  getLogChanges(log: any): { field: string; before: string; after: string }[] {
    if (!log) return [];
    let payload = log.payload;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = null;
      }
    }

    const changesList: { field: string; before: string; after: string }[] = [];

    // Case 1: Structured 'changes' in payload (from our improved controllers)
    if (payload && payload.changes) {
      if (Array.isArray(payload.changes)) {
        for (const ch of payload.changes) {
          if (ch && (ch.before !== undefined || ch.after !== undefined)) {
            changesList.push({
              field: ch.field || 'Attribute',
              before: String(ch.before !== undefined && ch.before !== null ? ch.before : '—'),
              after: String(ch.after !== undefined && ch.after !== null ? ch.after : '—'),
            });
          }
        }
      } else if (typeof payload.changes === 'object') {
        for (const [k, ch] of Object.entries(payload.changes as Record<string, any>)) {
          if (ch && typeof ch === 'object' && ('before' in ch || 'after' in ch)) {
            changesList.push({
              field: ch.field || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              before: String(ch.before !== undefined && ch.before !== null ? ch.before : '—'),
              after: String(ch.after !== undefined && ch.after !== null ? ch.after : '—'),
            });
          }
        }
      }
    }

    // Case 2: Natural language extraction from description if no structured changes found
    if (changesList.length === 0 && log.description) {
      const desc = String(log.description);

      // Regex for: Renamed from 'A' to 'B'
      const renameMatch = desc.match(/(?:renamed|changed name)\s+(?:from\s+)?['"]([^'"]+)['"]\s+to\s+['"]([^'"]+)['"]/i);
      if (renameMatch) {
        changesList.push({
          field: 'Product Name',
          before: renameMatch[1],
          after: renameMatch[2],
        });
      }

      // Regex for: role from 'A' to 'B'
      const roleMatch = desc.match(/(?:role|plan)\s+(?:from\s+)?['"]?([a-zA-Z0-9_\s]+)['"]?\s+to\s+['"]?([a-zA-Z0-9_\s]+)['"]?/i);
      if (roleMatch && !renameMatch) {
        changesList.push({
          field: 'Account Role',
          before: roleMatch[1].trim(),
          after: roleMatch[2].trim(),
        });
      }

      // Regex for: Price changed from ₱A to ₱B
      const priceMatch = desc.match(/Price\s+(?:changed\s+)?(?:from\s+)?(₱?[0-9,.]+)\s+to\s+(₱?[0-9,.]+)/i);
      if (priceMatch) {
        changesList.push({
          field: 'Price',
          before: priceMatch[1],
          after: priceMatch[2],
        });
      }

      // Regex for: Stock changed from A to B
      const stockMatch = desc.match(/Stock\s+(?:changed\s+)?(?:from\s+)?([0-9]+)\s+to\s+([0-9]+)/i);
      if (stockMatch) {
        changesList.push({
          field: 'Stock Quantity',
          before: `${stockMatch[1]} units`,
          after: `${stockMatch[2]} units`,
        });
      }
    }

    return changesList;
  }

  getModalPayloadItems(log: any): { label: string; value: string; isPill?: boolean; pillType?: string }[] {
    if (!log) return [];
    let payload = log.payload;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        payload = null;
      }
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];

    const items: { label: string; value: string; isPill?: boolean; pillType?: string }[] = [];

    const labelMap: Record<string, string> = {
      price: 'Price',
      stock: 'Stock Quantity',
      current_price: 'Current Price',
      current_stock: 'Current Stock',
      brand: 'Brand',
      category: 'Category',
      role: 'Role Assigned',
      membership_type: 'Membership Plan',
      payment_method: 'Payment Method',
      expiry: 'Membership Expiry',
      updated_fields: 'Modified Attributes',
      target_role: 'Target Role',
      target_name: 'Target Name',
      email: 'Email Address',
      phone: 'Contact Number',
      gender: 'Gender',
      status: 'Status',
      notes: 'Remarks',
      quantity: 'Quantity',
      duration: 'Duration',
    };

    for (const key of Object.keys(payload)) {
      if (key === 'password' || key === 'target_name' || key === 'changes') continue;
      const rawVal = payload[key];
      if (rawVal === null || rawVal === undefined || rawVal === '') continue;

      const label = labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      let value = String(rawVal);
      let isPill = false;
      let pillType = 'default';

      if (key === 'price' || key === 'amount' || key === 'fee' || key === 'current_price') {
        const num = parseFloat(rawVal);
        value = !isNaN(num) ? `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₱${rawVal}`;
      } else if (key === 'stock' || key === 'quantity' || key === 'current_stock') {
        value = `${rawVal} units`;
      } else if (key === 'updated_fields' && Array.isArray(rawVal)) {
        value = rawVal.map((f: string) => f.replace(/_/g, ' ')).join(', ');
        isPill = true;
        pillType = 'info';
      } else if (key === 'role' || key === 'target_role') {
        value = rawVal.replace(/_/g, ' ').toUpperCase();
        isPill = true;
        pillType = 'role';
      } else if (key === 'membership_type') {
        value = rawVal.toUpperCase();
        isPill = true;
        pillType = 'plan';
      }

      items.push({ label, value, isPill, pillType });
    }

    return items;
  }

  // ── Logout ────────────────────────────────────────────
  logout() {
    this.showLogoutDialog = true;
  }

  cancelLogout() {
    this.showLogoutDialog = false;
  }

  confirmLogout() {
    this.showLogoutDialog = false;
    this.auth.logout();
    // replaceUrl: true -- see the matching note in profile.page.ts's
    // logout(). Keeps /login from persisting in history once this admin/
    // staff session ends, so a later back-navigation from any drill-in
    // page (in whichever account logs in next) can never resolve back to
    // a stale /login entry.
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}