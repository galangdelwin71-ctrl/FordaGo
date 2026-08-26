import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline, sendOutline, paperPlaneOutline, chatbubbleEllipsesOutline } from 'ionicons/icons';
import { Subscription, firstValueFrom } from 'rxjs';
import { ChatToastService, ChatToastPayload } from '../../services/chat-toast.service';
import { CoachingService } from '../../services/coaching.service';

@Component({
  selector: 'app-chat-toast',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon],
  templateUrl: './chat-toast.component.html',
  styleUrls: ['./chat-toast.component.scss'],
})
export class ChatToastComponent implements OnInit, OnDestroy {
  toast: ChatToastPayload | null = null;
  replyText = '';
  isSending = false;
  private sub?: Subscription;

  constructor(
    private chatToastService: ChatToastService,
    private coachingService: CoachingService,
  ) {
    addIcons({ closeOutline, sendOutline, paperPlaneOutline, chatbubbleEllipsesOutline });
  }

  ngOnInit(): void {
    this.sub = this.chatToastService.toast$.subscribe((t) => {
      this.toast = t;
      this.replyText = '';
      this.isSending = false;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get initials(): string {
    if (!this.toast?.senderName) return '?';
    return this.toast.senderName
      .split(' ')
      .map((w) => w.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  openChat(): void {
    if (!this.toast) return;
    this.chatToastService.openChat(this.toast.conversationId);
  }

  async sendReply(event: Event): Promise<void> {
    event.stopPropagation();
    const text = this.replyText.trim();
    if (!text || !this.toast || this.isSending) return;

    this.isSending = true;
    try {
      await firstValueFrom(this.coachingService.sendMessage(this.toast.conversationId, text));
      this.replyText = '';
      this.chatToastService.dismissToast();
    } catch (err) {
      console.error('Failed to send reply from chat toast:', err);
    } finally {
      this.isSending = false;
    }
  }

  onInputClick(event: Event): void {
    event.stopPropagation();
  }

  onInputKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if (event.key === 'Enter') {
      void this.sendReply(event);
    }
  }

  dismiss(event: Event): void {
    event.stopPropagation();
    this.chatToastService.dismissToast();
  }
}

