import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonFooter,
  IonIcon,
  IonSpinner,
  IonModal,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  sendOutline,
  paperPlaneOutline,
  checkmarkDoneOutline,
  checkmarkOutline,
  timeOutline,
  calendarOutline,
  fitnessOutline,
  cashOutline,
  ribbonOutline,
  addCircleOutline,
  addOutline,
  trashOutline,
  closeOutline,
  sparkles,
  sparklesOutline,
  checkmarkCircle,
  alertCircleOutline,
  barbellOutline,
  locationOutline,
  closeCircleOutline,
  clipboardOutline,
  chevronForwardOutline,
  personCircleOutline,
  atOutline,
  saveOutline,
  notificationsOutline,
  notificationsOffOutline,
  alarmOutline,
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { CoachingService, Conversation, Message, WorkoutPlanProposal, CoachProgram } from '../../services/coaching.service';
import { EchoService } from '../../services/echo.service';
import { ChatToastService } from '../../services/chat-toast.service';
import { FcmService } from '../../services/fcm.service';
import { ChatMuteService, ConvoMuteInfo } from '../../services/chat-mute.service';
import { OnboardingService, TourStep } from '../../services/onboarding.service';
import { getCachedData, setCachedData } from '../../utils/local-cache.util';

interface ProposalFormExercise {
  name: string;
  sets: number;
  reps: number;
  description?: string;
}

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  host: { class: 'ion-page fordago-page' },
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonFooter,
    IonIcon,
    IonSpinner,
    IonModal,
  ],
})
export class ChatPage implements OnInit, OnDestroy {
  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;
  @ViewChild(IonContent, { static: false }) private content?: IonContent;


  conversationId!: number;
  conversation: Conversation | null = null;
  messages: Message[] = [];
  newMessage = '';

  isLoading = true;
  isSending = false;
  isAcceptingProposalId: number | null = null;

  // ── Typing Indicator ──────────────────────────────────
  isPartnerTyping = false;
  private typingTimer: any = null;
  private lastTypingSent = 0;

  /** Active live sync timer (polls every 2s while chat screen is open) */
  private pollTimer: any = null;
  /** Cleanup function for native FCM foreground message listener */
  private fcmCleanup: (() => void) | null = null;

  /** Cached reference to the active Echo private channel. Populated by
   * setupEchoListener() and cleared in ionViewWillLeave(). Using a cached
   * reference avoids calling echoService.privateChannel() on every keystroke
   * (typing indicator) and prevents accidental Echo re-initialization. */
  private activeChannel: any = null;

  /**
   * Small info modal shown when the header avatar/name is tapped -- the
   * header itself truncates a long name with an ellipsis (fixed-width
   * toolbar slot next to the back button and, for a coach, the Propose
   * Plan button), so this is the fallback for reading the partner's full
   * name/username/role without needing more toolbar space.
   */
  partnerInfoOpen = false;

  // ── Proposal Builder Modal (Coach) ───────────────────
  isProposalModalOpen = false;
  isSubmittingProposal = false;
  proposalError = '';
  successFeedback = '';

  // Saved reusable programs ("Create Program" Quick Action on the Coach
  // Dashboard, see CoachProgramController) that this coach can load into
  // the proposal form below instead of typing a routine from scratch every
  // time. Loaded lazily on first openProposalModal() -- see
  // loadSavedProgramsIfNeeded() -- and cached for the lifetime of this
  // chat visit; the Manage Programs modal on the dashboard is the only
  // place programs are created/edited, this is just a read-only picker.
  savedPrograms: CoachProgram[] = [];
  isLoadingSavedPrograms = false;
  private savedProgramsLoaded = false;

  quickExercises: string[] = [
    'Barbell Bench Press',
    'Barbell Back Squat',
    'Conventional Deadlift',
    'Lat Pulldown',
    'Dumbbell Shoulder Press',
    'Incline Dumbbell Press',
    'Dumbbell Bicep Curls',
    'Tricep Cable Pushdowns',
    'Leg Press',
    'Plank Hold',
  ];

