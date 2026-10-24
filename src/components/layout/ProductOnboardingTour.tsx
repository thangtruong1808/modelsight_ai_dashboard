import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Dialog as RadixDialog } from 'radix-ui';
import {
  Activity,
  Check,
  ChevronLeft,
  ChevronRight,
  Gauge,
  Scale,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

export interface TourStep {
  title: string;
  badge: string;
  description: string;
  path: string;
  highlightText: string;
  icon: typeof Sparkles;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Executive KPI Fleet & Observability Overview',
    badge: 'Phase 2 & 3 • Data Layer',
    description:
      'Explore live aggregate health, p95 tail latencies, error breakdowns, and multi-resolution time-series for 14 production models. Everything is bidirectionally synced to URL search parameters for instant link sharing.',
    path: '/',
    highlightText:
      'Look at the top KPI row with animated counters and light/dark themed ECharts sparklines.',
    icon: Activity,
  },
  {
    title: 'Reactive Alert Rules Builder & Historical Backtester',
    badge: 'Phase 5 • SLA Governance',
    description:
      'Define production SLA rules with schema validation (Zod + React Hook Form). The live backtesting chart computes historical metric values and displays exact firing zones (markArea) and counts before deploying.',
    path: '/alerts/rules',
    highlightText:
      'Change the threshold slider in the builder to see the live chart update markLine and firing zones instantly.',
    icon: Zap,
  },
  {
    title: 'High-Density 10,000-Row Virtualized Logs Explorer',
    badge: 'Phase 6 • TanStack Virtual',
    description:
      'Scroll smoothly through 10,000+ realistic inference request logs at 60fps. Inspect raw request/response payloads, formatted prompt/completion chat bubbles, and copy reproducible cURL commands.',
    path: '/logs',
    highlightText:
      'Use your keyboard Up/Down arrow keys while the side drawer is open to step through logs in real time.',
    icon: Terminal,
  },
  {
    title: 'Side-by-Side Model Benchmarking & Comparison Matrix',
    badge: 'Phase 7 • Model Benchmarking',
    description:
      'Select any 2 to 4 models to compare head-to-head. Evaluates synchronized telemetry curves, a normalized 5-axis Radar profile, and highlights the best (emerald) and worst (rose) model for every metric.',
    path: '/comparison',
    highlightText:
      'Click the Quick Presets to benchmark flagship LLMs or compare tabular fraud classifiers side-by-side.',
    icon: Scale,
  },
  {
    title: 'Instant Network & Chaos Simulator',
    badge: 'Phase 1 • Resilient UX',
    description:
      'Test designed loading skeletons, empty states, and optimistic rollbacks on demand. Located directly in the topbar status pill or the Settings page for instant evaluator testing.',
    path: '/settings',
    highlightText:
      'Click the topbar simulator pill or visit Settings to inject 100% API error rates or test offline boundaries.',
    icon: Gauge,
  },
];

const TOUR_STORAGE_KEY = 'modelsight_tour_seen';

export function ProductOnboardingTour({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const currentStep = TOUR_STEPS[currentStepIndex]!;
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      navigate(TOUR_STEPS[nextIndex]!.path);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      navigate(TOUR_STEPS[prevIndex]!.path);
    }
  };

  const handleComplete = () => {
    try {
      window.localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    } catch {
      // Ignore
    }
    onClose();
  };

  return (
    <RadixDialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs" />
        <RadixDialog.Content
          aria-describedby="tour-desc"
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-strong bg-bg-surface p-6 shadow-float focus:outline-none animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-accent-primary/10 px-2 py-0.5 text-[11px] font-mono font-bold text-accent-primary">
                {currentStep.badge}
              </span>
              <span className="text-xs text-text-muted font-mono">
                Step {currentStepIndex + 1} of {TOUR_STEPS.length}
              </span>
            </div>

            <RadixDialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Skip tour"
                className="h-7 w-7 text-text-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </RadixDialog.Close>
          </div>

          {/* Body Content */}
          <div className="mt-4 space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-accent-primary to-accent-cyan text-white shadow-xs">
                <Icon className="h-5 w-5" />
              </div>

              <div>
                <RadixDialog.Title className="text-base font-bold text-text-primary">
                  {currentStep.title}
                </RadixDialog.Title>
                <p id="tour-desc" className="mt-1 text-xs text-text-secondary leading-relaxed">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Showcase Highlight Callout */}
            <div className="rounded-xl border border-accent-primary/30 bg-accent-primary/5 p-3 text-xs text-text-primary flex items-start gap-2.5">
              <Sparkles className="h-4 w-4 text-accent-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-semibold text-accent-primary">Reviewer Tip: </strong>
                {currentStep.highlightText}
              </p>
            </div>
          </div>

          {/* Navigation Controls & Progress Dots */}
          <div className="mt-6 flex items-center justify-between border-t border-border-subtle pt-4">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setCurrentStepIndex(idx);
                    navigate(TOUR_STEPS[idx]!.path);
                  }}
                  className={cn(
                    'h-2 rounded-full transition-all cursor-pointer',
                    idx === currentStepIndex
                      ? 'w-6 bg-accent-primary'
                      : 'w-2 bg-bg-subtle hover:bg-border-strong'
                  )}
                  aria-label={`Go to tour step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Previous
              </Button>

              <Button variant="primary" size="sm" onClick={handleNext} className="text-xs gap-1">
                <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next'}</span>
                {currentStepIndex === TOUR_STEPS.length - 1 ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
