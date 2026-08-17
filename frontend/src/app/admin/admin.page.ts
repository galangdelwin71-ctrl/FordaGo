import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonButtons, IonContent, IonIcon, IonSpinner } from '@ionic/angular/standalone';
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
import { API_BASE_URL } from '../config/api.config';
import { CoachingService } from '../services/coaching.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.page.html',
  styleUrls: ['./admin.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [IonHeader, IonToolbar, IonButtons, IonContent, IonIcon, IonSpinner, CommonModule, FormsModule, NoNegativeDirective],
})
export class AdminPage implements OnInit {
  private readonly maxProductImageDimension = 1200;
  private readonly productImageQuality = 0.82;
  private readonly maxProductImagePayloadLength = 8_000_000;

  activeTab: 'overview' | 'members' | 'schedule' | 'inventory' | 'equipment' | 'coaches' | 'notifs' | 'attendance' = 'overview';
  private readonly api = this.resolveApiBase();

  private resolveApiBase(): string {
    return API_BASE_URL;
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
  /** Coach account management is admin/super_admin only — backend enforces
   *  this via role:admin,super_admin on /admin/coaches (employees excluded),
   *  so the tab itself is hidden for employees rather than shown-then-403ing. */
  get canManageCoaches(): boolean { return !this.isEmployee; }
  /** Roles the current user is allowed to assign when creating accounts */
  get assignableRoles(): { value: string; label: string }[] {
    if (this.isSuperAdmin) {
      return [
        { value: 'user', label: 'Member (User)' },
        { value: 'employee', label: 'Employee' },
        { value: 'admin', label: 'Admin' },
      ];
    }
    if (this.currentRole === 'admin') {
      return [
        { value: 'user', label: 'Member (User)' },
        { value: 'employee', label: 'Employee' },
      ];
    }
    return [{ value: 'user', label: 'Member (User)' }];
  }

  // ── Confirm Dialog ───────────────────────────────────
  confirmDialog: { show: boolean; label: string; name: string; onConfirm: () => void } = {
    show: false, label: '', name: '', onConfirm: () => {}
  };
  showLogoutDialog = false;

  private askConfirm(label: string, name: string, onConfirm: () => void) {
    this.confirmDialog = { show: true, label, name, onConfirm };
  }

  // ── Overview ────────────────────────────────────────
  totalMembers = 0;
  activeToday = 0;
  lowStockCount = 0;
  pendingOrders = 0;
  expiringMembers: any[] = [];

  // ── Members ─────────────────────────────────────────
  members: any[] = [];
  memberSearch = '';
  memberStatusFilter: 'all' | 'pending' | 'active' = 'all';
  memberTypeFilter: 'all' | 'premium' | 'daily' = 'all';

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

  // ── Equipment ────────────────────────────────────────
  equipment: any[] = [];

  // ── Notifications ────────────────────────────────────
  notifications: any[] = [];
  notifMessage = '';

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

  // ── Coaches ──────────────────────────────────────────
  coaches: any[] = [];
  coachesLoading = false;
  coachesError = false;
  coachSearch = '';
  coachStatusFilter: 'all' | 'active' | 'inactive' = 'all';

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
    private auth: AuthService,
    public router: Router,
    private http: HttpClient,
    private coaching: CoachingService
  ) {}

  // ── Members load state ──────────────────────────────────
  membersLoading = false;
  membersError   = false;

  ngOnInit() {
    this.selectedReportDate = this.toIsoDate(new Date());
  }

  ionViewWillEnter() {
    this.loadAll();
  }

