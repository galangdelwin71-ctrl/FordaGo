import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ChangeDetectorRef,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { OnboardingService, TourStep } from '../../services/onboarding.service';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
  radius: number;
  visible: boolean;
}

interface TooltipPos {
  top: number;
  left: number;
  arrowPosition: 'top' | 'bottom' | 'none';
  arrowOffset: number;
}

@Component({
  selector: 'app-onboarding-guide',
  templateUrl: './onboarding-guide.component.html',
  styleUrls: ['./onboarding-guide.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon],
})
export class OnboardingGuideComponent implements OnInit, OnDestroy {
  @ViewChild('tooltipCard') tooltipCardRef?: ElementRef<HTMLElement>;

  isVisible = false;
  currentStep: TourStep | null = null;
  stepIndex = 0;
  totalSteps = 0;

  spotlight: SpotlightRect = {
    top: 0,
    left: 0,
    width: 0,
    height: 0,
    radius: 16,
    visible: false,
  };

  tooltipPos: TooltipPos = {
    top: 0,
    left: 16,
    arrowPosition: 'top',
    arrowOffset: 50,
  };

  private subs: Subscription[] = [];
  private updateTimeouts: any[] = [];
  private scrollUnlisten?: () => void;

  constructor(
    public onboardingService: OnboardingService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subs.push(
      this.onboardingService.isVisible$.subscribe((visible) => {
        this.isVisible = visible;
        if (visible) {
          this.syncCurrentStep();
        } else {
          this.spotlight.visible = false;
        }
        this.cdr.detectChanges();
      })
    );

    this.subs.push(
      this.onboardingService.currentStepIndex$.subscribe((index) => {
        this.stepIndex = index;
        if (this.isVisible) {
          this.syncCurrentStep();
        }
        this.cdr.detectChanges();
      })
    );

    // Global passive scroll listener (captures scrolls inside panel-content, ion-content, modals, etc.)
    const onGlobalScroll = () => {
      if (this.isVisible) {
        requestAnimationFrame(() => this.calculatePositions());
      }
    };
    window.addEventListener('scroll', onGlobalScroll, { capture: true, passive: true });
    this.scrollUnlisten = () => {
      window.removeEventListener('scroll', onGlobalScroll, { capture: true });
    };
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.clearAllTimeouts();
    if (this.scrollUnlisten) {
      this.scrollUnlisten();
    }
  }

  private clearAllTimeouts(): void {
    this.updateTimeouts.forEach((t) => clearTimeout(t));
    this.updateTimeouts = [];
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isVisible) {
      this.calculatePositions();
    }
  }

  private animationFrameId: number | null = null;

  private syncCurrentStep(): void {
    this.currentStep = this.onboardingService.currentStep;
    this.totalSteps = this.onboardingService.totalSteps;
    if (!this.currentStep) return;

    this.clearAllTimeouts();

    // 1. Auto-scroll target into the comfortable center of the viewport/container
    this.scrollToTarget();

    // 2. Continuous RAF tracking for 800ms so spotlight and tooltip track smoothly during scroll animation
    this.trackScrollAnimation(850);
  }

  private scrollToTarget(): void {
    if (!this.currentStep?.targetId) return;

    const el = document.querySelector(this.currentStep.targetId) as HTMLElement;
    if (!el) return;

    // Standard DOM scrollIntoView with center alignment
    try {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    } catch {
      // Fallback if smooth scroll is not supported
      el.scrollIntoView(true);
    }

    // Support Ionic ion-content and custom scrollable modals
    const ionContent = el.closest('ion-content');
    if (ionContent && typeof (ionContent as any).getScrollElement === 'function') {
      (ionContent as any).getScrollElement().then((scrollEl: HTMLElement) => {
        if (scrollEl) {
          const elRect = el.getBoundingClientRect();
          const scrollRect = scrollEl.getBoundingClientRect();
          const currentScroll = scrollEl.scrollTop;
          const targetY = currentScroll + (elRect.top - scrollRect.top) - (scrollRect.height / 2) + (elRect.height / 2);
          scrollEl.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        }
      }).catch(() => {});
    }

    // Support custom scrollable parent containers (e.g. modal-sheet, dialogs, overflow divs)
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent);
      const isScrollable = (style.overflowY === 'auto' || style.overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight;
      if (isScrollable) {
        const elRect = el.getBoundingClientRect();
        const parentRect = parent.getBoundingClientRect();
        const currentScroll = parent.scrollTop;
        const targetY = currentScroll + (elRect.top - parentRect.top) - (parentRect.height / 2) + (elRect.height / 2);
        parent.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
        break;
      }
      parent = parent.parentElement;
    }
  }

  private trackScrollAnimation(durationMs = 850): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const startTime = performance.now();
    const step = (currentTime: number) => {
      this.calculatePositions();
      this.cdr.detectChanges();
      if (currentTime - startTime < durationMs && this.isVisible) {
        this.animationFrameId = requestAnimationFrame(step);
      } else {
        this.animationFrameId = null;
        // Final settle check
        this.calculatePositions();
        this.cdr.detectChanges();
      }
    };
    this.animationFrameId = requestAnimationFrame(step);
  }

  calculatePositions(): void {
    if (!this.currentStep) return;

    const targetEl = document.querySelector(this.currentStep.targetId) as HTMLElement;
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    if (!targetEl) {
      // Fallback: center in viewport if target not found
      this.spotlight = {
        top: viewportHeight / 2 - 40,
        left: viewportWidth / 2 - 40,
        width: 80,
        height: 80,
        radius: 20,
        visible: false,
      };
      this.tooltipPos = {
        top: Math.max(20, (viewportHeight - 200) / 2),
        left: 16,
        arrowPosition: 'none',
        arrowOffset: 50,
      };
      return;
    }

    const rect = targetEl.getBoundingClientRect();

    // If target has zero dimensions (e.g. hidden/display:none), hide spotlight
    if (rect.width <= 0 || rect.height <= 0) {
      this.spotlight.visible = false;
      return;
    }

    const padding = 8;
    const spotTop = Math.max(0, rect.top - padding);
    const spotLeft = Math.max(0, rect.left - padding);
    const spotWidth = rect.width + padding * 2;
    const spotHeight = rect.height + padding * 2;

    // Detect border radius of the target element
    const computedStyle = window.getComputedStyle(targetEl);
    let radius = parseInt(computedStyle.borderRadius || '16', 10);
    if (isNaN(radius) || radius < 12) radius = 16;
    if (radius > 50) radius = 999;

    this.spotlight = {
      top: spotTop,
      left: spotLeft,
      width: spotWidth,
      height: spotHeight,
      radius,
      visible: true,
    };

    // Calculate Tooltip position with guaranteed collision avoidance & viewport safety
    const margin = 14;
    const tooltipWidth = Math.min(viewportWidth - 32, 380);
    const estimatedTooltipHeight = this.tooltipCardRef?.nativeElement?.offsetHeight || 195;

    const spaceBelow = viewportHeight - (spotTop + spotHeight);
    const spaceAbove = spotTop;

    let placeBelow = true;
    if (this.currentStep.position === 'top') {
      placeBelow = false;
      // If not enough room on top (< tooltip height + margin), but more room below, flip to bottom
      if (spaceAbove < estimatedTooltipHeight + margin && spaceBelow > spaceAbove) {
        placeBelow = true;
      }
    } else if (this.currentStep.position === 'bottom') {
      placeBelow = true;
      // If not enough room on bottom, but more room on top, flip to top
      if (spaceBelow < estimatedTooltipHeight + margin && spaceAbove > spaceBelow) {
        placeBelow = false;
      }
    } else {
      // Auto: place where there is more available screen space
      placeBelow = spaceBelow >= spaceAbove;
    }

    let tooltipTop = 0;
    let arrowPos: 'top' | 'bottom' | 'none' = 'top';

    if (placeBelow) {
      tooltipTop = spotTop + spotHeight + margin;
      arrowPos = 'top';

      // Keep tooltip within visible viewport bounds without obscuring the spotlight
      if (tooltipTop + estimatedTooltipHeight > viewportHeight - 12) {
        const adjustedTop = viewportHeight - estimatedTooltipHeight - 12;
        if (adjustedTop > spotTop + spotHeight) {
          tooltipTop = adjustedTop;
        } else if (spaceAbove >= estimatedTooltipHeight + margin) {
          // Flip to top if bottom overflows
          placeBelow = false;
          tooltipTop = spotTop - estimatedTooltipHeight - margin;
          arrowPos = 'bottom';
        } else {
          tooltipTop = Math.max(12, adjustedTop);
        }
      }
    } else {
      tooltipTop = spotTop - estimatedTooltipHeight - margin;
      arrowPos = 'bottom';

      // Keep tooltip within visible viewport bounds without obscuring the spotlight
      if (tooltipTop < 12) {
        const adjustedTop = 12;
        if (adjustedTop + estimatedTooltipHeight < spotTop) {
          tooltipTop = adjustedTop;
        } else if (spaceBelow >= estimatedTooltipHeight + margin) {
          // Flip to bottom if top overflows
          placeBelow = true;
          tooltipTop = spotTop + spotHeight + margin;
          arrowPos = 'top';
        } else {
          tooltipTop = Math.max(12, adjustedTop);
        }
      }
    }

    // Horizontal centering relative to spotlight or screen
    let tooltipLeft = (viewportWidth - tooltipWidth) / 2;
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, viewportWidth - tooltipWidth - 16));

    // Arrow offset pointing to target center
    const targetCenterX = rect.left + rect.width / 2;
    const relativeArrowX = targetCenterX - tooltipLeft;
    const arrowOffset = Math.max(24, Math.min(relativeArrowX, tooltipWidth - 24));

    this.tooltipPos = {
      top: tooltipTop,
      left: tooltipLeft,
      arrowPosition: arrowPos,
      arrowOffset,
    };
  }

  onNext(): void {
    this.onboardingService.nextStep();
  }

  onPrev(): void {
    this.onboardingService.prevStep();
  }

  onSkip(): void {
    this.onboardingService.skipTour();
  }

  isLastStep(): boolean {
    return this.stepIndex >= this.totalSteps - 1;
  }
}
