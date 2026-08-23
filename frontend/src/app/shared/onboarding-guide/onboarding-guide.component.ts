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
  private updateTimeout: any = null;

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
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    if (this.updateTimeout) clearTimeout(this.updateTimeout);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isVisible) {
      this.calculatePositions();
    }
  }

  @HostListener('window:scroll', ['$event'])
  onScroll(): void {
    if (this.isVisible) {
      this.calculatePositions();
    }
  }

  private syncCurrentStep(): void {
    this.currentStep = this.onboardingService.currentStep;
    this.totalSteps = this.onboardingService.totalSteps;
    if (!this.currentStep) return;

    if (this.updateTimeout) clearTimeout(this.updateTimeout);

    // Initial position calculation, then re-calculate after scrolling
    this.scrollToTarget();
    this.updateTimeout = setTimeout(() => {
      this.calculatePositions();
      this.cdr.detectChanges();
    }, 250);
  }

  private scrollToTarget(): void {
    if (!this.currentStep?.targetId) return;

    const el = document.querySelector(this.currentStep.targetId) as HTMLElement;
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });
    }
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
        top: Math.max(20, (viewportHeight - 220) / 2),
        left: 16,
        arrowPosition: 'none',
        arrowOffset: 50,
      };
      return;
    }

    const rect = targetEl.getBoundingClientRect();
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

    // Calculate Tooltip position (above or below)
    const margin = 14;
    const tooltipWidth = Math.min(viewportWidth - 32, 380);
    const estimatedTooltipHeight = 210;

    const spaceBelow = viewportHeight - (spotTop + spotHeight);
    const spaceAbove = spotTop;

    let placeBelow = true;
    if (this.currentStep.position === 'top') {
      placeBelow = false;
    } else if (this.currentStep.position === 'bottom') {
      placeBelow = true;
    } else {
      // Auto placement
      placeBelow = spaceBelow >= estimatedTooltipHeight || spaceBelow >= spaceAbove;
    }

    let tooltipTop = 0;
    let arrowPos: 'top' | 'bottom' | 'none' = 'top';

    if (placeBelow) {
      tooltipTop = spotTop + spotHeight + margin;
      arrowPos = 'top';
      // If overflows bottom of viewport, clamp it
      if (tooltipTop + estimatedTooltipHeight > viewportHeight - 16) {
        tooltipTop = Math.max(16, viewportHeight - estimatedTooltipHeight - 16);
      }
    } else {
      tooltipTop = spotTop - estimatedTooltipHeight - margin;
      arrowPos = 'bottom';
      // If overflows top of viewport, clamp it
      if (tooltipTop < 16) {
        tooltipTop = 16;
      }
    }

    // Horizontal centering relative to spotlight or screen
    let tooltipLeft = (viewportWidth - tooltipWidth) / 2;
    tooltipLeft = Math.max(16, Math.min(tooltipLeft, viewportWidth - tooltipWidth - 16));

    // Arrow offset pointing to target center
    const targetCenterX = rect.left + rect.width / 2;
    const relativeArrowX = targetCenterX - tooltipLeft;
    const arrowOffset = Math.max(20, Math.min(relativeArrowX, tooltipWidth - 20));

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
