"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Panel, PrimaryButton } from "@/components/Shell";
import { AppShell } from "@/components/AppShell";

function LearnInner() {
  const router = useRouter();
  const sessionId = useSearchParams().get("session");
  const [lessonText, setLessonText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    api
      .lesson(sessionId)
      .then((l) => {
        if (!cancelled) setLessonText(l.lesson_text);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load the lesson.");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <AppShell activeStep={1}>
        <p className="text-signal-red text-sm mt-6">
          No session found. Start a new session from the home page.
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell activeStep={1} sessionId={sessionId}>
      <h1 className="font-semibold text-2xl font-medium text-ink-primary">
        First, a quick pass through the chain.
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        Read this once. Next you&apos;ll explain it back in your own words... that&apos;s what
        actually gets diagnosed.
      </p>

      {error && <p className="mt-4 text-sm text-signal-red">{error}</p>}

      {!lessonText && !error && (
        <p className="mt-6 text-sm text-ink-muted animate-pulse">Preparing the lesson…</p>
      )}

      {lessonText && (
        <>
          <Panel className="mt-6 p-6 sm:p-8 border-brand/20">
            <p className="text-ink-primary leading-relaxed whitespace-pre-wrap">{lessonText}</p>
          </Panel>

          <div className="mt-6">
            <PrimaryButton onClick={() => router.push(`/teach?session=${sessionId}`)}>
              I&apos;ve got it — let me explain
            </PrimaryButton>
          </div>
        </>
      )}
    </AppShell>
  );
}

export default function LearnPage() {
  return (
    <Suspense>
      <LearnInner />
    </Suspense>
  );
}
