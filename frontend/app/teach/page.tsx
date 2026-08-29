"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { api } from "@/lib/api";
import { Panel, PrimaryButton } from "@/components/Shell";
import { AppShell } from "@/components/AppShell";

function TeachInner() {
  const router = useRouter();
  const sessionId = useSearchParams().get("session");
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!sessionId || explanation.trim().length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await api.teach(sessionId, explanation.trim());
      router.push(`/retest?session=${sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong reading your explanation.");
      setLoading(false);
    }
  }

  if (!sessionId) {
    return (
      <AppShell activeStep={2}>
        <p className="text-signal-red text-sm mt-6">
          No session found. Start a new session from the home page.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell activeStep={2} sessionId={sessionId}>
      <h1 className="font-semibold text-2xl font-medium text-ink-primary">
        Now explain gradient descent as if you&apos;re teaching someone who has never seen it
        before.
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Write freely, in your own words... don&apos;t just repeat the lesson. MindProbe reads
        what you actually believe.
      </p>

      <Panel className="mt-6 p-1">
        <textarea
          autoFocus
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Gradient descent is an algorithm that..."
          rows={10}
          className="w-full resize-none bg-transparent p-4 text-sm text-ink-primary
            placeholder:text-ink-faint focus:outline-none"
        />
      </Panel>

      {error && <p className="mt-3 text-sm text-signal-red">{error}</p>}

      <div className="mt-6 flex items-center gap-4">
        <PrimaryButton onClick={submit} disabled={loading || explanation.trim().length === 0}>
          {loading ? "Reading your reasoning…" : "Submit explanation"}
        </PrimaryButton>
        <span className="text-xs text-ink-faint">
          {explanation.trim().split(/\s+/).filter(Boolean).length} words
        </span>
      </div>
    </AppShell>
  );
}

export default function TeachPage() {
  return (
    <Suspense>
      <TeachInner />
    </Suspense>
  );
}
