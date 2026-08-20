import { Injectable, NgZone } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL, REVERB_TUNNEL_URL } from '../config/api.config';

(window as any).Pusher = Pusher;

@Injectable({ providedIn: 'root' })
export class EchoService {
  private echo: Echo<any> | null = null;

  constructor(private zone: NgZone) {
    this.initEcho();
  }

  /**
   * Initializes or re-initializes Laravel Echo instance.
   *
   * wsHost/wsPort/forceTLS are derived from REVERB_TUNNEL_URL, NOT from
   * API_BASE_URL -- the API (Laravel, port 8000) and Reverb (WebSocket,
   * port 8080 -- see backend/.env REVERB_SERVER_PORT) are two separate
   * local processes exposed through two separate tunnels. Deriving the WS
   * host/port from API_BASE_URL, as this used to do, silently pointed
   * Pusher at the API tunnel instead: it "worked" in the sense that a
   * hostname/port came out, but that endpoint only ever served the
   * Laravel app, not Reverb, so every connection attempt 404'd on
   * `/app/{REVERB_APP_KEY}` and retried forever.
   */
  public initEcho(): Echo<any> | null {
    const token = localStorage.getItem('token');

    // Extract host & scheme from REVERB_TUNNEL_URL, falling back to local
    // Reverb defaults (see backend/.env: REVERB_HOST=localhost,
    // REVERB_PORT=8080, REVERB_SCHEME=http) when running fully local with
    // no tunnel at all.
    let wsHost = 'localhost';
    let wsPort = 8080;
    let forceTLS = false;

    try {
      const url = new URL(REVERB_TUNNEL_URL);
      if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        wsHost = url.hostname;
        // Tunnel providers (InstaTunnel, ngrok, etc.) terminate TLS at
        // their own edge and forward plain WS internally, so the PUBLIC
        // port the browser connects to is always the standard HTTPS port
        // 443 -- never the raw REVERB_SERVER_PORT (8080), which only
        // exists on localhost behind the tunnel.
        wsPort = url.protocol === 'https:' ? 443 : 80;
        forceTLS = url.protocol === 'https:';
      } else if (url.port) {
        wsPort = Number(url.port);
      }
    } catch {
      // Malformed/placeholder REVERB_TUNNEL_URL -- fall back to local
      // localhost:8080 rather than throw, so dev without a tunnel still works.
    }

    try {
      // Pusher-js's connection/reconnect/heartbeat timers must NOT run
      // inside Angular's zone: each tick (including failed-connection
      // retries, which happen continuously if the WS endpoint is
      // unreachable -- e.g. the ngrok tunnel only forwarding to the HTTP
      // API and not the Reverb server on REVERB_PORT) otherwise triggers a
      // full app-wide change-detection pass. On a slow connection those
      // retries fire back-to-back, so change detection never gets a chance
      // to finish -- from the user's perspective the whole UI freezes and
      // stops responding to touch, most noticeably right as you navigate
      // away from a screen that just opened a channel (ChatPage). Any
      // Echo/Pusher callback that DOES need to update component state must
      // explicitly re-enter the zone itself with NgZone.run() -- see
      // ChatPage.setupEchoListener().
      this.zone.runOutsideAngular(() => {
        this.echo = new Echo({
          broadcaster: 'reverb',
          key: 'vii4ztpeqxttvr8p001g', // matches REVERB_APP_KEY in .env
          wsHost: wsHost,
          wsPort: wsPort,
          wssPort: wsPort,
          forceTLS: forceTLS,
          enabledTransports: ['ws', 'wss'],
          authEndpoint: `${API_BASE_URL}/broadcasting/auth`,
          auth: {
            headers: {
              Authorization: token ? `Bearer ${token}` : '',
              Accept: 'application/json',
            },
          },
        });
      });

      return this.echo;
    } catch (err) {
      console.warn('Echo initialization error:', err);
      return null;
    }
  }

  /**
   * Get the active Echo instance.
   */
  public getEcho(): Echo<any> | null {
    if (!this.echo) {
      return this.initEcho();
    }
    return this.echo;
  }

  /**
   * Listen on a private channel.
   */
  public privateChannel(channelName: string) {
    const echo = this.getEcho();
    if (!echo) return null;
    return echo.private(channelName);
  }

  /**
   * Leave a channel when leaving a view/chat.
   */
  public leaveChannel(channelName: string) {
    if (this.echo) {
      this.echo.leave(channelName);
    }
  }

  /**
   * Disconnect websocket on logout.
   */
  public disconnect() {
    if (this.echo) {
      this.echo.disconnect();
      this.echo = null;
    }
  }
}
