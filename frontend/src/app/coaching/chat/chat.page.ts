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
  IonModal,
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
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { CoachingService, Conversation, Message, WorkoutPlanProposal } from '../../services/coaching.service';
import { EchoService } from '../../services/echo.service';

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

  // ── Proposal Builder Modal (Coach) ───────────────────
  isProposalModalOpen = false;
  isSubmittingProposal = false;
  proposalError = '';
  successFeedback = '';

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
      { name: 'Barbell Bench Press', sets: 4, reps: 10, description: 'Warm-up with empty bar then progressive overload' },
      { name: 'Lat Pulldown', sets: 3, reps: 12, description: 'Squeeze back at bottom' },
      { name: 'Dumbbell Shoulder Press', sets: 3, reps: 10, description: 'Controlled tempo' },
    ] as ProposalFormExercise[],
  };

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
      addOutline,
      trashOutline,
      closeOutline,
      sparkles,
      sparklesOutline,
      checkmarkCircle,
      alertCircleOutline,
      barbellOutline,
      locationOutline,
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

  private getDefaultTomorrowDate(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
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
          this.loadMessages();
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

  // ── Proposal Form Actions (Coach) ────────────────────

  openProposalModal() {
    this.proposalError = '';
    this.isProposalModalOpen = true;
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

  goBack() {
    this.router.navigate(['/coaching']);
  }
}
