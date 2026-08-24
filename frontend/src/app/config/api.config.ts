/**
 * Smart API URL Detection
 *
 * - Browser (container / production): Uses current window origin (Nginx gateway handles routing)
 * - Native Android APK (Capacitor): Uses the configured LAN/Server IP directly
 *
 * Container layout (via Nginx gateway):
 *   - Frontend SPA:  http://<host>:<port>/
 *   - Laravel API:   http://<host>:<port>/api/
 *   - Reverb WS:     http://<host>:<port>/app/
 */

/** LAN IP used when running as a native Capacitor APK */
const NATIVE_LAN_IP = '192.168.1.16';
const NATIVE_PORT   = 8000;

/** Podman machine IP on Windows WSL2 */
const PODMAN_HOST_IP = '172.24.30.57';

function getDetectedHost(): string {
  if (typeof window !== 'undefined' && ((window as any).Capacitor?.isNativePlatform?.() || window.location?.protocol === 'capacitor:')) {
    return PODMAN_HOST_IP;
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host && host !== '' && host !== 'capacitor') {
      return host;
    }
  }
  return 'localhost';
}

export const LOCAL_IP = getDetectedHost();

// Backend Laravel API container is exposed on port 8000
export const API_BASE_URL = `http://${LOCAL_IP}:8000`;

// REST API Base URL
export const API_URL = `${API_BASE_URL}/api`;

// Reverb WebSocket container is exposed on port 8080
export const REVERB_TUNNEL_URL = `http://${LOCAL_IP}:8080`;

/**
 * Official Facebook Page / Messenger URL for AFFORDA Gym / FordaGO feedback and inquiries.
 */
export const FACEBOOK_PAGE_URL = 'https://www.facebook.com/';