import { Injectable, NgZone } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL, REVERB_TUNNEL_URL } from '../config/api.config';

(window as any).Pusher = Pusher;
(Pusher as any).logToConsole = true;

@Injectable({ providedIn: 'root' })
export class EchoService {
  private echo: Echo<any> | null = null;
  /** Token that was used when the current echo instance was created. */
  private echoToken: string | null = null;

  constructor(private zone: NgZone) {
    this.initEcho();
  }

  /**
   * Initializes or re-initializes Laravel Echo instance.
   */
  public initEcho(): Echo<any> | null {
    const token = localStorage.getItem('token');
    this.echoToken = token;

    let wsHost = 'localhost';
    let wsPort = 8080;
    let forceTLS = false;

    try {
      const url = new URL(REVERB_TUNNEL_URL);
      wsHost = url.hostname;
      if (url.port) {
        wsPort = Number(url.port);
        forceTLS = url.protocol === 'https:' || url.protocol === 'wss:';
      } else if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        wsPort = url.protocol === 'https:' ? 443 : 80;
        forceTLS = url.protocol === 'https:';
      } else {
        wsPort = 8080;
        forceTLS = false;
      }
    } catch {
      // Malformed/placeholder REVERB_TUNNEL_URL fallback
    }

    try {
      this.zone.runOutsideAngular(() => {
        if (this.echo) {
          try { this.echo.disconnect(); } catch { /* ignore */ }
        }
        this.echo = new Echo({
          broadcaster: 'reverb',
          key: 'vii4ztpeqxttvr8p001g',
          wsHost: wsHost,
          wsPort: wsPort,
          wssPort: wsPort,
          forceTLS: forceTLS,
          enabledTransports: ['ws', 'wss'],
          authorizer: (channel: any, _options: any) => {
            return {
              authorize: (socketId: string, callback: Function) => {
                const currentToken = localStorage.getItem('token');
                fetch(`${API_BASE_URL}/broadcasting/auth`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': currentToken ? `Bearer ${currentToken}` : '',
                  },
                  body: JSON.stringify({
                    socket_id: socketId,
                    channel_name: channel.name,
                  }),
                })
                  .then((res) => {
                    if (!res.ok) throw new Error(`Auth status ${res.status}`);
                    return res.json();
                  })
                  .then((data) => callback(null, data))
                  .catch((err) => {
                    console.error('[Echo] Channel Auth Error:', err);
                    callback(err, null);
                  });
              },
            };
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
   * Re-initialize Echo if the stored token has changed (e.g. after login).
   * Called before every channel subscription so the WebSocket is always
   * authenticated with the freshest credentials.
   */
  private reinitIfTokenChanged(): void {
    const currentToken = localStorage.getItem('token');
    if (currentToken !== this.echoToken) {
      this.initEcho();
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
   * Always checks whether the token changed since last init so that
   * subscriptions after login always use an authenticated connection.
   */
  public privateChannel(channelName: string) {
    this.reinitIfTokenChanged();
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
      this.echoToken = null;
    }
  }
}
