"use client";

import { Check } from "lucide-react";

export type StepStatus = "done" | "active" | "pending";

export function Stepper({
  steps,
}: {
  steps: { label: string; status: StepStatus }[];
}) {
  return (
    <div className="flex items-center w-full mb-2">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center border-2 shrink-0 ${
                step.status === "done"
                  ? "bg-signal-green border-signal-green text-white"
                  : step.status === "active"
                    ? "bg-brand border-brand text-white"
                    : "bg-white border-base-border text-ink-faint"
              }`}
            >
              {step.status === "done" ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <span className="text-xs font-semibold">{i + 1}</span>
              )}
            </div>
            <span
              className={`text-[11px] font-medium whitespace-nowrap ${
                step.status === "pending" ? "text-ink-faint" : "text-ink-secondary"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 mb-4 rounded ${
                step.status === "done" ? "bg-signal-green" : "bg-base-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
