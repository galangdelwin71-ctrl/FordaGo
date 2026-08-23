import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonSpinner } from '@ionic/angular/standalone';

export interface RefreshEvent {
  complete: () => void;
  target: {
    complete: () => void;
  };
}

@Component({
  selector: 'app-pull-to-refresh',
  standalone: true,
  imports: [CommonModule, IonSpinner],
  template: `
    <div
      *ngIf="isPulling || isRefreshing"
      class="fordago-ptr-container"
      [class.ptr-refreshing]="isRefreshing"
      [style.transform]="containerTransform"
      [style.opacity]="containerOpacity"
    >
      <div class="fordago-ptr-spinner-wrap">
        <ion-spinner name="crescent" class="fordago-ptr-spinner"></ion-spinner>
      </div>
    </div>
  `,
  styleUrls: ['./pull-to-refresh.component.scss'],
})
export class PullToRefreshComponent implements OnInit, OnDestroy {
  @Output() refresh = new EventEmitter<RefreshEvent>();
  @Input() threshold = 45;

  isPulling = false;
  isRefreshing = false;
  pullDistance = 0;

  private startY = 0;
  private currentY = 0;
  private isTracking = false;
  private autoTimeoutId: any = null;
  private scrollEl: HTMLElement | null = null;
  private hostContainer: HTMLElement | null = null;

  private touchStartListener?: (e: TouchEvent) => void;
  private touchMoveListener?: (e: TouchEvent) => void;
  private touchEndListener?: (e: TouchEvent) => void;

  constructor(
    private el: ElementRef,
    private ngZone: NgZone
  ) {}

  get containerTransform(): string {
    if (this.isRefreshing) {
      return 'translate(-50%, 16px)';
    }
    if (this.isPulling && this.pullDistance > 0) {
      const topOffset = Math.min(22, (this.pullDistance * 0.45) - 20);
      return `translate(-50%, ${topOffset}px)`;
    }
    return 'translate(-50%, -40px)';
  }

  get containerOpacity(): number {
    if (this.isRefreshing) return 1;
    if (this.isPulling && this.pullDistance > 6) {
      return Math.min(1, this.pullDistance / this.threshold);
    }
    return 0;
  }

  async ngOnInit(): Promise<void> {
    const ionContent = this.el.nativeElement.closest('ion-content');
    if (ionContent) {
      if ('getScrollElement' in (ionContent as any)) {
        try {
          this.scrollEl = await (ionContent as any).getScrollElement();
        } catch {
          this.scrollEl = ionContent;
        }
      } else {
        this.scrollEl = ionContent;
      }
    } else {
      this.scrollEl = this.el.nativeElement.closest('.panel-content, .admin-content, .reports-content') || this.el.nativeElement.parentElement;
    }

    this.hostContainer = this.el.nativeElement.closest('.ion-page, app-coaching-panel, ion-content') || this.el.nativeElement.parentElement;

    this.attachTouchListeners();
  }

  ngOnDestroy(): void {
    if (this.autoTimeoutId) {
      clearTimeout(this.autoTimeoutId);
    }
    this.detachTouchListeners();
  }

  private getScrollTop(): number {
    if (this.scrollEl) {
      return this.scrollEl.scrollTop || 0;
    }
    const parent = this.el.nativeElement.closest('.panel-content, ion-content, .scroll-wrap, .content-inner');
    if (parent) {
      return (parent as HTMLElement).scrollTop || 0;
    }
    return window.scrollY || document.documentElement.scrollTop || 0;
  }

  private attachTouchListeners(): void {
    this.touchStartListener = (e: TouchEvent) => {
      if (this.isRefreshing) return;
      if (!e.touches || e.touches.length === 0) return;

      const touchTarget = e.target as HTMLElement;
      if (this.hostContainer && !this.hostContainer.contains(touchTarget) && !this.el.nativeElement.contains(touchTarget)) {
        this.isTracking = false;
        return;
      }

      const scrollTop = this.getScrollTop();
      if (scrollTop <= 4) {
        this.startY = e.touches[0].clientY;
        this.currentY = this.startY;
        this.isTracking = true;
      } else {
        this.isTracking = false;
      }
    };

    this.touchMoveListener = (e: TouchEvent) => {
      if (!this.isTracking || this.isRefreshing) return;
      if (!e.touches || e.touches.length === 0) return;

      const scrollTop = this.getScrollTop();
      if (scrollTop > 4) {
        this.isTracking = false;
        this.ngZone.run(() => {
          this.isPulling = false;
          this.pullDistance = 0;
        });
        return;
      }

      this.currentY = e.touches[0].clientY;
      const rawDistance = this.currentY - this.startY;

      if (rawDistance > 6) {
        this.ngZone.run(() => {
          this.isPulling = true;
          this.pullDistance = rawDistance;
        });
      }
    };

    this.touchEndListener = () => {
      if (!this.isTracking || this.isRefreshing) {
        this.isTracking = false;
        return;
      }

      this.isTracking = false;
      if (this.pullDistance >= this.threshold) {
        this.ngZone.run(() => {
          this.triggerRefresh();
        });
      } else {
        this.ngZone.run(() => {
          this.isPulling = false;
          this.pullDistance = 0;
        });
      }
    };

    window.addEventListener('touchstart', this.touchStartListener, { passive: true });
    window.addEventListener('touchmove', this.touchMoveListener, { passive: true });
    window.addEventListener('touchend', this.touchEndListener, { passive: true });
    window.addEventListener('touchcancel', this.touchEndListener, { passive: true });
  }

  private detachTouchListeners(): void {
    if (this.touchStartListener) {
      window.removeEventListener('touchstart', this.touchStartListener);
    }
    if (this.touchMoveListener) {
      window.removeEventListener('touchmove', this.touchMoveListener);
    }
    if (this.touchEndListener) {
      window.removeEventListener('touchend', this.touchEndListener);
      window.removeEventListener('touchcancel', this.touchEndListener);
    }
  }

  private triggerRefresh(): void {
    this.isRefreshing = true;
    this.isPulling = false;

    const completeFn = () => {
      if (this.autoTimeoutId) {
        clearTimeout(this.autoTimeoutId);
        this.autoTimeoutId = null;
      }
      this.ngZone.run(() => {
        this.isRefreshing = false;
        this.pullDistance = 0;
      });
    };

    const event: RefreshEvent = {
      complete: completeFn,
      target: {
        complete: completeFn,
      },
    };

    // Quick auto-dismiss safety fallback so it NEVER stays stuck
    this.autoTimeoutId = setTimeout(() => {
      completeFn();
    }, 750);

    this.refresh.emit(event);
  }
}
