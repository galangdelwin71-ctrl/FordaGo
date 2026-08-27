import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { EchoService } from './echo.service';
import { AuthService } from './auth.service';
import { Message } from './coaching.service';

export interface ChatToastPayload {
  id: string;
  senderName: string;
  senderAvatar?: string;
  messagePreview: string;
  conversationId: number;
}

/**
 * App-wide Messenger-style chat toast service.
 *
 * When the user is NOT inside the chat thread that received a new message,
 * this service broadcasts a floating toast popup (like Messenger's heads-up
 * bubble) so they know someone sent them a message without having to be on
 * the chat page. Works entirely through the shared Echo/Reverb WebSocket
 * connection — no extra HTTP polling needed.
 *
 * Usage:
 *   1. Call listenForAll(conversationIds, partnerMap) on pages that have a
 *      coaching panel (dashboard, coaching, schedule) once the conversation
 *      list is loaded.
 *   2. Call stopListening() when leaving those pages.
 *   3. The <app-chat-toast> component subscribes to toast$ and renders the popup.
 */
@Injectable({ providedIn: 'root' })
export class ChatToastService {
  private toastSubject = new BehaviorSubject<ChatToastPayload | null>(null);
  readonly toast$ = this.toastSubject.asObservable();

  /** Conversation IDs that this service is currently listening on. */
  private activeChannels: string[] = [];

  /** Conversation ID of the chat page the user is CURRENTLY inside. Set by ChatPage. */
  private activeChatConversationId: number | null = null;

  constructor(
    private echoService: EchoService,
    private auth: AuthService,
    private zone: NgZone,
    private router: Router,
  ) {}

  /**
   * Called by ChatPage on enter/leave to suppress toasts for the
   * conversation the user is actively reading.
   */
  setActiveChat(conversationId: number | null): void {
    this.activeChatConversationId = conversationId;
  }

  /**
   * Start listening for new messages across all given conversations.
   * partnerMap maps conversationId → { name, avatar? } so we can show
   * who sent the message in the toast.
   */
  listenForAll(
    conversations: Array<{ id: number; partnerName: string; partnerAvatar?: string }>,
  ): void {
    // Leave old channels first
    this.stopListening();

    for (const convo of conversations) {
      const channelName = `conversation.${convo.id}`;
      const channel = this.echoService.privateChannel(channelName);
      if (!channel) continue;

      this.activeChannels.push(channelName);

      channel.listen('.message.sent', (data: { message: Message; conversation_id: number }) => {
        // Ignore if:
        // - Message is from ourselves (guard against string vs number mismatch
        //   since auth.user.id comes from JSON.parse(localStorage) and may be
        //   a string, while sender_id in the WebSocket payload is a number)
        // - User is currently inside this exact chat
        if (!data?.message) return;
        if (Number(data.message.sender_id) === Number(this.auth.user?.id)) return;
        if (this.activeChatConversationId === convo.id) return;

          this.showIncomingMessage(convo, data.message.body, data.message.id);
        });
      });
    }
  }

  /**
   * Broadcasts an incoming message toast and native notification immediately (0ms delay).
   */
  showIncomingMessage(
    convo: { id: number; partnerName: string; partnerAvatar?: string },
    body: string,
    messageId?: number
  ): void {
    if (this.activeChatConversationId === convo.id) return;

    this.zone.run(() => {
      const preview = body?.length > 60
        ? body.slice(0, 60) + '…'
        : body;

      const toast: ChatToastPayload = {
        id: `chat-toast-${Date.now()}`,
        senderName: convo.partnerName,
        senderAvatar: convo.partnerAvatar,
        messagePreview: preview,
        conversationId: convo.id,
      };

      this.toastSubject.next(toast);

      // Trigger a system notification on native Android tray / OS center with Quick Reply
      void this.sendNativeChatNotification(convo, preview, messageId);

      // Auto-dismiss in-app toast after 5 seconds
      setTimeout(() => {
        if (this.toastSubject.value?.id === toast.id) {
          this.toastSubject.next(null);
        }
      }, 5000);
    });
  }

  private actionTypesRegistered = false;

  /**
   * Registers the CHAT_MESSAGE action type with an inline text input ('reply')
   * and 'open' action so the user can type and send replies directly from the
   * Android notification drawer without opening the app.
   */
  private async ensureActionTypesRegistered(): Promise<void> {
    if (this.actionTypesRegistered) return;
    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.registerActionTypes({
        types: [
          {
            id: 'CHAT_MESSAGE',
            actions: [
              {
                id: 'reply',
                title: 'Reply',
                input: true,
                inputButtonTitle: 'Send',
                inputPlaceholder: 'Type a reply...',
              },
              {
                id: 'open',
                title: 'Open',
              },
            ],
          },
        ],
      });
      this.actionTypesRegistered = true;
    } catch {
      // Non-fatal if action types cannot be registered on this platform
    }
  }

  private async sendNativeChatNotification(
    convo: { id: number; partnerName: string; partnerAvatar?: string },
    body: string,
    messageId?: number
  ): Promise<void> {
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const permissions = await LocalNotifications.checkPermissions();
        const granted = permissions.display === 'granted'
          ? permissions
          : await LocalNotifications.requestPermissions();

        if (granted.display !== 'granted') return;

        await this.ensureActionTypesRegistered();

        const notifId = Number(convo.id) * 100000 + (messageId ? Number(messageId) % 100000 : Math.floor(Math.random() * 1000));

        await LocalNotifications.schedule({
          notifications: [{
            id: notifId,
            title: convo.partnerName,
            body: body || 'Sent you a message',
            channelId: 'fordago-alerts-v2',
            smallIcon: 'ic_stat_icon',
            iconColor: '#FFD700',
            actionTypeId: 'CHAT_MESSAGE',
            schedule: { at: new Date(Date.now() + 50) },
            extra: {
              type: 'chat',
              conversationId: convo.id,
              partnerName: convo.partnerName,
              targetRoute: `/chat/${convo.id}`,
            },
            attachments: convo.partnerAvatar ? [{ id: 'avatar', url: convo.partnerAvatar }] : undefined,
          }],
        });
      }
    } catch {
      // Non-fatal error fallback
    }
  }

  /** Dismiss the current toast manually. */
  dismissToast(): void {
    this.toastSubject.next(null);
  }

  /** Navigate to the conversation and dismiss. */
  openChat(conversationId: number): void {
    this.dismissToast();
    this.router.navigate(['/chat', conversationId]);
  }

  /** Stop all active channel listeners. */
  stopListening(): void {
    for (const ch of this.activeChannels) {
      this.echoService.leaveChannel(ch);
    }
    this.activeChannels = [];
  }
}
