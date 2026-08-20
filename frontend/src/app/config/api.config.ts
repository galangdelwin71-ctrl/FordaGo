/**
 * FordaGO API configuration.
 *
 * Points to the Laravel backend (php artisan serve default: 127.0.0.1:8000).
 * Production: use the public HTTPS API URL.
 *
 * Currently tunneled via Cloudflare Tunnel (cloudflared) quick-tunnel mode.
 * These are account-less "quick tunnels" -- Cloudflare assigns a NEW
 * random *.trycloudflare.com subdomain every time the tunnel command is
 * restarted, so this URL must be updated here after every restart. If
 * you ever need to restart the tunnel:
 *   cloudflared tunnel --url http://localhost:8000
 * then copy the fresh URL cloudflared prints and paste it below.
 *
 * (Previously InstaTunnel -- migrated because Cloudflare's free quick
 * tunnels don't expire/require a persistent paid session, and route
 * through Cloudflare's much larger edge network, which measured faster
 * from this project's location. See backend/config/cors.php: Cloudflare's
 * quick tunnel is a transparent proxy and does NOT inject its own CORS
 * headers the way InstaTunnel did, so Laravel now sets them itself.)
 */
export const API_BASE_URL =
  'https://assumption-regulated-brands-landing.trycloudflare.com';

/**
 * REST API base -- API_BASE_URL + the 'api' prefix Laravel auto-applies to
 * every route in routes/api.php (see backend/bootstrap/app.php's
 * withRouting(api: ...), which defaults apiPrefix to 'api'). Every
 * HttpClient call in this app (auth, inventory, schedule, coaching,
 * profile, workout-sessions, admin, reports, etc.) must go through
 * API_URL, NOT API_BASE_URL directly -- calling API_BASE_URL alone hits a
 * path with no matching Laravel route, which also falls outside
 * backend/config/cors.php's `paths => ['api/*', ...]` allowlist, so the
 * browser blocks the response as a CORS error before Angular ever sees a
 * real status code (this is what silently broke login: auth.service.ts
 * used to build `${API_BASE_URL}/auth/login`, missing /api).
 *
 * EchoService is the one deliberate exception: `/broadcasting/auth` is
 * registered directly by Broadcast::routes() OUTSIDE the api() group, so
 * it correctly uses bare API_BASE_URL, not API_URL -- see echo.service.ts.
 */
export const API_URL = `${API_BASE_URL}/api`;

/**
 * Public tunnel URL pointed at the Reverb WebSocket server
 * (REVERB_SERVER_PORT, default 8080 -- see backend/.env). Deliberately a
 * SEPARATE constant from API_BASE_URL: the Laravel API (port 8000) and
 * Reverb (port 8080) are two different local processes, so they need two
 * different tunnels even when both happen to use the same tunnel
 * provider/account. EchoService reads this directly instead of guessing a
 * wsHost/wsPort from API_BASE_URL -- that guesswork only ever worked by
 * accident when both concerns shared a single ngrok domain that happened
 * to route to the wrong port, which is exactly what caused the
 * `/app/{key} 404` WebSocket failures (see echo.service.ts).
 *
 * Currently tunneled via Cloudflare Tunnel (cloudflared) quick-tunnel
 * mode -- same caveat as API_BASE_URL above: this URL changes every time
 * the tunnel is restarted. If you ever need to restart the tunnel:
 *   cloudflared tunnel --url http://localhost:8080
 * then copy the fresh URL cloudflared prints and paste it below.
 */
export const REVERB_TUNNEL_URL =
  'https://mills-nirvana-formal-cases.trycloudflare.com';