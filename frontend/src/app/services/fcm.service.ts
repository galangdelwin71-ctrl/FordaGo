import { Injectable, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { AuthService } from './auth.service';
import { API_URL } from '../config/api.config';

/**
 * Handles Firebase Cloud Messaging (FCM) token registration and
 * incoming push notification routing for native Android.
 *
 * Flow:
 *  1. After login → registerFcmToken() → gets token from Firebase SDK
 *     → sends PUT /api/users/fcm-token to backend.
 *  2. When app is foregrounded while a push arrives → notificationReceived fires.
 *  3. When user taps a background/closed push notification → notificationActionPerformed fires
 *     → routes directly to the correct page (e.g. /chat/:id).
 *
 * NOTE: Requires google-services.json placed in android/app/.
 * Get it from Firebase Console → Project Settings → General → Your Apps.
 */
@Injectable({ providedIn: 'root' })
export class FcmService {
  private readonly api = API_URL;
  private actionListenerRegistered = false;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
    private zone: NgZone,
  ) {}

  /**
   * Initializes FCM listeners (tap handler) and registers token if logged in.
   */
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    await this.registerNotificationActionListener();

    if (this.auth.token) {
      await this.registerFcmToken();
    }
  }

  /**
   * Called once after login succeeds.
   * Requests FCM permission, gets the device token, and registers it
   * with the backend so the server can send push notifications to this device.
   */
  async registerFcmToken(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return; // FCM push only needed on native Android/iOS
    }

    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

      // Request permission (Android 13+ requires explicit permission)
      const permResult = await FirebaseMessaging.requestPermissions();
      if (permResult.receive !== 'granted') {
        console.warn('FCM: Push notification permission denied.');
        return;
      }

      // Get the FCM token for this device
      const { token } = await FirebaseMessaging.getToken();
      if (!token) {
        console.warn('FCM: No token returned from Firebase.');
        return;
      }

      // Register token with the backend
      await this.sendTokenToBackend(token);

      // Listen for token refreshes — Firebase occasionally rotates tokens
      await FirebaseMessaging.addListener('tokenReceived', async (event) => {
        if (event.token) {
          await this.sendTokenToBackend(event.token);
        }
      });

    } catch (err) {
      // Non-fatal — app works normally without FCM, just won't get background pushes
      console.warn('FCM: Failed to register token:', err);
    }
  }

  /**
   * Registers the listener for notification clicks / taps (even when opening from cold start or background).
   */
  private async registerNotificationActionListener(): Promise<void> {
    if (this.actionListenerRegistered || !Capacitor.isNativePlatform()) {
      return;
    }
    this.actionListenerRegistered = true;

    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

      await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
        const data = (event.notification?.data as Record<string, string>) ?? {};
        const type = data['type'];
        const conversationId = data['conversationId'];
        const targetRoute = data['targetRoute'];

        this.zone.run(() => {
          if (type === 'chat' && conversationId) {
            void this.router.navigate(['/chat', conversationId]);
          } else if (targetRoute) {
            void this.router.navigate([targetRoute]);
          }
        });
      });
    } catch (err) {
      console.warn('FCM: Failed to register notificationActionPerformed listener:', err);
    }
  }

  /**
   * Listen for push notifications while the app is in the foreground.
   */
  async listenForForegroundMessages(
    onMessage: (title: string, body: string, data: Record<string, string>) => void
  ): Promise<() => void> {
    if (!Capacitor.isNativePlatform()) {
      return () => {};
    }

    try {
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

      const listener = await FirebaseMessaging.addListener('notificationReceived', (event) => {
        const n = event.notification;
        onMessage(
          n.title ?? '',
          n.body ?? '',
          (n.data as Record<string, string>) ?? {},
        );
      });

      return () => { listener.remove(); };
    } catch {
      return () => {};
    }
  }

  private async sendTokenToBackend(token: string): Promise<void> {
    const authToken = this.auth.token;
    if (!authToken) {
      return; // Not logged in yet — token will be sent after login
    }

    try {
      await this.http.put(
        `${this.api}/users/fcm-token`,
        { fcm_token: token },
        { headers: { Authorization: `Bearer ${authToken}` } }
      ).toPromise();
    } catch (err) {
      console.warn('FCM: Failed to send token to backend:', err);
    }
  }
}
