/**
 * Smart API & WebSocket URL Detection
 *
 * - Browser (VPS / Cloud / Production / Domain):
 *     Automatically uses the current window origin (protocol + host + port),
 *     allowing Nginx reverse-proxy or gateway to route /api and WebSockets seamlessly.
 *     No mixed-content security errors on HTTPS and no firewall issues on non-standard ports.
 * - Local Development (Browser on port 4200 / 8100):
 *     Falls back to http://localhost:8000 (API) and http://localhost:8080 (Reverb).
 * - Native Android / iOS APK (Capacitor):
 *     Uses the configured production server host/domain without relying on obsolete local LAN subnets.
 */

/**
 * Configurable target host for Native Capacitor APK builds.
 * For production mobile APK release, point this to your VPS Domain or Public IP (e.g., 'gym.yourdomain.com' or '203.0.113.5').
 */
export const NATIVE_SERVER_HOST = '192.168.1.10';
export const NATIVE_SERVER_PROTOCOL = 'http'; // 'http' or 'https'
export const NATIVE_SERVER_PORT = '8000'; // LAN Wi-Fi build — port 8000 (php artisan serve)

/**
 * WSL/Podman backend host for local development.
 * Auto-patched by start-auto.ps1 on each launch. Do NOT edit manually.
 * When using Podman on Windows, containers run inside WSL so localhost does not
 * forward to them — we must use the WSL virtual ethernet IP instead.
 */
export const WSL_BACKEND_HOST = '172.24.30.57'; // AUTO-PATCHED BY start-auto.ps1

function isNativePlatform(): boolean {
  return typeof window !== 'undefined' && (
    Boolean((window as any).Capacitor?.isNativePlatform?.()) ||
    window.location?.protocol === 'capacitor:' ||
    window.location?.protocol === 'ionic:'
  );
}

function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined' && !isNativePlatform() && window.location) {
    const loc = window.location;
    // Local Angular / Ionic dev servers (localhost / 127.0.0.1 on any port like 4200, 8100, 8101)
    if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
      return `http://${WSL_BACKEND_HOST}:8000`;
    }
    // Production web: Use the origin directly (e.g. http://YOUR_VPS_IP or https://yourdomain.com)
    return loc.origin;
  }

  // Capacitor Native APK Fallback
  const portSuffix = NATIVE_SERVER_PORT ? `:${NATIVE_SERVER_PORT}` : '';
  return `${NATIVE_SERVER_PROTOCOL}://${NATIVE_SERVER_HOST}${portSuffix}`;
}

function resolveReverbUrl(): string {
  if (typeof window !== 'undefined' && !isNativePlatform() && window.location) {
    const loc = window.location;
    // Local dev server fallback
    if (loc.hostname === 'localhost' || loc.hostname === '127.0.0.1') {
      return `http://${WSL_BACKEND_HOST}:8080`;
    }
    // Production web: Reverb routes through Nginx gateway or origin
    return loc.origin;
  }

  // Capacitor Native APK Fallback
  const portSuffix = NATIVE_SERVER_PORT ? `:${NATIVE_SERVER_PORT}` : '';
  return `${NATIVE_SERVER_PROTOCOL}://${NATIVE_SERVER_HOST}${portSuffix}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
export const REVERB_TUNNEL_URL = resolveReverbUrl();
export const LOCAL_IP = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : NATIVE_SERVER_HOST;

/**
 * Official Facebook Page / Messenger URL for AFFORDA Gym / FordaGO feedback and inquiries.
 */
export const FACEBOOK_PAGE_URL = 'https://www.facebook.com/';