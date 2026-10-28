import * as React from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, X, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GUIDANCE_REGISTRY, GUIDANCE_UI_ENABLED } from '../config/guidance-registry';
import { useCompleteGuidanceMutation, useGuidancesQuery } from '../hooks/use-guidance';
import type { TourStep } from '../types';

interface FeatureGuidanceTourProps {
  feature: string;
  forceOpen?: boolean;
  onClose?: () => void;
  onFinish?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function FeatureGuidanceTour({
  feature,
  forceOpen = false,
  onClose,
  onFinish,
}: FeatureGuidanceTourProps) {
  const config = GUIDANCE_REGISTRY[feature];
  const { data: guidances = [], isLoading } = useGuidancesQuery();
  const completeMutation = useCompleteGuidanceMutation();

  const serverItem = guidances.find((g) => g.guidance === feature);
  const isCompleted = serverItem?.is_completed ?? false;

  // Tour active states
  const [hasDismissed, setHasDismissed] = React.useState(false);
  const [isTourActive, setIsTourActive] = React.useState(false);
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);
  const [targetRect, setTargetRect] = React.useState<TargetRect | null>(null);
  const [isFinishedCelebration, setIsFinishedCelebration] = React.useState(false);

  // If forceOpen is true, directly launch the tour and reset dismissed state
  React.useEffect(() => {
    if (forceOpen && config && config.steps.length > 0) {
      setHasDismissed(false);
      setIsTourActive(true);
      setCurrentStepIndex(0);
    }
  }, [forceOpen, config]);

