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
export const NATIVE_SERVER_HOST = '168.144.141.27';
export const NATIVE_SERVER_PROTOCOL = 'http'; // 'http' or 'https'
export const NATIVE_SERVER_PORT = '8000'; // port 8000 on VPS
export const REVERB_SERVER_PORT = '8080'; // port 8080 on VPS

/**
 * WSL/Podman backend host for local development.
 */
export const WSL_BACKEND_HOST = '168.144.141.27';

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
      return `http://${NATIVE_SERVER_HOST}:${NATIVE_SERVER_PORT}`;
    }
    // Production web: If accessed via VPS IP or Domain directly
    if (loc.port === '' || loc.port === '80' || loc.port === '443') {
      return loc.origin;
    }
    return `http://${loc.hostname}:${NATIVE_SERVER_PORT}`;
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
      return `http://${NATIVE_SERVER_HOST}:${REVERB_SERVER_PORT}`;
    }
    // Production web: Reverb routes through Nginx gateway or origin port
    if (loc.port === '' || loc.port === '80' || loc.port === '443') {
      return loc.origin;
    }
    return `http://${loc.hostname}:${REVERB_SERVER_PORT}`;
  }

  // Capacitor Native APK Fallback
  const portSuffix = REVERB_SERVER_PORT ? `:${REVERB_SERVER_PORT}` : '';
  return `${NATIVE_SERVER_PROTOCOL}://${NATIVE_SERVER_HOST}${portSuffix}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const API_URL = `${API_BASE_URL}/api`;
export const REVERB_TUNNEL_URL = resolveReverbUrl();
export const LOCAL_IP = typeof window !== 'undefined' && window.location?.hostname ? window.location.hostname : NATIVE_SERVER_HOST;

/**
 * Resolves a backend avatar/storage URL that may be stored as a relative
 * /storage/... path to the correct absolute URL for the current runtime.
 *
 * - base64 data URIs are returned as-is
 * - full http/https URLs are returned as-is
 * - relative /storage/... paths are prepended with API_BASE_URL
 */
export function resolveImageUrl(path: string | null | undefined): string {
  if (!path || path.trim() === '') return '';
  const p = path.trim();
  if (p.startsWith('data:') || p.startsWith('http://') || p.startsWith('https://')) {
    return p;
  }
  // Relative storage path — prefix with backend base URL
  return `${API_BASE_URL}${p.startsWith('/') ? '' : '/'}${p}`;
}

/**
 * Official Facebook Page / Messenger URL for AFFORDA Gym / FordaGO feedback and inquiries.
 */
export const FACEBOOK_PAGE_URL = 'https://www.facebook.com/';