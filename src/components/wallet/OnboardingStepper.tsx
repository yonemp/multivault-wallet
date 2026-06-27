"use client";

import { Check } from "lucide-react";

type Step = { id: string; label: string };

type OnboardingStepperProps = {
  steps: Step[];
  current: string;
};

export function OnboardingStepper({ steps, current }: OnboardingStepperProps) {
  const currentIdx = steps.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const done = i < currentIdx;
        const active = step.id === current;
        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition ${
                  done
                    ? "border-[var(--gain)] bg-[var(--gain-soft)] text-[var(--gain)]"
                    : active
                      ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-[9px] font-semibold sm:block ${active ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-2 h-px w-8 sm:w-12 ${done ? "bg-[var(--gain)]" : "bg-[var(--border)]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}