import { Directive, HostListener, Input, ElementRef, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[appNoNegative]',
  standalone: true
})
export class NoNegativeDirective {
  private _min: number = 0;

  @Input()
  set min(value: number | string | undefined | null) {
    if (value != null && value !== '') {
      const parsed = Number(value);
      this._min = isNaN(parsed) ? 0 : parsed;
    } else {
      this._min = 0;
    }
  }
  get min(): number {
    return this._min;
  }
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

  private applyValue(raw: unknown, enforceMinimum = false): void {
    const sanitized = this.sanitize(raw);
    const next = enforceMinimum ? this.enforceMin(sanitized) : sanitized;
    if (this.control?.control && this.control.control.value !== next) {
      this.control.control.setValue(next === '' ? null : (isNaN(Number(next)) ? next : Number(next)), { emitEvent: false });
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
    this.applyValue(event?.detail?.value ?? '', false);
  }

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.applyValue(target?.value ?? '', false);
  }

  @HostListener('blur')
  onBlur(): void {
    const current = this.control?.control?.value ?? (this.elementRef.nativeElement as any)?.value ?? '';
    this.applyValue(current, true);
  }
}
