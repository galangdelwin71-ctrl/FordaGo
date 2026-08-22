import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { ChatToastService, ChatToastPayload } from '../../services/chat-toast.service';

@Component({
  selector: 'app-chat-toast',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './chat-toast.component.html',
  styleUrls: ['./chat-toast.component.scss'],
})
export class ChatToastComponent implements OnInit, OnDestroy {
  toast: ChatToastPayload | null = null;
  private sub?: Subscription;

  constructor(private chatToastService: ChatToastService) {
    addIcons({ closeOutline });
  }

  ngOnInit(): void {
    this.sub = this.chatToastService.toast$.subscribe((t) => {
      this.toast = t;
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

  dismiss(event: Event): void {
    event.stopPropagation();
    this.chatToastService.dismissToast();
  }
}
