"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ConceptChain } from "@/components/ConceptChain";
import { GhostButton, Panel, PrimaryButton } from "@/components/Shell";
import { AppShell } from "@/components/AppShell";
import type {
  Diagnosis,
  Intervention,
  ProbeQuestion,
  RetestQuestion,
  RetestResult,
} from "@/lib/types";

type Stage = "loading" | "probe" | "intervention" | "retest" | "result" | "error";

function RetestInner() {
  const sessionId = useSearchParams().get("session");
  const [stage, setStage] = useState<Stage>("loading");
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState<ProbeQuestion | null>(null);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [answer, setAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [intervention, setIntervention] = useState<Intervention | null>(null);
  const [retestQuestion, setRetestQuestion] = useState<RetestQuestion | null>(null);
  const [result, setResult] = useState<RetestResult | null>(null);
  const [awaitingContinue, setAwaitingContinue] = useState(false);
  const [readyForIntervention, setReadyForIntervention] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    loadProbe();
  }, [sessionId]);

  async function loadProbe() {
    if (!sessionId) return;
    setStage("loading");
    setFeedback(null);
    setAnswer("");
    setAwaitingContinue(false);
    try {
      const q = await api.probe(sessionId);
      setQuestion(q);
      if (!diagnosis) {
        const d = await api.getDiagnosis(sessionId);
        setDiagnosis(d);
      }
      setStage("probe");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the next question.");
      setStage("error");
    }
  }

  async function submitProbeAnswer() {
    if (!sessionId || !question || answer.trim().length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.probeAnswer(sessionId, question.concept_id, answer.trim());
      setFeedback(res.reasoning);
      setReadyForIntervention(res.ready_for_intervention);
      setAwaitingContinue(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not grade that answer.");
      setStage("error");
    } finally {
      setSubmitting(false);
    }
  }

  function continueFromProbe() {
    setAwaitingContinue(false);
    if (readyForIntervention) {
      loadIntervention();
    } else {
      loadProbe();
    }
  }

  async function loadIntervention() {
    if (!sessionId) return;
    setStage("loading");
    try {
      const iv = await api.intervention(sessionId);
      setIntervention(iv);
      setStage("intervention");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the intervention.");
      setStage("error");
    }
  }

  async function loadRetest() {
    if (!sessionId) return;
    setStage("loading");
    setAnswer("");
    try {
      const rq = await api.retest(sessionId);
      setRetestQuestion(rq);
      setStage("retest");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the retest question.");
      setStage("error");
    }
  }

  async function submitRetestAnswer() {
    if (!sessionId || answer.trim().length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.retestAnswer(sessionId, answer.trim());
      setResult(res);
      setStage("result");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not grade the retest.");
      setStage("error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!sessionId) {
    return (
      <AppShell activeStep={3}>
        <p className="text-signal-red text-sm mt-6">
          No session found. Start a new session from the home page.
        </p>
      </AppShell>
    );
  }

  const STAGE_STEP: Record<Stage, number> = {
    loading: 3,
    probe: 3,
    intervention: 4,
    retest: 5,
    result: 6,
    error: 3,
  };

  return (
    <AppShell activeStep={STAGE_STEP[stage]} sessionId={sessionId}>
      {stage === "loading" && (
        <p className="text-sm text-ink-muted animate-pulse">Reading signal…</p>
      )}

      {stage === "error" && (
        <Panel className="p-5 border-signal-red/30">
          <p className="text-signal-red text-sm">{error}</p>
        </Panel>
      )}

      {stage === "probe" && question && (
        <Panel className="p-5 sm:p-6">
          <div className="text-[10px] uppercase tracking-widest text-brand mb-3">
            Question {question.probe_number} of up to 4
          </div>
          <p className="font-semibold text-lg text-ink-primary leading-snug">{question.question}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            placeholder="Your answer…"
            disabled={awaitingContinue}
            className="w-full mt-4 resize-none bg-base-borderSoft rounded-lg p-3 text-sm
              text-ink-primary placeholder:text-ink-faint border border-base-border focus:outline-none
              focus:border-brand/50 disabled:opacity-70"
          />
          {feedback && <p className="mt-3 text-sm text-ink-muted italic">{feedback}</p>}
          <div className="mt-4">
            {awaitingContinue ? (
              <PrimaryButton onClick={continueFromProbe}>Continue</PrimaryButton>
            ) : (
              <PrimaryButton onClick={submitProbeAnswer} disabled={submitting || answer.trim().length === 0}>
                {submitting ? "Assessing…" : "Submit answer"}
              </PrimaryButton>
            )}
          </div>
        </Panel>
      )}

      {stage === "intervention" && intervention && (
        <Panel className="p-5 sm:p-6 border-brand/30">
          <div className="text-[10px] uppercase tracking-widest text-brand mb-3">
            Minimal correction
          </div>
          <p className="text-ink-primary leading-relaxed">{intervention.intervention_text}</p>
          <div className="mt-5">
            <PrimaryButton onClick={loadRetest}>Take the retest</PrimaryButton>
          </div>
        </Panel>
      )}

      {stage === "retest" && retestQuestion && (
        <Panel className="p-5 sm:p-6 border-brand/30">
          <div className="text-[10px] uppercase tracking-widest text-brand mb-3">
            Retest · new question
          </div>
          <p className="font-semibold text-lg text-ink-primary leading-snug">{retestQuestion.question}</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={4}
            placeholder="Your answer…"
            className="w-full mt-4 resize-none bg-base-borderSoft rounded-lg p-3 text-sm
              text-ink-primary placeholder:text-ink-faint border border-base-border focus:outline-none
              focus:border-brand/50"
          />
          <div className="mt-4">
            <PrimaryButton onClick={submitRetestAnswer} disabled={submitting || answer.trim().length === 0}>
              {submitting ? "Assessing…" : "Submit retest"}
            </PrimaryButton>
          </div>
        </Panel>
      )}

      {stage === "result" && result && (
        <>
          {diagnosis && (
            <Panel className="p-5 sm:p-6 border-signal-red/30 mb-4">
              <div className="text-[10px] uppercase tracking-widest text-signal-red mb-2">
                What was diagnosed · {diagnosis.target_concept_name}
              </div>
              <p className="text-sm text-ink-muted leading-relaxed">
                {diagnosis.misconception_summary}
              </p>
              {diagnosis.evidence && (
                <p className="mt-3 text-sm text-ink-faint border-l-2 border-base-border pl-3">
                  &ldquo;{diagnosis.evidence}&rdquo;
                </p>
              )}
            </Panel>
          )}

          <Panel
            className={`p-5 sm:p-6 ${
              result.misconception_resolved ? "border-signal-green/40" : "border-signal-red/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  result.misconception_resolved ? "bg-signal-green" : "bg-signal-red"
                }`}
              />
              <span
                className={`font-semibold text-lg ${
                  result.misconception_resolved ? "text-signal-green" : "text-signal-red"
                }`}
              >
                {result.misconception_resolved ? "Misconception resolved." : "Misconception persists."}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">{result.reasoning}</p>
          </Panel>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Panel className="p-5">
              <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-4">
                Before
              </div>
              <ConceptChain scores={result.before_scores} compact />
            </Panel>
            <Panel className="p-5">
              <div className="text-[10px] uppercase tracking-widest text-ink-faint mb-4">
                After
              </div>
              <ConceptChain scores={result.after_scores} compact />
            </Panel>
          </div>

          <div className="mt-6 flex gap-3">
            <GhostButton onClick={() => (window.location.href = "/")}>New diagnostic</GhostButton>
          </div>
        </>
      )}
    </AppShell>
  );
}

export default function RetestPage() {
  return (
    <Suspense>
      <RetestInner />
    </Suspense>
  );
}
