import { useEffect, useState } from 'react';

export interface TourStep {
  id: string;
  selector: string;
  title: string;
  description: string;
}

interface TourOverlayProps {
  open: boolean;
  steps: TourStep[];
  refreshKey?: string;
  onSkip: () => void;
  onComplete: () => void;
  onStepChange?: (step: TourStep, index: number) => void;
}

interface HighlightBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function TourOverlay(props: TourOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [highlight, setHighlight] = useState<HighlightBox | null>(null);

  useEffect(() => {
    if (!props.open) {
      setStepIndex(0);
      return;
    }

    const updateHighlight = () => {
      const selector = props.steps[stepIndex]?.selector;

      if (!selector) {
        setHighlight(null);
        return;
      }

      const target = document.querySelector(selector);

      if (!target) {
        setHighlight(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      setHighlight({
        top: rect.top - 10,
        left: rect.left - 10,
        width: rect.width + 20,
        height: rect.height + 20,
      });
    };

    updateHighlight();
    window.addEventListener('resize', updateHighlight);
    window.addEventListener('scroll', updateHighlight, true);

    return () => {
      window.removeEventListener('resize', updateHighlight);
      window.removeEventListener('scroll', updateHighlight, true);
    };
  }, [props.open, props.refreshKey, props.steps, stepIndex]);

  useEffect(() => {
    if (!props.open) {
      return;
    }

    const step = props.steps[stepIndex];

    if (step) {
      props.onStepChange?.(step, stepIndex);
    }
  }, [props.open, props.onStepChange, props.steps, stepIndex]);

  if (!props.open) {
    return null;
  }

  const step = props.steps[stepIndex];

  if (!step) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-ink-900/62 backdrop-blur-[2px]" />
      {highlight ? (
        <div
          className="absolute rounded-[2rem] border-2 border-coral-500 shadow-[0_0_0_9999px_rgba(22,23,19,0.28)] transition-all"
          style={{
            top: highlight.top,
            left: highlight.left,
            width: highlight.width,
            height: highlight.height,
          }}
        />
      ) : null}

      <div className="absolute inset-x-4 bottom-4 mx-auto max-w-lg rounded-[1.5rem] border border-white/15 bg-ink-900/94 p-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-white/55">
          Step {stepIndex + 1} of {props.steps.length}
        </div>
        <h3 className="font-display text-[2rem]">{step.title}</h3>
        <p className="mt-2 text-sm leading-6 text-white/78">{step.description}</p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={props.onSkip}
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white/78 transition hover:border-white/35 hover:text-white"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((value) => Math.max(value - 1, 0))}
              disabled={stepIndex === 0}
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-45"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                if (stepIndex === props.steps.length - 1) {
                  props.onComplete();
                  setStepIndex(0);
                  return;
                }

                setStepIndex((value) => value + 1);
              }}
              className="rounded-full bg-coral-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral-600"
            >
              {stepIndex === props.steps.length - 1 ? 'Done' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