  proposalForm = {
    session_date: this.getDefaultTomorrowDate(),
    time_val: '09:00',
    time_ampm: 'AM',
    duration_minutes: 60,
    price: 500,
    location: 'FordaGO Gym - Main Floor',
    items: [
      { name: 'Barbell Bench Press', sets: 4, reps: 10, description: 'Warm-up with empty bar then progress gradually.' },
      { name: 'Lat Pulldown', sets: 3, reps: 12, description: 'Squeeze back at bottom.' },
      { name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, description: 'Keep core tight and press overhead.' },
    ] as ProposalFormExercise[],
  };

  private channelName = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private auth: AuthService,
    private coachingService: CoachingService,
    private echoService: EchoService,
    private chatToastService: ChatToastService,
    private fcmService: FcmService,
    private chatMuteService: ChatMuteService,
    private zone: NgZone,
    private modalCtrl: ModalController,
    public onboardingService: OnboardingService,
  ) {
    addIcons({
      arrowBackOutline,
      sendOutline,
      paperPlaneOutline,
      checkmarkDoneOutline,
      checkmarkOutline,
      timeOutline,
      calendarOutline,
      fitnessOutline,
      cashOutline,
      ribbonOutline,
      addCircleOutline,
      addOutline,
      trashOutline,
      closeOutline,
      sparkles,
      sparklesOutline,
      checkmarkCircle,
      alertCircleOutline,
      barbellOutline,
      locationOutline,
      closeCircleOutline,
      clipboardOutline,
      chevronForwardOutline,
      personCircleOutline,
      atOutline,
      saveOutline,
      notificationsOutline,
      notificationsOffOutline,
      alarmOutline,
    });
  }

  // ── Local-First Cache (Memory & Storage) ─────────────────────
  private static conversationCache = new Map<number, Conversation>();
  private static messagesCache = new Map<number, Message[]>();

  ngOnInit() {
    void this.modalCtrl.dismiss().catch(() => {});
    const idParam = this.route.snapshot.paramMap.get('conversationId');
    if (idParam) {
      this.conversationId = parseInt(idParam, 10);
      // Immediately show cached data (0ms perceived load time)
      void this.hydrateChatFromCache();
      // Load conversation metadata (name, partner info)
      this.loadConversation();
      // NOTE: loadMessages(), markConversationAsRead(), setActiveChat(), and
      // setupEchoListener() are intentionally moved to ionViewWillEnter() so
      // they run on EVERY page activation (first load AND back-navigation
      // return), not just the first component creation.
    } else {
      this.goBack();
    }
  }

  /**
   * Called by Ionic every time this page becomes the active view.
   * This fires on first entry AND whenever the user navigates back to this
   * page from a child route — making it the correct place to (re)establish
   * the WebSocket listener and refresh messages.
   */
  ionViewWillEnter() {
    // Dismiss any leftover modals immediately
    void this.modalCtrl.dismiss().catch(() => {});

    if (!this.conversationId) return;

    // Suppress incoming toasts while the user is actively reading this chat
    this.chatToastService.setActiveChat(this.conversationId);

    // Optimistically clear unread badge in memory & local cache, and notify backend (0ms perceived delay)
    this.coachingService.markConversationAsRead(this.conversationId, true);

    // Refresh messages in case any arrived while we were away
    this.loadMessages();

    // Start live sync (WebSocket + FCM Foreground Listener + Smart 2s Polling)
    this.startLiveSync();

    this.checkAndStartChatTour();
  }

  private checkAndStartChatTour(): void {
    const user = this.auth.user;
    if (!user || user.role === 'admin') return;

    setTimeout(() => {
      if (this.onboardingService.isRunning) return;

      const steps: TourStep[] = [
        {
          targetId: '#tour-chat-header',
          title: 'Direct Chat Partner',
          description: 'Tap the top header anytime to view your trainer or client details and bio.',
          icon: 'person-circle-outline',
          position: 'bottom',
        },
        {
          targetId: '#tour-chat-input-bar',
          title: 'Instant Messaging & Plans',
          description: 'Type messages, view live typing indicators, and receive workout plan proposals.',
          icon: 'paper-plane-outline',
          position: 'top',
        },
      ];

      const available = steps.filter((s) => !!document.querySelector(s.targetId));
      if (available.length > 0) {
        this.onboardingService.startTour('chat_main', available, false, user.id);
      }
    }, 700);
  }

  /**
   * Called by Ionic every time this page is about to leave the active view.
   */
  ionViewWillLeave() {
    this.stopLiveSync();
  }

  ngOnDestroy() {
    this.stopLiveSync();
    this.chatToastService.setActiveChat(null);
  }

  /**
   * Starts all real-time sync mechanisms:
   * 1. Laravel Echo / Reverb WebSockets (sub-second push)
   * 2. Native FCM foreground push listener (instant foreground arrival)
   * 3. Smart 2-second background polling while chat screen is open
   */
  private startLiveSync(): void {
    this.setupEchoListener();
    this.setupFcmForegroundListener();
    this.startActivePolling();
  }

  /**
   * Stops all active listeners and timers when navigating away from chat.
   */
  private stopLiveSync(): void {
    clearTimeout(this.typingTimer);
    this.stopActivePolling();

    if (this.fcmCleanup) {
      try { this.fcmCleanup(); } catch { /* ignore */ }
      this.fcmCleanup = null;
    }

    if (this.activeChannel) {
      try {
        this.activeChannel.whisper('typing', { userId: this.currentUserId, isTyping: false });
      } catch { /* ignore */ }
    }

    if (this.channelName) {
      this.echoService.leaveChannel(this.channelName);
    }
    this.activeChannel = null;
    this.isPartnerTyping = false;
  }

  /**
   * Listens for Firebase Push Notifications while app is in foreground.
   * If a message for this conversation arrives, instantly refreshes chat messages.
   */
  private setupFcmForegroundListener(): void {
    void this.fcmService.listenForForegroundMessages((_title, _body, data) => {
      if (data && (Number(data['conversationId']) === Number(this.conversationId) || data['type'] === 'chat')) {
        this.zone.run(() => {
          this.loadMessagesSilently();
        });
      }
    }).then((cleanup) => {
      this.fcmCleanup = cleanup;
    });
  }

  /**
   * Starts 1.5-second polling interval while sitting on the active chat view.
   */
  private startActivePolling(): void {
    this.stopActivePolling();
    this.zone.runOutsideAngular(() => {
      this.pollTimer = setInterval(() => {
        this.loadMessagesSilently();
      }, 1500);
    });
  }

  private stopActivePolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  /**
   * Stage 3 local-first hydration: restores conversation and messages
   * immediately from memory or local storage so the chat opens with 0ms delay.
   */
  private async hydrateChatFromCache(): Promise<void> {
    // 1. In-memory static cache
    const memConvo = ChatPage.conversationCache.get(this.conversationId);
    if (memConvo) {
      this.conversation = memConvo;
    }
    const memMsgs = ChatPage.messagesCache.get(this.conversationId);
    if (memMsgs && memMsgs.length > 0) {
      this.messages = memMsgs;
      this.isLoading = false;
      this.scrollToBottom();
    }

    // 2. Persistent storage fallback
    if (!this.conversation) {
      const cachedConvo = await getCachedData<Conversation>(`fordago.cache.chat_convo_${this.conversationId}`);
      if (cachedConvo) {
        this.conversation = cachedConvo;
        ChatPage.conversationCache.set(this.conversationId, cachedConvo);
      }
    }
    if (this.messages.length === 0) {
      const cachedMsgs = await getCachedData<Message[]>(`fordago.cache.chat_msgs_${this.conversationId}`);
      if (Array.isArray(cachedMsgs) && cachedMsgs.length > 0) {
        this.messages = cachedMsgs;
        ChatPage.messagesCache.set(this.conversationId, cachedMsgs);
        this.isLoading = false;
        this.scrollToBottom();
      }
    }
  }

  get currentUserId(): number {
    return this.auth.user?.id || 0;
  }

  get isCoach(): boolean {
    return this.conversation?.is_coach || false;
  }

  get partner() {
    return this.conversation?.partner;
  }

  /**
   * Display name for the chat header. Falls back to username, then a
   * generic label, so the header is never left blank -- first_name/
   * last_name are optional on User (see AdminCoachController::store()),
   * so a coach account created with only username/email would otherwise
   * render an empty <h4> here.
   */
  get partnerDisplayName(): string {
    const p = this.partner;
    if (!p) return '';
    const full = `${p.first_name || ''} ${p.last_name || ''}`.trim();
    return full || p.username || 'FordaGO User';
  }

  private getDefaultTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  // ── Partner Info Modal (tap avatar/name to view full name) ────────

  openPartnerInfo(): void {
    if (!this.partner) return;
    this.partnerInfoOpen = true;
  }

  closePartnerInfo(): void {
    this.partnerInfoOpen = false;
  }

  // ── Mute & Snooze Controls ──────────────────────────────────────────

  get muteInfo(): ConvoMuteInfo {
    return this.chatMuteService.getMuteInfo(this.conversationId);
  }

  snoozeConversation(hours: number): void {
    this.chatMuteService.snooze(this.conversationId, hours);
    this.showToast(`⏰ Notifications snoozed for ${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  }

  muteConversationPermanently(): void {
    this.chatMuteService.mutePermanently(this.conversationId);
    this.showToast('🔕 Notifications muted until you turn them back on');
  }

  unmuteConversation(): void {
    this.chatMuteService.unmute(this.conversationId);
    this.showToast('🔔 Notifications unmuted');
  }

  isCurrentSnooze(hours: number): boolean {
    const info = this.muteInfo;
    if (!info.isSnoozed || typeof info.mutedUntil !== 'number') return false;
    const diffHours = (info.mutedUntil - Date.now()) / (1000 * 60 * 60);
    return Math.abs(diffHours - hours) < 0.6;
  }

  loadConversation() {
    this.coachingService.getConversation(this.conversationId).subscribe({
      next: (res) => {
        if (res) {
          this.conversation = res;
          ChatPage.conversationCache.set(this.conversationId, res);
          void setCachedData(`fordago.cache.chat_convo_${this.conversationId}`, res);
        }
      },
      error: (err) => {
        console.error('Failed to load conversation', err);
      },
    });
  }

  loadMessages() {
    if (this.messages.length === 0) {
      this.isLoading = true;
    }
    this.coachingService.getMessages(this.conversationId).subscribe({
      next: (res) => {
        const msgs = res || [];
        const isInitial = this.messages.length === 0;
        const countChanged = msgs.length !== this.messages.length;
        this.messages = msgs;
        this.isLoading = false;
        ChatPage.messagesCache.set(this.conversationId, msgs);
        void setCachedData(`fordago.cache.chat_msgs_${this.conversationId}`, msgs);
        if (isInitial || countChanged) {
          this.scrollToBottom();
        }
      },
      error: (err) => {
        console.error('Failed to load messages', err);
        this.isLoading = false;
      },
    });
  }

  /**
   * Silently polls and syncs messages in the background without showing any spinners.
   * If a new partner message arrived, updates the chat bubbles and scrolls smoothly.
   */
  loadMessagesSilently(): void {
    if (!this.conversationId) return;

    this.coachingService.getMessages(this.conversationId).subscribe({
      next: (res) => {
        const incoming = res || [];
        if (!incoming.length && !this.messages.length) return;

        const countDiff = incoming.length !== this.messages.length;
        const lastLocalId = this.messages.length ? this.messages[this.messages.length - 1].id : 0;
        const lastIncomingId = incoming.length ? incoming[incoming.length - 1].id : 0;

        let hasDiff = countDiff || (lastLocalId !== lastIncomingId);

        // Check if any read status or proposal status changed
        if (!hasDiff && incoming.length === this.messages.length) {
          for (let i = incoming.length - 1; i >= Math.max(0, incoming.length - 8); i--) {
            const inc = incoming[i];
            const loc = this.messages[i];
            if (inc.read_at !== loc?.read_at || inc.proposal?.status !== loc?.proposal?.status) {
              hasDiff = true;
              break;
            }
          }
        }

        if (hasDiff) {
          this.zone.run(() => {
            this.messages = incoming;
            this.isLoading = false;
            ChatPage.messagesCache.set(this.conversationId, incoming);
            void setCachedData(`fordago.cache.chat_msgs_${this.conversationId}`, incoming);

            if (countDiff || lastLocalId !== lastIncomingId) {
              this.scrollToBottom();
              this.coachingService.markConversationAsRead(this.conversationId, true);
            }
          });
        }
      },
      error: () => {
        // Silent error handling for background polling
      },
    });
  }

  /**
   * Real-time WebSocket listener with Laravel Reverb & Echo.
   *
   * EchoService now creates the underlying Pusher connection with
   * NgZone.runOutsideAngular() (see echo.service.ts) so its internal
   * reconnect/heartbeat timers can't flood Angular with change-detection
   * cycles. Because of that, event callbacks registered on this channel
   * also fire OUTSIDE the Angular zone by default -- any callback below
   * that mutates component state (messages/proposal) must explicitly
   * re-enter the zone with this.zone.run(), or the template simply won't
   * update even though the data changed underneath it.
   */
  private setupEchoListener() {
    this.channelName = `conversation.${this.conversationId}`;

    // Get (or create) the private channel subscription for this conversation.
    // Echo caches channel objects internally, so this is idempotent.
    const channel = this.echoService.privateChannel(this.channelName);
    if (!channel) {
      console.warn('[Chat] Echo channel unavailable — real-time events disabled for this session.');
      return;
    }

    // Cache the channel so typing/send can use it directly without going
    // through echoService.privateChannel() on every keystroke.
    this.activeChannel = channel;

    // ── Message handler ────────────────────────────────────────────────────
    // broadcastAs() returns 'message.sent', so the Pusher event name on the
    // wire is exactly 'message.sent'. Echo's .listen('.message.sent') strips
    // the leading dot and binds to 'message.sent' — the ONLY correct binding.
    // The previous code had 3 extra dead listeners (message.sent without dot,
    // .MessageSent, MessageSent) that never fired; removed to prevent noise.
    const handleIncomingMessage = (data: { message?: Message; conversation_id?: number } | any) => {
      const msg = data?.message || data;
      if (!msg || !msg.id) return;

      console.log('[Chat Echo] ✅ Incoming message received:', msg.id, msg.body?.slice(0, 30));

      const isOwnMessage = Number(msg.sender_id) === Number(this.currentUserId);

      this.zone.run(() => {
        this.isPartnerTyping = false;

        if (isOwnMessage) {
          // Replace the optimistic placeholder (negative ID) with the confirmed
          // server message. Also handles the WS event arriving before the HTTP
          // response (race condition) by matching on message body.
          const optIdx = this.messages.findIndex(
            (m) => m.id === msg.id || (m.id < 0 && m.body === msg.body)
          );
          if (optIdx !== -1) {
            this.messages[optIdx] = msg;
          } else {
            if (!this.messages.some((m) => m.id === msg.id)) {
              this.messages.push(msg);
            }
          }
          this.scrollToBottom();
        } else {
          // Partner's message: add only if not already present
          if (!this.messages.some((m) => m.id === msg.id)) {
            this.messages.push(msg);
            ChatPage.messagesCache.set(this.conversationId, this.messages);
            void setCachedData(`fordago.cache.chat_msgs_${this.conversationId}`, this.messages.slice(-50));
            this.scrollToBottom();

            // Instantly whisper to the partner that their message was seen (0ms delay)
            if (this.activeChannel) {
              try {
                this.activeChannel.whisper('read', {
                  conversation_id: this.conversationId,
                  reader_id: this.currentUserId,
                  read_at: new Date().toISOString(),
                });
              } catch (e) {
                console.warn('Whisper read error:', e);
              }
            }

            // Immediately notify backend to persist read_at and clear badges
            this.coachingService.markConversationAsRead(this.conversationId, true);
          }
        }
      });
    };

    // Single correct listener — do NOT add duplicates for the same event.
    channel.listen('.message.sent', handleIncomingMessage);

    // Initial whisper to notify partner that we are active in chat and have seen messages
    try {
      channel.whisper('read', {
        conversation_id: this.conversationId,
        reader_id: this.currentUserId,
        read_at: new Date().toISOString(),
      });
    } catch (e) {
      // ignore
    }

    // ── Instant whisper read receipt (0ms client-to-client) ────────────────
    channel.listenForWhisper('read', (data: { conversation_id?: number; reader_id?: number; read_at?: string }) => {
      if (Number(data?.reader_id) === Number(this.currentUserId)) return;
      const readAt = data?.read_at || new Date().toISOString();
      this.zone.run(() => {
        let updated = false;
        for (const m of this.messages) {
          if (Number(m.sender_id) === Number(this.currentUserId) && !m.read_at) {
            m.read_at = readAt;
            updated = true;
          }
        }
        if (updated) {
          ChatPage.messagesCache.set(this.conversationId, this.messages);
          void setCachedData(`fordago.cache.chat_msgs_${this.conversationId}`, this.messages.slice(-50));
        }
      });
    });

    // ── Typing whisper ─────────────────────────────────────────────────────
    channel.listenForWhisper('typing', (e: { userId: number; isTyping: boolean }) => {
      if (Number(e?.userId) === Number(this.currentUserId)) return; // ignore own whispers
      this.zone.run(() => {
        this.isPartnerTyping = !!e?.isTyping;
        clearTimeout(this.typingTimer);
        if (this.isPartnerTyping) {
          this.scrollToBottom();
          // Auto-clear after 3s in case the partner stops typing without sending
          this.typingTimer = setTimeout(() => {
            this.zone.run(() => { this.isPartnerTyping = false; });
          }, 3000);
        }
      });
    });

    // ── Read receipt broadcast fallback (double checkmark) ─────────────────
    channel.listen('.messages.read', (data: { conversation_id: number; reader_id: number; read_at: string }) => {
      if (Number(data.reader_id) === Number(this.currentUserId)) return;
      this.zone.run(() => {
        let updated = false;
        for (const m of this.messages) {
          if (Number(m.sender_id) === Number(this.currentUserId) && !m.read_at) {
            m.read_at = data.read_at;
            updated = true;
          }
        }
        if (updated) {
          ChatPage.messagesCache.set(this.conversationId, this.messages);
          void setCachedData(`fordago.cache.chat_msgs_${this.conversationId}`, this.messages.slice(-50));
        }
      });
    });

    // ── Workout proposals ──────────────────────────────────────────────────
    channel.listen('.proposal.sent', (data: { proposal: WorkoutPlanProposal; message?: Message }) => {
      if (data?.message) {
        // Push the proposal message directly — no HTTP round-trip needed
        this.zone.run(() => {
          const msg = data.message!;
          if (!this.messages.some((m) => m.id === msg.id)) {
            this.messages.push(msg);
            ChatPage.messagesCache.set(this.conversationId, this.messages);
            void setCachedData(`fordago.cache.chat_msgs_${this.conversationId}`, this.messages.slice(-50));
            this.scrollToBottom();
          }
        });
      } else if (data?.proposal) {
        // Fallback: reload only if no message payload provided
        this.zone.run(() => this.loadMessages());
      }
    });

    channel.listen('.proposal.accepted', (data: { proposal: WorkoutPlanProposal }) => {
      if (data?.proposal) {
        this.zone.run(() => {
          const found = this.messages.find((m) => m.proposal && m.proposal.id === data.proposal.id);
          if (found?.proposal) {
            found.proposal.status = 'accepted';
            found.proposal.accepted_at = data.proposal.accepted_at;
            ChatPage.messagesCache.set(this.conversationId, this.messages);
            void setCachedData(`fordago.cache.chat_msgs_${this.conversationId}`, this.messages.slice(-50));
          }
        });
      }
    });

    console.log('[Chat Echo] 🔌 Subscribed to channel:', this.channelName);
  }

  /**
   * Broadcast typing status to partner via WebSocket whisper.
   * Uses the cached activeChannel reference — no round-trip through EchoService.
   */
  onTyping(): void {
    const now = Date.now();
    if (now - this.lastTypingSent > 800 && this.activeChannel) {
      this.lastTypingSent = now;
      try {
        this.activeChannel.whisper('typing', { userId: this.currentUserId, isTyping: true });
      } catch { /* WS might be momentarily closed during reconnection */ }
    }
  }

  sendMessage() {
    const text = this.newMessage.trim();
    if (!text || this.isSending) return;

    // Clear typing indicator on send (use cached channel — no EchoService lookup)
    if (this.activeChannel) {
      try {
        this.activeChannel.whisper('typing', { userId: this.currentUserId, isTyping: false });
      } catch { /* ignore if WS is reconnecting */ }
    }

    this.isSending = true;
    this.newMessage = '';

    // ── Optimistic update: show message immediately before server confirms ──
    // Generate a temporary ID so we can replace this placeholder with the
    // real server-side message once the HTTP response arrives.
    const optimisticId = -(Date.now());
    const optimisticMsg: Message = {
      id: optimisticId,
      conversation_id: this.conversationId,
      sender_id: this.currentUserId,
      body: text,
      type: 'text',
      created_at: new Date().toISOString(),
    };
    this.messages.push(optimisticMsg);
    this.scrollToBottom();

    // Instantly bring this conversation to the top in the Messages list
    this.coachingService.updateConversationLatest(this.conversationId, optimisticMsg);

    this.coachingService.sendMessage(this.conversationId, text).subscribe({
      next: (sentMsg) => {
        this.isSending = false;
        // Replace the optimistic placeholder with the confirmed server message
        const idx = this.messages.findIndex(
          (m) => m.id === optimisticId || m.id === sentMsg.id || (m.id < 0 && m.body === sentMsg.body)
        );
        if (idx !== -1) {
          this.messages[idx] = sentMsg;
        } else {
          const alreadyExists = this.messages.some((m) => m.id === sentMsg.id);
          if (!alreadyExists) {
            this.messages.push(sentMsg);
          }
        }
        // Deduplicate messages array to prevent any double bubbles
        const seen = new Set<number>();
        this.messages = this.messages.filter((m) => {
          if (seen.has(m.id)) return false;
          seen.add(m.id);
          return true;
        });
        ChatPage.messagesCache.set(this.conversationId, this.messages);
        void setCachedData(`fordago.cache.chat_msgs_${this.conversationId}`, this.messages.slice(-50));
        this.coachingService.updateConversationLatest(this.conversationId, sentMsg);
      },
      error: (err) => {
        this.isSending = false;
        // Remove the failed optimistic message from the list
        const idx = this.messages.findIndex((m) => m.id === optimisticId);
        if (idx !== -1) this.messages.splice(idx, 1);
        console.error('Failed to send message', err);
      },
    });
  }

  // ── Proposal Form Actions (Coach) ────────────────────

  openProposalModal() {
    this.proposalError = '';
    this.isProposalModalOpen = true;
    this.loadSavedProgramsIfNeeded();
  }

  /**
   * Lazily fetches this coach's saved programs the first time the
   * proposal modal is opened in this chat visit -- the list is scoped to
   * the coach's own rows server-side (see CoachProgramController::index()),
   * cheap to load, but no need to refetch on every re-open of the same
   * modal. Guarded by isCoach so this never fires for a client account
   * (the template only renders the "Propose Plan" trigger for isCoach, but
   * this keeps the method itself safe if ever called directly).
   */
  private loadSavedProgramsIfNeeded(): void {
    if (!this.isCoach || this.savedProgramsLoaded || this.isLoadingSavedPrograms) return;
    this.isLoadingSavedPrograms = true;
    this.coachingService.getPrograms().subscribe({
      next: (res) => {
        this.savedPrograms = res || [];
        this.isLoadingSavedPrograms = false;
        this.savedProgramsLoaded = true;
      },
      error: (err) => {
        console.error('Failed to load saved programs', err);
        this.isLoadingSavedPrograms = false;
      },
    });
  }

  /**
   * "Use this program" -- hydrates the proposal form from a saved
   * template (see CoachProgramController's own doc-comment: programs exist
   * specifically to seed this form instead of the coach starting blank
   * every time). Location is deliberately left untouched: a CoachProgram
   * doesn't carry one (see CoachProgram model), so whatever the coach
   * already typed/defaulted stays as-is. Session date is likewise
   * untouched -- a template has no date of its own.
   */
  applyProgram(program: CoachProgram): void {
    this.proposalForm.duration_minutes = program.duration_minutes || this.proposalForm.duration_minutes;
    this.proposalForm.price = program.price ?? this.proposalForm.price;
    if (program.items && program.items.length > 0) {
      this.proposalForm.items = program.items.map((item) => ({
        name: item.name || '',
        sets: item.sets ?? 3,
        reps: item.reps ?? 10,
        description: item.description || '',
      }));
    }
    this.showToast(`Loaded "${program.name}" — review details before sending.`);
  }

  closeProposalModal() {
    this.isProposalModalOpen = false;
  }

  addExerciseItem(name = '', sets = 3, reps = 10, description = '') {
    this.proposalForm.items.push({
      name: name || '',
      sets: sets || 3,
      reps: reps || 10,
      description: description || '',
    });
  }

  removeExerciseItem(index: number) {
    if (this.proposalForm.items.length <= 1) return;
    this.proposalForm.items.splice(index, 1);
  }

  quickAddExercise(name: string) {
    const last = this.proposalForm.items[this.proposalForm.items.length - 1];
    if (last && !last.name.trim()) {
      last.name = name;
    } else {
      this.addExerciseItem(name, 3, 10);
    }
  }

  submitProposal() {
    this.proposalError = '';

    // Validate
    const validItems = this.proposalForm.items.filter((i) => i.name.trim() !== '');
    if (validItems.length === 0) {
      this.proposalError = 'Please add at least 1 exercise to the plan.';
      return;
    }

    if (!this.proposalForm.session_date) {
      this.proposalError = 'Please choose a session date.';
      return;
    }

    this.isSubmittingProposal = true;

    this.coachingService.createProposal({
      conversation_id: this.conversationId,
      session_date: this.proposalForm.session_date,
      time_val: this.proposalForm.time_val,
      time_ampm: this.proposalForm.time_ampm,
      duration_minutes: Number(this.proposalForm.duration_minutes),
      price: Number(this.proposalForm.price),
      location: this.proposalForm.location,
      items: validItems,
    }).subscribe({
      next: () => {
        this.isSubmittingProposal = false;
        this.isProposalModalOpen = false;
        this.showToast('Workout proposal sent to client!');
        this.loadMessages();
      },
      error: (err) => {
        this.isSubmittingProposal = false;
        this.proposalError = err?.error?.message || 'Failed to send proposal. Please try again.';
        console.error('Failed to create proposal', err);
      },
    });
  }

  /**
   * "Use" / Accept workout plan proposal button logic.
   */
  acceptProposal(proposal: WorkoutPlanProposal) {
    if (!proposal || this.isAcceptingProposalId) return;
    this.isAcceptingProposalId = proposal.id;

    this.coachingService.acceptProposal(proposal.id).subscribe({
      next: (res) => {
        this.isAcceptingProposalId = null;
        proposal.status = 'accepted';
        proposal.accepted_at = res?.proposal?.accepted_at || new Date().toISOString();
        this.showToast('🎉 Plan accepted! Added to your Workout Schedule.');
      },
      error: (err) => {
        this.isAcceptingProposalId = null;
        console.error('Failed to accept proposal', err);
      },
    });
  }

  showToast(msg: string) {
    this.successFeedback = msg;
    setTimeout(() => {
      this.successFeedback = '';
    }, 4000);
  }

  scrollToBottom() {
    setTimeout(() => {
      this.content?.scrollToBottom(250);
    }, 100);
  }

  /**
   * Back button on a chat thread returns to whichever page + panel tab
   * the member actually came from (Dashboard, Schedule, or the Coaching
   * page -- the coaching panel opens as an overlay on top of all three),
   * instead of always forcing a hard navigation to '/coaching' or to a
   * hardcoded tab. Location.back() walks the real browser/router history
   * one step, which is always exactly the page the member was already on
   * before this /chat/:id route was pushed.
   *
   * The specific panel TAB to reopen on was already recorded before that
   * push happened -- see CoachingPanelComponent.navigateAway(), called by
   * every method that routes here (openConversation(), openClientChat(),
   * startChat(), openTodaySession()). This method has nothing left to do
   * but walk back; re-setting a tab here would just clobber that
   * already-correct value with a guess.
   */
  goBack() {
    this.location.back();
  }
}
