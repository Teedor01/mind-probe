"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { GhostButton } from "@/components/Shell";

type NavKey =
  | "start"
  | "learn"
  | "explain"
  | "probe"
  | "intervention"
  | "retest"
  | "progress";

const NAV_ITEMS: { key: NavKey; label: string; sub: string; icon: (props: { active: boolean }) => JSX.Element }[] = [
  { key: "start", label: "Start", sub: "Begin a new session", icon: StartIcon },
  { key: "learn", label: "Learn", sub: "Read the concept chain", icon: LearnIcon },
  { key: "explain", label: "Explain", sub: "Explain in your own words", icon: ExplainIcon },
  { key: "probe", label: "Probe", sub: "Socratic questions", icon: ProbeIcon },
  { key: "intervention", label: "Intervention", sub: "Targeted correction", icon: InterventionIcon },
  { key: "retest", label: "Retest", sub: "One last check", icon: RetestIcon },
  { key: "progress", label: "Progress", sub: "See your results", icon: ProgressIcon },
];

const STEP_KEYS: NavKey[] = ["learn", "explain", "probe", "intervention", "retest", "progress"];
const STEP_LABELS = ["Learn", "Explain", "Probe", "Intervention", "Retest", "Progress"];

export function AppShell({
  children,
  activeStep,
  sessionId,
  wide = false,
}: {
  children: ReactNode;
  activeStep?: number | null;
  sessionId?: string | null;
  wide?: boolean;
}) {
  const router = useRouter();
  const activeNav: NavKey = activeStep ? STEP_KEYS[activeStep - 1] : "start";

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex md:w-64 md:flex-col shrink-0 border-r border-base-border bg-base-card px-4 py-6">
        <div className="flex items-center gap-2 px-2">
          <span className="h-2 w-2 rounded-full bg-brand" />
          <span className="text-base font-semibold tracking-tight text-ink-primary">MindProbe</span>
        </div>
        <p className="mt-1 px-2 text-xs text-ink-faint leading-snug">
          Find the root.
          <br />
          Fix the misunderstanding.
        </p>

        <nav className="mt-6 flex flex-col gap-1">
          {NAV_ITEMS.map(({ key, label, sub, icon: Icon }) => {
            const active = key === activeNav;
            return (
              <div
                key={key}
                className={`flex items-start gap-3 rounded-lg px-2 py-2 ${
                  active ? "bg-brand-soft" : ""
                }`}
              >
                <span
                  className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center ${
                    active ? "text-brand" : "text-ink-faint"
                  }`}
                >
                  <Icon active={active} />
                </span>
                <div>
                  <div className={`text-sm font-medium ${active ? "text-brand" : "text-ink-primary"}`}>
                    {label}
                  </div>
                  <div className="text-xs text-ink-faint">{sub}</div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="mt-auto pt-6">
          {sessionId && (
            <div className="rounded-lg border border-base-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-primary">Session</span>
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-signal-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
                  Active
                </span>
              </div>
              <div className="mt-3">
                <GhostButton onClick={() => router.push("/")} className="w-full text-xs">
                  End session
                </GhostButton>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 sm:py-10">
        <div className={`mx-auto w-full ${wide ? "max-w-5xl" : "max-w-3xl"}`}>
          <div className="mb-6 flex items-center gap-2 md:hidden">
            <span className="h-2 w-2 rounded-full bg-brand" />
            <span className="text-base font-semibold tracking-tight text-ink-primary">MindProbe</span>
          </div>

          {activeStep && (
            <div className="mb-8 flex items-center overflow-x-auto">
              {STEP_LABELS.map((label, i) => {
                const stepNum = i + 1;
                const completed = stepNum < activeStep;
                const current = stepNum === activeStep;
                return (
                  <div key={label} className="flex items-center shrink-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                          completed || current
                            ? "bg-brand text-white"
                            : "border border-base-border text-ink-faint"
                        }`}
                      >
                        {completed ? "✓" : stepNum}
                      </span>
                      <span
                        className={`text-xs whitespace-nowrap ${
                          current ? "text-ink-primary font-medium" : "text-ink-faint"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < STEP_LABELS.length - 1 && (
                      <span
                        className={`mx-3 h-px w-8 ${completed ? "bg-brand" : "bg-base-border"}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {children}
        </div>
      </main>
    </div>
  );
}

function StartIcon({ active }: { active: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8l6 4-6 4V8z" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}
function LearnIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function ExplainIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function ProbeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function InterventionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.77z" />
    </svg>
  );
}
function RetestIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 4v6h-6" />
    </svg>
  );
}
function ProgressIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}
