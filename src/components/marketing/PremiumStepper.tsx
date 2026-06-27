"use client";

type Step = { id: string; label: string };

type PremiumStepperProps = {
  steps: Step[];
  current: string;
};

export function PremiumStepper({ steps, current }: PremiumStepperProps) {
  const currentIdx = Math.max(0, steps.findIndex((s) => s.id === current));
  const progress = ((currentIdx + 1) / steps.length) * 100;

  return (
    <div className="mv-premium-stepper">
      <div className="mv-premium-stepper-labels">
        {steps.map((step, i) => {
          const done = i < currentIdx;
          const active = step.id === current;
          return (
            <span
              key={step.id}
              className={`mv-premium-stepper-label ${active ? "is-active" : ""} ${done ? "is-done" : ""}`}
            >
              {step.label}
            </span>
          );
        })}
      </div>
      <div className="mv-premium-stepper-track" aria-hidden>
        <div className="mv-premium-stepper-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}