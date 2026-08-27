import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

export interface ConvoMuteInfo {
  isMuted: boolean;
  isSnoozed: boolean;
  mutedUntil: number | 'infinite' | null;
  label: string;
}

@Injectable({ providedIn: 'root' })
export class ChatMuteService {
  private muteChangeSubject = new BehaviorSubject<number | null>(null);
  readonly muteChange$ = this.muteChangeSubject.asObservable();

  private getStorageKey(conversationId: number): string {
    return `fordago_mute_convo_${conversationId}`;
  }

  /**
   * Checks whether a conversation is currently muted or snoozed.
   */
  isMuted(conversationId: number): boolean {
    if (!conversationId) return false;
    const info = this.getMuteInfo(conversationId);
    return info.isMuted;
  }

  /**
   * Returns detailed mute/snooze info for a conversation.
   */
  getMuteInfo(conversationId: number): ConvoMuteInfo {
    if (!conversationId) {
      return { isMuted: false, isSnoozed: false, mutedUntil: null, label: 'Active' };
    }

    try {
      const raw = localStorage.getItem(this.getStorageKey(conversationId));
      if (!raw) {
        return { isMuted: false, isSnoozed: false, mutedUntil: null, label: 'Active' };
      }

      const parsed = JSON.parse(raw);
      if (parsed.mutedUntil === 'infinite') {
        return {
          isMuted: true,
          isSnoozed: false,
          mutedUntil: 'infinite',
          label: 'Muted until turned on',
        };
      }

      if (typeof parsed.mutedUntil === 'number') {
        const now = Date.now();
        if (now < parsed.mutedUntil) {
          const diffMs = parsed.mutedUntil - now;
          const diffMinutes = Math.ceil(diffMs / (1000 * 60));
          const diffHours = Math.floor(diffMinutes / 60);
          const remainingMin = diffMinutes % 60;

          let timeLabel = '';
          if (diffHours > 0) {
            timeLabel = `${diffHours}h ${remainingMin > 0 ? remainingMin + 'm' : ''}`.trim();
          } else {
            timeLabel = `${diffMinutes}m`;
          }

          return {
            isMuted: true,
            isSnoozed: true,
            mutedUntil: parsed.mutedUntil,
            label: `Snoozed (${timeLabel} left)`,
          };
        } else {
          // Snooze duration expired
          localStorage.removeItem(this.getStorageKey(conversationId));
          void Preferences.remove({ key: this.getStorageKey(conversationId) });
          return { isMuted: false, isSnoozed: false, mutedUntil: null, label: 'Active' };
        }
      }

      return { isMuted: false, isSnoozed: false, mutedUntil: null, label: 'Active' };
    } catch {
      return { isMuted: false, isSnoozed: false, mutedUntil: null, label: 'Active' };
    }
  }

  /**
   * Snoozes notifications for a set number of hours (e.g. 1, 8, 24).
   */
  snooze(conversationId: number, durationHours: number): void {
    if (!conversationId) return;
    const mutedUntil = Date.now() + durationHours * 60 * 60 * 1000;
    const data = JSON.stringify({
      conversationId,
      mutedUntil,
      snoozedAt: Date.now(),
    });
    try {
      localStorage.setItem(this.getStorageKey(conversationId), data);
      void Preferences.set({ key: this.getStorageKey(conversationId), value: data });
    } catch { /* ignore */ }
    this.muteChangeSubject.next(conversationId);
  }

  /**
   * Mutes notifications indefinitely until explicitly turned back on.
   */
  mutePermanently(conversationId: number): void {
    if (!conversationId) return;
    const data = JSON.stringify({
      conversationId,
      mutedUntil: 'infinite',
      mutedAt: Date.now(),
    });
    try {
      localStorage.setItem(this.getStorageKey(conversationId), data);
      void Preferences.set({ key: this.getStorageKey(conversationId), value: data });
    } catch { /* ignore */ }
    this.muteChangeSubject.next(conversationId);
  }

  /**
   * Unmutes the conversation and restores instant push notifications & sounds.
   */
  unmute(conversationId: number): void {
    if (!conversationId) return;
    try {
      localStorage.removeItem(this.getStorageKey(conversationId));
      void Preferences.remove({ key: this.getStorageKey(conversationId) });
    } catch { /* ignore */ }
    this.muteChangeSubject.next(conversationId);
  }
}
