import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonFooter,
  IonIcon,
  IonSpinner,
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
  sparkles,
  checkmarkCircle,
  alertCircleOutline,
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { CoachingService, Conversation, Message, WorkoutPlanProposal } from '../../services/coaching.service';
import { EchoService } from '../../services/echo.service';

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

  private channelName = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private coachingService: CoachingService,
    private echoService: EchoService,
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
      sparkles,
      checkmarkCircle,
      alertCircleOutline,
    });
  }

  ngOnInit() {
    const idParam = this.route.snapshot.paramMap.get('conversationId');
    if (idParam) {
      this.conversationId = parseInt(idParam, 10);
      this.loadConversation();
      this.loadMessages();
      this.setupEchoListener();
    } else {
      this.goBack();
    }
  }

  ngOnDestroy() {
    if (this.channelName) {
      this.echoService.leaveChannel(this.channelName);
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

  loadConversation() {
    this.coachingService.getConversation(this.conversationId).subscribe({
      next: (res) => {
        this.conversation = res;
      },
      error: (err) => {
        console.error('Failed to load conversation', err);
      },
    });
  }

  loadMessages() {
    this.isLoading = true;
    this.coachingService.getMessages(this.conversationId).subscribe({
      next: (res) => {
        this.messages = res || [];
        this.isLoading = false;
        this.scrollToBottom();
      },
      error: (err) => {
        console.error('Failed to load messages', err);
        this.isLoading = false;
      },
    });
  }

  /**
   * Real-time WebSocket listener with Laravel Reverb & Echo.
   */
  private setupEchoListener() {
    this.channelName = `conversation.${this.conversationId}`;
    const channel = this.echoService.privateChannel(this.channelName);

    if (channel) {
      // Listen for incoming messages
      channel.listen('.message.sent', (data: { message: Message; conversation_id: number }) => {
        if (data && data.message) {
          // If the message was sent by the partner, add to local list and mark as read
          if (data.message.sender_id !== this.currentUserId) {
            this.messages.push(data.message);
            this.scrollToBottom();
            this.coachingService.markMessagesRead(this.conversationId).subscribe();
          }
        }
      });

      // Listen for new workout proposals
      channel.listen('.proposal.sent', (data: { proposal: WorkoutPlanProposal }) => {
        if (data && data.proposal) {
          this.loadMessages(); // refresh message thread with the new proposal card
        }
      });

      // Listen for accepted proposals
      channel.listen('.proposal.accepted', (data: { proposal: WorkoutPlanProposal }) => {
        if (data && data.proposal) {
          const found = this.messages.find((m) => m.proposal && m.proposal.id === data.proposal.id);
          if (found && found.proposal) {
            found.proposal.status = 'accepted';
            found.proposal.accepted_at = data.proposal.accepted_at;
          }
        }
      });
    }
  }

  sendMessage() {
    const text = this.newMessage.trim();
    if (!text || this.isSending) return;

    this.isSending = true;
    this.newMessage = '';

    this.coachingService.sendMessage(this.conversationId, text).subscribe({
      next: (sentMsg) => {
        this.isSending = false;
        this.messages.push(sentMsg);
        this.scrollToBottom();
      },
      error: (err) => {
        this.isSending = false;
        console.error('Failed to send message', err);
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
      },
      error: (err) => {
        this.isAcceptingProposalId = null;
        console.error('Failed to accept proposal', err);
      },
    });
  }

  scrollToBottom() {
    setTimeout(() => {
      this.content?.scrollToBottom(250);
    }, 100);
  }

  goBack() {
    this.router.navigate(['/coaching']);
  }
}
