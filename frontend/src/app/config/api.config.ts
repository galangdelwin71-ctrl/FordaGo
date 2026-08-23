/**
 * MODE: Direct Local Wi-Fi (LAN Mode) - NO TUNNEL, 0ms LATENCY!
 *
 * Connects directly to your computer's local Wi-Fi IP address.
 * Works seamlessly on BOTH PC browser and mobile phone on the same Wi-Fi.
 *
 * Current Local Wi-Fi IP: 192.168.1.21
 * - Laravel API: http://192.168.1.21:8000
 * - Reverb WebSocket: http://192.168.1.21:8080
 */
function getDetectedHost(): string {
  // If running inside native Android / Capacitor APK, always use PC's Wi-Fi IP
  if (typeof window !== 'undefined' && ((window as any).Capacitor?.isNativePlatform?.() || window.location?.protocol === 'capacitor:')) {
    return '192.168.1.16';
  }
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    if (host && host !== '' && host !== 'localhost' && host !== '127.0.0.1' && host !== 'capacitor') {
      return host;
    }
  }
  return '192.168.1.16';
}

export const LOCAL_IP = getDetectedHost();

// Direct Wi-Fi / Localhost Mode (Automatically matches your current device or LAN IP)
export const API_BASE_URL = `http://${LOCAL_IP}:8000`;

// REST API Base URL
export const API_URL = `${API_BASE_URL}/api`;

// Direct Reverb WebSocket URL (0ms real-time chat)
export const REVERB_TUNNEL_URL = `http://${LOCAL_IP}:8080`;

/**
 * Official Facebook Page / Messenger URL for AFFORDA Gym / FordaGO feedback and inquiries.
 * Clicking "Message on Facebook" opens this URL in the browser / native Facebook app.
 */
export const FACEBOOK_PAGE_URL = 'https://www.facebook.com/';