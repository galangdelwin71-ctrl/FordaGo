// equipment.page.ts

import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonFooter,
  IonIcon,
  IonSpinner,
} from '@ionic/angular/standalone';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { HeaderComponent } from '../shared/header/header.component';
import { NotificationPanelComponent } from '../shared/notification-panel/notification-panel.component';
import { CoachingPanelComponent } from '../shared/coaching-panel/coaching-panel.component';
import { API_BASE_URL } from '../config/api.config';

export type EquipmentCategory = 'All' | 'Strength' | 'Cardio' | 'Machines' | 'Free Weights' | string;

export interface EquipmentItem {
  id: number;
  name: string;
  icon?: string;
  category?: EquipmentCategory;
  status?: string;
  image_url?: string;
  description?: string;
  weight_scale?: string;
}

@Component({
  selector: 'app-equipment',
  templateUrl: './equipment.page.html',
  styleUrls: ['./equipment.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonFooter,
    IonIcon,
    IonSpinner,
    HeaderComponent,
    NotificationPanelComponent,
    CoachingPanelComponent,
  ],
})
export class EquipmentPage implements OnInit {

  // ── Search & Filter ──────────────────────────────────
  searchQuery    = '';
  activeCategory: EquipmentCategory = 'All';

  categories: EquipmentCategory[] = ['All', 'Strength', 'Cardio', 'Machines', 'Free Weights'];

  // ── Equipment List ───────────────────────────────────
  equipmentList: EquipmentItem[] = [];

  // ── Modal ─────────────────────────────────────────────
  modalOpen    = false;
  selectedItem: EquipmentItem | null = null;
  isLoading    = false;
  errorMsg     = '';

  private readonly api = API_BASE_URL;

  constructor(public router: Router, private http: HttpClient, private auth: AuthService) {}

  // ── Header avatar ─────────────────────────────────────
  initials     = '';
  profileImage = '';

  // ── Notifications ─────────────────────────────────────
  notifPanelOpen = false;
  unreadCount = 0;

  openNotifPanel(): void {
    this.notifPanelOpen = true;
  }

  closeNotifPanel(): void { this.notifPanelOpen = false; }

  onUnreadCountChange(count: number): void {
    this.unreadCount = count;
  }

  // ── Coaching screen ────────────────────────────────────────
  // In-flow replacement for ion-content (see equipment.page.html) rather
  // than an overlay -- header and footer are untouched siblings either way.
  coachingPanelOpen = false;

  onCoachingClick(): void {
    this.coachingPanelOpen = !this.coachingPanelOpen;
  }

  closeCoachingPanel(): void {
    this.coachingPanelOpen = false;
  }

  ngOnInit(): void {
    this.loadEquipment();
  }

  ionViewWillEnter(): void {
    this.loadEquipment();
    const user = this.auth.user;
    const name = String(user?.username || '').trim();
    this.initials = name
      ? name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2)
      : 'U';
    this.profileImage = String(user?.profile_image || '').trim();
    this.notifPanelOpen = false;
  }

  loadEquipment() {
    const token = this.auth.token;
    if (!token) { this.router.navigate(['/login']); return; }
    this.isLoading = true;
    this.errorMsg  = '';
    this.http.get<EquipmentItem[]>(`${this.api}/equipment`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.equipmentList = data;
        this.isLoading = false;
        // build dynamic categories from data
        const cats = Array.from(new Set(data.map(e => e.category).filter(Boolean))) as string[];
        this.categories = ['All', ...cats];
      },
      error: () => {
        this.isLoading = false;
        this.errorMsg  = 'Could not load equipment. Please try again.';
        this.equipmentList = [];
      }
    });
  }

  // ── Filtering ─────────────────────────────────────────
  get filteredEquipment(): EquipmentItem[] {
    return this.equipmentList.filter(item => {
      const matchesCategory =
        this.activeCategory === 'All' || item.category === this.activeCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }

  setCategory(cat: EquipmentCategory): void {
    this.activeCategory = cat;
  }

  // ── Modal ─────────────────────────────────────────────
  openModal(item: EquipmentItem): void {
    this.selectedItem = item;
    this.modalOpen    = true;
  }

  closeModal(): void {
    this.modalOpen    = false;
    this.selectedItem = null;
  }

  // ── User Info ─────────────────────────────────────────
  get userInitials(): string {
    const u = this.auth.user;
    if (!u) return '';
    const name: string = u.username || u.first_name || u.email || '';
    return name.slice(0, 2).toUpperCase();
  }

  // ── Navigation ────────────────────────────────────────
  private closeOverlaysForNavigation(): void { this.notifPanelOpen = false; this.coachingPanelOpen = false; }

  goBack(): void        { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard']); }
  goToDashboard(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/dashboard']); }
  goToSchedule(): void  { this.closeOverlaysForNavigation(); this.router.navigate(['/schedule']); }
  goToQr(): void        { this.closeOverlaysForNavigation(); this.router.navigate(['/qr-scanner']); }
  goToInventory(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/inventory']); }
  goToEquipment(): void { this.closeOverlaysForNavigation(); this.router.navigate(['/equipment']); }
  goToProfile(): void   { this.closeOverlaysForNavigation(); this.router.navigate(['/profile']); }
}