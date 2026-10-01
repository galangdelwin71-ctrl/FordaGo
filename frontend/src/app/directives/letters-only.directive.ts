import { Directive, HostListener, ElementRef, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * [appLettersOnly]
 * Prevents numeric digits (0-9) from being typed, pasted, or input into text fields
 * meant strictly for names (First Name, Last Name, etc.).
 * Allows letters (including accented / international characters like Ñ, ñ),
 * spaces, hyphens, and apostrophes.
 */
@Directive({
  selector: '[appLettersOnly]',
  standalone: true,
})
export class LettersOnlyDirective {
  constructor(
    private elementRef: ElementRef,
    @Optional() @Self() private control?: NgControl
  ) {}

  private sanitize(value: unknown): string {
    return String(value ?? '').replace(/[0-9]/g, '');
  }

  private syncHostValue(value: string): void {
    const host: any = this.elementRef.nativeElement;
    if (host && typeof host.value !== 'undefined') {
      host.value = value;
    }
    const innerInput = host?.querySelector?.('input');
    if (innerInput) {
      innerInput.value = value;
    }
  }

  private applyValue(raw: unknown): void {
    const sanitized = this.sanitize(raw);
    if (this.control?.control && this.control.control.value !== sanitized) {
      this.control.control.setValue(sanitized, { emitEvent: false });
    }
    this.syncHostValue(sanitized);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key && event.key.length === 1 && /[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    if (event.key && /[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (/[0-9]/.test(pasted)) {
      event.preventDefault();
      const clean = this.sanitize(pasted);
      const host: any = this.elementRef.nativeElement;
      const target = (host?.querySelector?.('input') || host) as HTMLInputElement;
      if (target && typeof target.selectionStart === 'number') {
        const start = target.selectionStart;
        const end = target.selectionEnd ?? start;
        const current = target.value || '';
        const updated = current.slice(0, start) + clean + current.slice(end);
        this.applyValue(updated);
      } else {
        this.applyValue(clean);
      }
    }
  }

  @HostListener('ionInput', ['$event'])
  onIonInput(event: any): void {
    this.applyValue(event?.detail?.value ?? '');
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.applyValue(target?.value ?? '');
  }
}
