// header.component.ts
//
// Single source of truth for the FordaGO app header (logo, page subtitle,
// equipment shortcut, notification bell, profile avatar).
//
// WHY THIS EXISTS:
// Previously every page (dashboard, qr-scanner, schedule, inventory,
// profile) copy-pasted the same <ion-header> markup AND duplicated its CSS
// in each page's own .scss file. Those stylesheets drifted independently
// over time (different icon button sizes, different logo badge treatment,
// different avatar sizes/gradients), so the header visibly resized and
// reshaped every time the user navigated between pages. Routing to a new
// page in Angular destroys/recreates the page component, so each page's
// own (inconsistent) header CSS took over on every navigation.
//
// Extracting one <app-header> component with one canonical stylesheet
// guarantees the header renders identically everywhere, and it removes the
// duplicated markup/CSS from five separate files.
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonIcon],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  /** Small uppercase label under "FordaGO", e.g. "QR SCANNER", "SCHEDULE". */
  @Input() subtitle = '';

  /** Number of unread notifications. Badge + highlighted bell state show when > 0. */
  @Input() unreadCount = 0;

  /**
   * Combined count of unread coaching activity (unread chat messages
   * across all conversations, plus pending client requests for a coach
   * account) fed in by the host page -- see DashboardPage.coachUnreadCount.
   * Badge + highlighted coach-icon state show when > 0, same treatment as
   * the notification bell above.
   */
  @Input() coachUnreadCount = 0;

  /** Member's saved profile photo URL (base64 data URL or remote URL). */
  @Input() profileImage = '';

  /** Fallback initials shown in the avatar circle when there is no photo. */
  @Input() initials = 'U';

  @Output() coachingClick = new EventEmitter<void>();
  @Output() equipmentClick = new EventEmitter<void>();
  @Output() notifClick = new EventEmitter<void>();
  @Output() profileClick = new EventEmitter<void>();
}
