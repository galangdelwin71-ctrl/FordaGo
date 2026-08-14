import { inject } from '@angular/core';
import { Routes, CanActivateFn, Router } from '@angular/router';

// Guard: allow admin, super_admin, and employee into the admin panel
const adminGuard: CanActivateFn = () => {
  const user = localStorage.getItem('user');
  if (!user) return false;
  try {
    const parsed = JSON.parse(user);
    return ['admin', 'super_admin', 'employee'].includes(parsed.role);
  } catch {
    return false;
  }
};

// Guard (Stage 5): blocks unauthenticated access to member-facing pages by
// checking for a stored token, redirecting to /login when absent. Paired
// with guestGuard below (on the login route itself) so a logged-in member
// can never be routed back to /login, which is what let the hardware back
// button repeatedly bounce a logged-in user to the login screen.
const authGuard: CanActivateFn = () => {
  const token = localStorage.getItem('token');
  if (token) return true;

  const router = inject(Router);
  router.navigate(['/login']);
  return false;
};

// Guard (Stage 5): the inverse of authGuard — if someone is already
// logged in (valid token present), keep them off /login entirely and send
// them to the page that matches their role: /admin for admin/super_admin/
// employee, /dashboard for regular members. This is what makes it safe for
// the back button handler in app.component.ts to fall back to plain
// browser history navigation: even if that history happens to contain a
// stale /login entry, landing on it while logged in just bounces straight
// back out to the CORRECT side of the app — not always the member
// dashboard, which would be wrong for a logged-in admin/staff account.
const guestGuard: CanActivateFn = () => {
  const token = localStorage.getItem('token');
  if (!token) return true;

  const router = inject(Router);

  let destination = '/dashboard';
  try {
    const rawUser = localStorage.getItem('user');
    const parsedUser = rawUser ? JSON.parse(rawUser) : null;
    if (['admin', 'super_admin', 'employee'].includes(parsedUser?.role)) {
      destination = '/admin';
    }
  } catch {
    // Malformed 'user' entry — fall back to the member dashboard rather
    // than block navigation entirely.
  }

  router.navigate([destination]);
  return false;
};

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.page').then(m => m.LoginPage),
    canActivate: [guestGuard],
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./dashboard/dashboard.page').then(m => m.DashboardPage),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () => import('./admin/admin.page').then(m => m.AdminPage),
    canActivate: [adminGuard],
  },
  {
    path: 'qr-scanner',
    loadComponent: () => import('./qr-scanner/qr-scanner.page').then( m => m.QrScannerPage),
    canActivate: [authGuard],
  },
  {
    path: 'schedule',
    loadComponent: () => import('./schedule/schedule.page').then( m => m.SchedulePage),
    canActivate: [authGuard],
  },
  {
    path: 'equipment',
    loadComponent: () => import('./equipment/equipment.page').then( m => m.EquipmentPage),
    canActivate: [authGuard],
  },
  {
    path: 'inventory',
    loadComponent: () => import('./inventory/inventory.page').then( m => m.InventoryPage),
    canActivate: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then( m => m.ProfilePage),
    canActivate: [authGuard],
  },
  {
    path: 'transactions',
    loadComponent: () => import('./transactions/transactions.page').then(m => m.TransactionsPage),
    canActivate: [authGuard],
  },
  {
    path: 'admin-reports',
    loadComponent: () => import('./admin-reports/admin-reports.page').then(m => m.AdminReportsPage),
    canActivate: [adminGuard],
  },
];
