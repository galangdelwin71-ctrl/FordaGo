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

        this.zone.run(() => {
          const preview = data.message.body?.length > 60
            ? data.message.body.slice(0, 60) + '…'
            : data.message.body;

          const toast: ChatToastPayload = {
            id: `chat-toast-${Date.now()}`,
            senderName: convo.partnerName,
            senderAvatar: convo.partnerAvatar,
            messagePreview: preview,
            conversationId: convo.id,
          };

          this.toastSubject.next(toast);

          // Auto-dismiss after 5 seconds
          setTimeout(() => {
            // Only clear if it's still the same toast (user didn't get another message)
            if (this.toastSubject.value?.id === toast.id) {
              this.toastSubject.next(null);
            }
          }, 5000);
        });
      });
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