  loadAll() {
    const headers = { Authorization: `Bearer ${this.auth.token}` };

    // Members
    this.membersLoading = true;
    this.membersError   = false;
    this.http.get<any[]>(`${this.api}/users`, { headers }).subscribe({
      next: data => {
        this.membersLoading = false;
        this.members = data.map(m => ({ ...m, initials: this.getInitials(m.username) }));
        this.totalMembers = data.length;
        this.expiringMembers = data
          .filter(m => m.daysLeft !== undefined && m.daysLeft <= 7 && m.daysLeft >= 0)
          .map(m => ({ ...m, initials: this.getInitials(m.username) }));
      },
      error: () => {
        this.membersLoading = false;
        this.membersError   = true;
        this.members = [];
        this.totalMembers = 0;
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
        this.products = data;
        this.lowStockCount = data.filter(p => p.stock < 3).length;
      },
      error: () => this.products = []
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

    // Notifications
    this.http.get<any[]>(`${this.api}/notifications`, { headers }).subscribe({
      next: data => this.notifications = data,
      error: () => this.notifications = []
    });

    // Attendance — pending daily payments
    this.attendancePendingLoading = true;
    this.attendancePendingError   = false;
    this.http.get<any[]>(`${this.api}/attendance/pending`, { headers }).subscribe({
      next: data => {
        this.attendancePendingLoading = false;
        this.attendancePending = data;
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
    return date.toISOString().slice(0, 10);
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
        this.attendanceToday = data;
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
        this.equipmentScanLogs = data;
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
  newSession   = { title: '', date: '', time: '', location: '', coach: '' };
  newProduct   = { name: '', brand: '', price: 0, stock: 0, image_url: '' };
  newEquipment = { name: '', category: '', icon: '', status: 'available', image_url: '', description: '', weight_scale: '' };

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
      description: String(payload?.description || '').trim() || null,
      weight_scale: String(payload?.weight_scale || '').trim() || null,
    };
  }

  toggleAddMember()    { this.showAddMember    = !this.showAddMember;    this.editingMember    = null; }
  toggleAddSession()   { this.showAddSession   = !this.showAddSession;   this.editingSession   = null; }
  toggleAddProduct()   { this.showAddProduct   = !this.showAddProduct;   this.editingProduct   = null; }
  toggleAddEquipment() { this.showAddEquipment = !this.showAddEquipment; this.editingEquipment = null; }
  toggleAddCoach()     { this.showAddCoach     = !this.showAddCoach;     this.editingCoach     = null; this.coachFormMode = 'new'; }

  // ── Members actions ──────────────────────────────────
  openAddMember() { this.toggleAddMember(); }

  editMember(m: any) {
    this.editingMember = { ...m };
    this.showAddMember = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveMember() {
    if (!this.newMember.username || !this.newMember.email || !this.newMember.password) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.post<any>(`${this.api}/users/create`, this.newMember, { headers }).subscribe({
      next: () => {
        this.newMember = { username: '', email: '', password: '', phone: '', gender: '', role: 'user', membership_type: 'premium', payment_method: 'cash' };
        this.showAddMember = false;
        this.loadAll();
      },
      error: (e) => alert(e.error?.message || 'Failed to add member')
    });
  }

  updateMember() {
    if (!this.editingMember) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(`${this.api}/users/${this.editingMember.id}`, this.editingMember, { headers }).subscribe({
      next: () => { this.editingMember = null; this.loadAll(); },
      error: () => alert('Failed to update member')
    });
  }

  deleteMember(m: any) {
    this.askConfirm('Member', m.username, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/users/${m.id}`, { headers }).subscribe({
        next: () => { this.members = this.members.filter(x => x.id !== m.id); this.totalMembers--; },
        error: () => alert('Failed to delete member')
      });
    });
  }

  // ── Schedule actions ─────────────────────────────────
  openAddSession() { this.toggleAddSession(); }

  editSession(s: any) {
    this.editingSession = { ...s };
    this.showAddSession = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  saveSession() {
    if (!this.newSession.title || !this.newSession.date) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.post<any>(`${this.api}/schedule`, this.newSession, { headers }).subscribe({
      next: (s) => {
        this.sessions.unshift(s);
        this.newSession = { title: '', date: '', time: '', location: '', coach: '' };
        this.showAddSession = false;
      },
      error: () => alert('Failed to add session')
    });
  }

  updateSession() {
    if (!this.editingSession) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(`${this.api}/schedule/${this.editingSession.id}`, this.editingSession, { headers }).subscribe({
      next: () => { this.editingSession = null; this.loadAll(); },
      error: () => alert('Failed to update session')
    });
  }

  deleteSession(s: any) {
    this.askConfirm('Session', s.title, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/schedule/${s.id}`, { headers }).subscribe({
        next: () => this.sessions = this.sessions.filter(x => x.id !== s.id),
        error: () => alert('Failed to delete session')
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
        this.newProduct = { name: '', brand: '', price: 0, stock: 0, image_url: '' };
        this.showAddProduct = false;
      },
      error: () => alert('Failed to add product')
    });
  }

  async onProductImageChange(event: Event, target: 'new' | 'edit'): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    try {
      const result = await this.optimizeProductImage(file);

      if (result.length > this.maxProductImagePayloadLength) {
        alert('Image is still too large. Please choose a smaller photo.');
        return;
      }

      if (target === 'new') {
        this.newProduct.image_url = result;
      } else if (this.editingProduct) {
        this.editingProduct.image_url = result;
      }
    } catch {
      alert('Failed to process image');
    } finally {
      (event.target as HTMLInputElement).value = '';
    }
  }

  private optimizeProductImage(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          const { width, height } = this.getResizedDimensions(image.width, image.height);
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          if (!context) {
            reject(new Error('Canvas is not available'));
            return;
          }

          canvas.width = width;
          canvas.height = height;
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', this.productImageQuality));
        };

        image.onerror = () => reject(new Error('Invalid image file'));
        image.src = reader.result as string;
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private getResizedDimensions(width: number, height: number) {
    const maxDimension = this.maxProductImageDimension;

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
      next: () => { this.editingProduct = null; this.loadAll(); },
      error: () => alert('Failed to update product')
    });
  }

  deleteProduct(p: any) {
    this.askConfirm('Product', p.name, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/inventory/products/${p.id}`, { headers }).subscribe({
        next: () => this.products = this.products.filter(x => x.id !== p.id),
        error: () => alert('Failed to delete product')
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
      },
      error: (err) => { group.cancelling = false; alert(err?.error?.message || 'Failed to approve order'); }
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
      },
      error: (err) => { group.cancelling = false; alert(err?.error?.message || 'Failed to reject order'); }
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
      const result = await this.optimizeProductImage(file);
      if (result.length > this.maxProductImagePayloadLength) {
        alert('Image is still too large. Please choose a smaller photo.');
        return;
      }
      if (target === 'new') {
        this.newEquipment.image_url = result;
      } else if (this.editingEquipment) {
        this.editingEquipment.image_url = result;
      }
    } catch {
      alert('Failed to process image');
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
        this.newEquipment = { name: '', category: '', icon: '', status: 'available', image_url: '', description: '', weight_scale: '' };
        this.showAddEquipment = false;
      },
      error: (err) => alert(err?.error?.message || 'Failed to add equipment')
    });
  }

  updateEquipment() {
    if (!this.editingEquipment) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    const payload = this.normalizeEquipmentPayload(this.editingEquipment);

    this.http.put(`${this.api}/equipment/${this.editingEquipment.id}`, payload, { headers }).subscribe({
      next: () => { this.editingEquipment = null; this.loadAll(); },
      error: (err) => alert(err?.error?.message || 'Failed to update equipment')
    });
  }

  deleteEquipment(e: any) {
    this.askConfirm('Equipment', e.name, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/equipment/${e.id}`, { headers }).subscribe({
        next: () => this.equipment = this.equipment.filter(x => x.id !== e.id),
        error: () => alert('Failed to delete equipment')
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
        alert('Image is still too large. Please choose a smaller photo.');
        return;
      }

      if (target === 'new') {
        this.newCoach.photo_url = result;
      } else if (this.editingCoach) {
        this.editingCoach.photo_url = result;
      }
    } catch {
      alert('Failed to process image');
    } finally {
      (event.target as HTMLInputElement).value = '';
    }
  }

  saveCoach() {
    const isPromote = this.coachFormMode === 'promote';

    if (isPromote && !this.newCoach.user_id) {
      alert('Please select a member to promote.');
      return;
    }
    if (!isPromote && (!this.newCoach.username || !this.newCoach.email || !this.newCoach.password)) {
      alert('Username, email and password are required for a new coach account.');
      return;
    }
    if (!isPromote && (!this.newCoach.first_name.trim() || !this.newCoach.last_name.trim())) {
      alert('First name and last name are required for a new coach account.');
      return;
    }

    const rate = Number(this.newCoach.rate) || 0;
    if (rate < 0) {
      alert('Rate cannot be negative.');
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
        this.loadCoaches();
      },
      error: (e) => alert(e?.error?.message || 'Failed to create coach')
    });
  }

  updateCoach() {
    if (!this.editingCoach) return;

    const rate = Number(this.editingCoach.rate) || 0;
    if (rate < 0) {
      alert('Rate cannot be negative.');
      return;
    }

    const payload = {
      bio: this.editingCoach.bio,
      specialty: this.editingCoach.specialty,
      photo_url: this.editingCoach.photo_url,
      rate,
    };

    this.coaching.updateAdminCoach(this.editingCoach.user_id, payload).subscribe({
      next: () => { this.editingCoach = null; this.loadCoaches(); },
      error: (e) => alert(e?.error?.message || 'Failed to update coach')
    });
  }

  // Soft-deactivate (backend never hard-deletes coach_profiles — see
  // AdminCoachController::destroy). Reversible via reactivateCoach(), so
  // this uses a plain confirm() rather than the destructive confirmDialog
  // component, whose copy ("This action cannot be undone") would be wrong here.
  deactivateCoach(c: any) {
    const ok = confirm(`Deactivate ${c.username} as a coach? Their profile is kept and can be reactivated later.`);
    if (!ok) return;

    this.coaching.deleteAdminCoach(c.user_id).subscribe({
      next: () => {
        const idx = this.coaches.findIndex(x => x.user_id === c.user_id);
        if (idx !== -1) this.coaches[idx].is_active = false;
      },
      error: (e) => alert(e?.error?.message || 'Failed to deactivate coach')
    });
  }

  reactivateCoach(c: any) {
    this.coaching.updateAdminCoach(c.user_id, { is_active: true }).subscribe({
      next: () => {
        const idx = this.coaches.findIndex(x => x.user_id === c.user_id);
        if (idx !== -1) this.coaches[idx].is_active = true;
      },
      error: (e) => alert(e?.error?.message || 'Failed to reactivate coach')
    });
  }

  // ── Notifications actions ─────────────────────────────
  sendNotification() {
    if (!this.notifMessage.trim()) return;
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.post(`${this.api}/notifications`, { message: this.notifMessage }, { headers }).subscribe({
      next: () => {
        this.notifications.unshift({ message: this.notifMessage, is_read: false, created_at: 'Just now' });
        this.notifMessage = '';
      },
      error: () => alert('Failed to send notification')
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
      },
      error: () => alert('Failed to confirm check-in')
    });
  }

  rejectCheckin(a: any) {
    const headers = { Authorization: `Bearer ${this.auth.token}` };
    this.http.put(`${this.api}/attendance/${a.id}/reject`, {}, { headers }).subscribe({
      next: () => {
        this.attendancePending = this.attendancePending.filter(x => x.id !== a.id);
        this.attendanceToday   = this.attendanceToday.filter(x => x.id !== a.id);
      },
      error: () => alert('Failed to reject check-in')
    });
  }

  // ── Membership activation ─────────────────────────────
  openMembershipEdit(m: any) {
    this.editingMembershipFor = m;
    this.membershipForm = {
      membership_type: m.membership_type || 'premium',
      membership_expiry: m.membership_expiry
        ? new Date(m.membership_expiry).toISOString().split('T')[0]
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
      },
      error: () => alert('Failed to update membership')
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
      },
      error: () => alert('Failed to approve member')
    });
  }

  declineMember(m: any) {
    this.askConfirm('Decline & Remove', m.username, () => {
      const headers = { Authorization: `Bearer ${this.auth.token}` };
      this.http.delete(`${this.api}/users/${m.id}`, { headers }).subscribe({
        next: () => { this.members = this.members.filter(x => x.id !== m.id); this.totalMembers--; },
        error: () => alert('Failed to decline member')
      });
    });
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
    this.router.navigate(['/login']);
  }
}