  // Listen for manual open trigger events from GuidanceTourTrigger
  React.useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ feature?: string }>;
      if (customEvent.detail?.feature === feature && config && config.steps.length > 0) {
        setHasDismissed(false);
        setCurrentStepIndex(0);
        setIsTourActive(true);
      }
    };
    window.addEventListener('open-guidance-tour', handleOpenEvent);
    return () => window.removeEventListener('open-guidance-tour', handleOpenEvent);
  }, [feature, config]);

  // Auto-start tour immediately when loaded and uncompleted
  React.useEffect(() => {
    if (!isLoading && !isCompleted && !hasDismissed && !forceOpen && config && config.steps.length > 0) {
      setIsTourActive(true);
      setCurrentStepIndex(0);
    }
  }, [isLoading, isCompleted, hasDismissed, forceOpen, config]);

  const steps = config?.steps ?? [];
  const currentStep: TourStep | undefined = steps[currentStepIndex];

  const lastScrolledStepRef = React.useRef<number | null>(null);
  const isCompletingRef = React.useRef(false);

  // Update target bounding box
  const updateTargetRect = React.useCallback(() => {
    if (!isTourActive || !currentStep) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(currentStep.target) as HTMLElement | null;
    if (el) {
      if (lastScrolledStepRef.current !== currentStepIndex && typeof el.scrollIntoView === 'function') {
        lastScrolledStepRef.current = currentStepIndex;
        el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null);
    }
  }, [isTourActive, currentStep, currentStepIndex]);

  React.useEffect(() => {
    if (isTourActive) {
      updateTargetRect();
      window.addEventListener('resize', updateTargetRect);
      window.addEventListener('scroll', updateTargetRect, true);
      return () => {
        window.removeEventListener('resize', updateTargetRect);
        window.removeEventListener('scroll', updateTargetRect, true);
      };
    }
  }, [isTourActive, currentStepIndex, updateTargetRect]);

  const handleSkip = React.useCallback(() => {
    setIsTourActive(false);
    setHasDismissed(true);
    setCurrentStepIndex(0);
    setTargetRect(null);
    completeMutation.mutate({
      key: feature,
      payload: { action: 'skip', skipped: true },
    });
    onClose?.();
  }, [completeMutation, feature, onClose]);

  const handleComplete = React.useCallback(() => {
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;
    setHasDismissed(true);
    setIsTourActive(false);
    setIsFinishedCelebration(true);
    completeMutation.mutate({
      key: feature,
      payload: { action: 'complete' },
    });
    setTimeout(() => {
      setIsFinishedCelebration(false);
      isCompletingRef.current = false;
      onFinish?.();
      onClose?.();
    }, 2000);
  }, [completeMutation, feature, onFinish, onClose]);

  const handleNext = React.useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  }, [currentStepIndex, steps.length, handleComplete]);

  const handleNextRef = React.useRef(handleNext);
  handleNextRef.current = handleNext;

  const handlePrev = React.useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  // Listen for task success events (e.g. dispatched from form submissions or operations)
  React.useEffect(() => {
    const handleSuccessEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ feature?: string }>;
      if (customEvent.detail?.feature === feature) {
        if (!isCompleted || isTourActive) {
          handleComplete();
        }
      }
    };
    window.addEventListener('guidance-task-success', handleSuccessEvent);
    return () => window.removeEventListener('guidance-task-success', handleSuccessEvent);
  }, [feature, isCompleted, isTourActive, handleComplete]);

  // Handle ESC key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isTourActive) {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTourActive, handleSkip]);

  // Elevated stacking context for active target & advanceOn event handling
  React.useEffect(() => {
    if (!isTourActive || !currentStep) {
      return;
    }

    interface ElevatedNode {
      el: HTMLElement;
      prevZIndex: string;
      prevPosition: string;
      prevPointerEvents: string;
    }
    const elevatedNodes: ElevatedNode[] = [];

    let advanceCleanup: (() => void) | null = null;
    let isCleanedUp = false;

    const elevateElement = (node: HTMLElement) => {
      if (elevatedNodes.some((item) => item.el === node)) return;
      const prevZ = node.style.zIndex;
      const prevPos = node.style.position;
      const prevPe = node.style.pointerEvents;

      node.classList.add('data-guidance-active-target');
      node.style.zIndex = '51';
      node.style.pointerEvents = 'auto';
      if (
        !node.style.position ||
        (typeof window !== 'undefined' &&
          window.getComputedStyle &&
          window.getComputedStyle(node).position === 'static')
      ) {
        node.style.position = 'relative';
      }
      elevatedNodes.push({
        el: node,
        prevZIndex: prevZ,
        prevPosition: prevPos,
        prevPointerEvents: prevPe,
      });
    };

    const restoreTargets = () => {
      while (elevatedNodes.length > 0) {
        const item = elevatedNodes.pop();
        if (item) {
          item.el.classList.remove('data-guidance-active-target');
          item.el.style.zIndex = item.prevZIndex;
          item.el.style.position = item.prevPosition;
          item.el.style.pointerEvents = item.prevPointerEvents;
        }
      }
    };

    const setupAdvanceOn = () => {
      if (advanceCleanup || !currentStep.advanceOn) return;
      const { type, event: customEventName, target: advanceSelector } = currentStep.advanceOn;

      if (type === 'custom-event' || type === 'mutation-success') {
        const evtName = customEventName || type;
        const handler = () => {
          handleNextRef.current();
        };
        window.addEventListener(evtName, handler, { once: true });
        advanceCleanup = () => {
          window.removeEventListener(evtName, handler);
        };
      } else {
        const selector = advanceSelector || currentStep.target;
        const el = document.querySelector(selector) as HTMLElement | null;
        if (el) {
          const handler = () => {
            handleNextRef.current();
          };
          el.addEventListener(type, handler, { once: true });
          advanceCleanup = () => {
            el.removeEventListener(type, handler);
          };
        }
      }
    };

    const attemptSetup = () => {
      if (isCleanedUp) return;
      const targetEl = document.querySelector(currentStep.target) as HTMLElement | null;
      if (targetEl) {
        elevateElement(targetEl);

        // If target is inside or is a modal dialog, elevate the dialog and portal as well
        const modalEl = (
          targetEl.matches?.('[role="dialog"], [data-guidance$="-modal"], [data-slot="dialog-content"]')
            ? targetEl
            : targetEl.closest?.('[role="dialog"], [data-guidance$="-modal"], [data-slot="dialog-content"]')
        ) as HTMLElement | null;

        if (modalEl && modalEl !== targetEl) {
          elevateElement(modalEl);
        }

        const portalEl = (modalEl || targetEl).closest?.(
          '[data-radix-portal], [data-portal]'
        ) as HTMLElement | null;
        if (portalEl) {
          elevateElement(portalEl);
        }
      }
      setupAdvanceOn();
    };

    attemptSetup();

    // Use MutationObserver in case target mounts dynamically (e.g. Radix Dialog opening)
    const observer = new MutationObserver(() => {
      attemptSetup();
      updateTargetRect();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      isCleanedUp = true;
      observer.disconnect();
      if (advanceCleanup) {
        advanceCleanup();
      }
      restoreTargets();
    };
  }, [isTourActive, currentStepIndex, currentStep, updateTargetRect]);

  if (!config || steps.length === 0) {
    return null;
  }

  const getPopoverCoords = () => {
    if (!targetRect) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const winW = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const winH = typeof window !== 'undefined' ? window.innerHeight : 768;
    const cardWidth = winW < 640 ? 320 : 384;
    const cardHeight = 220;
    const gap = 16;
    const padding = 20;
    const placement = currentStep?.placement ?? 'bottom';

    let top: number;
    let left: number;

    const canFitRight = targetRect.left + targetRect.width + gap + cardWidth + padding <= winW;
    const canFitLeft = targetRect.left - gap - cardWidth >= padding;
    const canFitBottom = targetRect.top + targetRect.height + gap + cardHeight + padding <= winH;
    const canFitTop = targetRect.top - gap - cardHeight >= padding;

    if (placement === 'right') {
      if (canFitRight) {
        left = targetRect.left + targetRect.width + gap;
        top = Math.min(Math.max(padding, targetRect.top), winH - cardHeight - padding);
      } else if (canFitLeft) {
        // Fallback to left side if right doesn't fit
        left = targetRect.left - cardWidth - gap;
        top = Math.min(Math.max(padding, targetRect.top), winH - cardHeight - padding);
      } else if (canFitBottom) {
        // Fallback to below target so it doesn't cover modal inputs
        top = targetRect.top + targetRect.height + gap;
        left = Math.min(Math.max(padding, targetRect.left + (targetRect.width - cardWidth) / 2), winW - cardWidth - padding);
      } else if (canFitTop) {
        // Fallback to above target
        top = targetRect.top - cardHeight - gap;
        left = Math.min(Math.max(padding, targetRect.left + (targetRect.width - cardWidth) / 2), winW - cardWidth - padding);
      } else {
        // Constrained screen width, place along right viewport edge without negative overflow
        top = Math.min(Math.max(padding, targetRect.top), winH - cardHeight - padding);
        left = Math.max(padding, winW - cardWidth - padding);
      }
    } else if (placement === 'left') {
      if (canFitLeft) {
        left = targetRect.left - cardWidth - gap;
        top = Math.min(Math.max(padding, targetRect.top), winH - cardHeight - padding);
      } else if (canFitRight) {
        left = targetRect.left + targetRect.width + gap;
        top = Math.min(Math.max(padding, targetRect.top), winH - cardHeight - padding);
      } else if (canFitBottom) {
        top = targetRect.top + targetRect.height + gap;
        left = Math.min(Math.max(padding, targetRect.left + (targetRect.width - cardWidth) / 2), winW - cardWidth - padding);
      } else if (canFitTop) {
        top = targetRect.top - cardHeight - gap;
        left = Math.min(Math.max(padding, targetRect.left + (targetRect.width - cardWidth) / 2), winW - cardWidth - padding);
      } else {
        top = Math.min(Math.max(padding, targetRect.top), winH - cardHeight - padding);
        left = padding;
      }
    } else if (placement === 'top') {
      if (canFitTop) {
        top = targetRect.top - cardHeight - gap;
      } else if (canFitBottom) {
        top = targetRect.top + targetRect.height + gap;
      } else {
        top = padding;
      }
      left = Math.min(Math.max(padding, targetRect.left), winW - cardWidth - padding);
    } else {
      // Default 'bottom'
      if (canFitBottom) {
        top = targetRect.top + targetRect.height + gap;
      } else if (canFitTop) {
        top = targetRect.top - cardHeight - gap;
      } else {
        top = Math.min(Math.max(padding, targetRect.top + targetRect.height + gap), winH - cardHeight - padding);
      }
      left = Math.min(Math.max(padding, targetRect.left), winW - cardWidth - padding);
    }

    return {
      top: `${top}px`,
      left: `${left}px`,
    };
  };

  // Guidance tour is temporarily disabled on the UI per user request
  if (!GUIDANCE_UI_ENABLED) {
    return null;
  }

  return (
    <>
      {/* 1. Interactive Spotlight Backdrop & Popover Card */}
      {isTourActive &&
        createPortal(
          <>
            {/* Backdrop Layer (z-50) */}
            <div className="fixed inset-0 z-50 pointer-events-auto">
              {/* Dark overlay backdrop with spotlight cutout if target exists */}
              {targetRect ? (
                <div
                  className="fixed inset-0 transition-all duration-300 pointer-events-none"
                  style={{
                    boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.55)`,
                    position: 'fixed',
                    top: targetRect.top - 6,
                    left: targetRect.left - 6,
                    width: targetRect.width + 12,
                    height: targetRect.height + 12,
                    borderRadius: '12px',
                    border: '2px solid hsl(var(--primary))',
                  }}
                />
              ) : (
                <div className="fixed inset-0 bg-black/55 backdrop-blur-[1px]" />
              )}

              {/* Click-blocker for outside areas */}
              <div className="fixed inset-0" onClick={(e) => e.stopPropagation()} />
            </div>

            {/* Popover Step Card (z-[60]) */}
            <div
              className="fixed z-[60] w-80 sm:w-96 rounded-2xl border border-border bg-card p-5 text-card-foreground shadow-2xl animate-in zoom-in-95 duration-200"
              style={getPopoverCoords()}
            >
              <div className="flex items-center justify-between gap-2 border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {currentStepIndex + 1}/{steps.length}
                  </span>
                  <h3 className="font-semibold text-sm">{currentStep?.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  title="Lewati panduan"
                  aria-label="Lewati panduan"
                >
                  <X className="size-4" />
                </button>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {currentStep?.content}
              </p>

              <div className="mt-5 flex items-center justify-between gap-2 pt-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 text-xs text-muted-foreground"
                  onClick={handleSkip}
                >
                  Lewati
                </Button>

                <div className="flex items-center gap-2">
                  {currentStepIndex > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs"
                      onClick={handlePrev}
                    >
                      <ChevronLeft className="size-3.5 mr-1" />
                      Sebelumnya
                    </Button>
                  )}
                  <Button size="sm" className="h-8 text-xs font-medium" onClick={handleNext}>
                    {currentStepIndex === steps.length - 1 ? (
                      <>
                        <CheckCircle2 className="size-3.5 mr-1" />
                        Selesai
                      </>
                    ) : (
                      <>
                        Selanjutnya
                        <ChevronRight className="size-3.5 ml-1" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>,
          document.body
        )}

      {/* 3. Celebration Popover Toast */}
      {isFinishedCelebration &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-[70] animate-in fade-in slide-in-from-bottom-5 duration-300">
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-card p-4 shadow-xl text-foreground">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Panduan Selesai! 🎉</p>
                <p className="text-xs text-muted-foreground">
                  Langkah untuk {config.title.toLowerCase()} telah dicatat.
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/**
 * Replay Trigger Button
 * Can be placed in headers or action bars on any feature page.
 * Dispatches an event to the page's FeatureGuidanceTour instance without duplicate rendering.
 */
export function GuidanceTourTrigger({
  feature,
  className = '',
  label = 'Lihat Panduan',
}: {
  feature: string;
  className?: string;
  label?: string;
}) {
  const handleOpen = () => {
    window.dispatchEvent(
      new CustomEvent('open-guidance-tour', { detail: { feature } })
    );
  };

  // Guidance tour trigger is temporarily disabled on the UI per user request
  if (!GUIDANCE_UI_ENABLED) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground ${className}`}
      onClick={handleOpen}
    >
      <HelpCircle className="size-3.5" />
      <span>{label}</span>
    </Button>
  );
}
