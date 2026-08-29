"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { GhostButton, Panel, PrimaryButton } from "@/components/Shell";
import { AppShell } from "@/components/AppShell";

const CHAIN = ["Slope", "Derivative", "Gradient", "Learning Rate", "Gradient Descent"];

const EXPECTATIONS = [
  {
    title: "Explain your understanding",
    body: "Share your thoughts in your own words.",
    icon: ChatIcon,
  },
  {
    title: "Get targeted questions",
    body: "We ask sharp questions to diagnose the issue.",
    icon: QuestionIcon,
  },
  {
    title: "Learn & see why",
    body: "Get a short lesson that connects the dots.",
    icon: BookIcon,
  },
  {
    title: "Prove it's fixed",
    body: "We retest to make sure it sticks.",
    icon: CheckIcon,
  },
];

const FEATURES = [
  {
    title: "Pinpoints the real issue",
    body: "Finds the exact misconception, not just the symptom.",
    icon: TargetIcon,
  },
  {
    title: "Teaches in your words",
    body: "Explain it back in your own words to lock it in.",
    icon: SpeechIcon,
  },
  {
    title: "Proves it's fixed",
    body: "We test you again to make sure it sticks.",
    icon: RefreshCheckIcon,
  },
];

export default function StartPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const session = await api.createSession();
      router.push(`/learn?session=${session.session_id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the backend.");
      setLoading(false);
    }
  }

  return (
    <AppShell wide>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div>
          <h1 className="font-semibold text-3xl sm:text-4xl leading-tight text-ink-primary max-w-lg">
            Know what you got wrong,
            <br />
            <span className="text-brand">and understand why.</span>
          </h1>
          <p className="mt-4 text-ink-muted max-w-md leading-relaxed">
            MindProbe finds the exact concept you misunderstand, teaches it in your
            terms, and proves it&apos;s fixed.
          </p>

          <Panel className="mt-8 p-5 sm:p-6">
            <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-4">
              This session will cover
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-3">
              {CHAIN.map((c, i) => (
                <span key={c} className="flex items-center gap-2">
                  <span className="text-sm text-ink-primary border border-base-border rounded-full px-3 py-1">
                    {c}
                  </span>
                  {i < CHAIN.length - 1 && <span className="text-ink-faint">→</span>}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm text-ink-muted">
              You&apos;ll get a short lesson on <span className="text-ink-primary">gradient descent</span>,
              then explain it back in your own words. MindProbe diagnoses which link in this
              chain is actually broken.
            </p>
          </Panel>

          {error && <p className="mt-4 text-sm text-signal-red">{error}</p>}

          <div className="mt-8 flex items-center gap-3">
            <PrimaryButton onClick={start} disabled={loading}>
              {loading ? "Starting session…" : "Start session →"}
            </PrimaryButton>
            <GhostButton disabled>~2 minutes</GhostButton>
          </div>

          <p className="mt-4 text-xs text-ink-faint">Private &amp; secure · No data shared</p>
        </div>

        <Panel className="p-5 sm:p-6">
          <div className="text-sm font-semibold text-ink-primary mb-4">What to expect</div>
          <div className="flex flex-col gap-4">
            {EXPECTATIONS.map(({ title, body, icon: Icon }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
                  <Icon />
                </span>
                <div>
                  <div className="text-sm font-medium text-ink-primary">{title}</div>
                  <div className="text-xs text-ink-muted mt-0.5">{body}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {FEATURES.map(({ title, body, icon: Icon }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-base-border text-brand">
              <Icon />
            </span>
            <div>
              <div className="text-sm font-medium text-ink-primary">{title}</div>
              <div className="text-xs text-ink-muted mt-0.5 leading-relaxed">{body}</div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function QuestionIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

function SpeechIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20 8 22V18H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4z" />
    </svg>
  );
}

function RefreshCheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 4v6h-6" />
    </svg>
  );
}
