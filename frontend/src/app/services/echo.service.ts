import { Injectable } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { API_BASE_URL } from '../config/api.config';

(window as any).Pusher = Pusher;

@Injectable({ providedIn: 'root' })
export class EchoService {
  private echo: Echo<any> | null = null;

  constructor() {
    this.initEcho();
  }

  /**
   * Initializes or re-initializes Laravel Echo instance.
   */
  public initEcho(): Echo<any> | null {
    const token = localStorage.getItem('token');

    // Extract host & scheme from API_BASE_URL or fallback to localhost
    let wsHost = 'localhost';
    let wsPort = 8080;
    let forceTLS = false;

    try {
      const url = new URL(API_BASE_URL);
      // If using ngrok or custom domain, port 443 / 80 or 8080
      if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
        wsHost = url.hostname;
        wsPort = url.protocol === 'https:' ? 443 : 80;
        forceTLS = url.protocol === 'https:';
      }
    } catch {
      // default localhost:8080
    }

    try {
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
