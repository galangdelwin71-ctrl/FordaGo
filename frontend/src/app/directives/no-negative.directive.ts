import { Directive, HostListener, Input, ElementRef, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appNoNegative]',
  standalone: true
})
export class NoNegativeDirective {
  @Input() min: number = 0;
  constructor(
    private elementRef: ElementRef,
    @Optional() @Self() private control?: NgControl
  ) {}

  private sanitize(value: unknown): string {
    return String(value ?? '').replace(/[+\-eE]/g, '');
  }

  private enforceMin(value: string): string {
    if (!value || isNaN(Number(value))) return value;
    return Number(value) < this.min ? String(this.min) : value;
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
    const next = this.enforceMin(this.sanitize(raw));
    if (this.control?.control) {
      this.control.control.setValue(next, { emitEvent: false });
    }
    this.syncHostValue(next);
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
    }
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === '-' || event.key === '+' || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
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

  @HostListener('blur')
  onBlur(): void {
    const current = this.control?.control?.value ?? (this.elementRef.nativeElement as any)?.value ?? '';
    this.applyValue(current);
  }
}
