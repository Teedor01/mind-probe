"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { ConceptChain } from "@/components/ConceptChain";
import { Panel, PrimaryButton, Shell } from "@/components/Shell";
import type { Diagnosis } from "@/lib/types";

function DiagnosisInner() {
  const router = useRouter();
  const sessionId = useSearchParams().get("session");
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    api
      .getDiagnosis(sessionId)
      .then(setDiagnosis)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load."));
  }, [sessionId]);

  if (!sessionId) {
    return (
      <Shell eyebrow="diagnosis">
        <p className="text-signal-red text-sm mt-6">
          No session found. Start a new session from the home page.
        </p>
      </Shell>
    );
  }

  return (
    <Shell eyebrow="diagnosis (debug view)">
      <h1 className="font-semibold text-2xl font-medium text-ink-primary">Misconception map</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Raw diagnosis snapshot for this session... not part of the normal flow, useful for
        checking what the model inferred at any point.
      </p>

      {error && <p className="mt-4 text-sm text-signal-red">{error}</p>}

      {diagnosis && (
        <>
          <Panel className="mt-6 p-6 sm:p-8">
            <ConceptChain
              scores={diagnosis.concept_scores}
              targetConceptId={diagnosis.target_concept_id}
            />
          </Panel>

          <Panel className="mt-4 p-5 sm:p-6 border-signal-red/30">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-signal-red">
              <span className="h-1.5 w-1.5 rounded-full bg-signal-red" />
              Root cause identified
            </div>
            <div className="mt-2 font-semibold text-lg text-ink-primary">
              {diagnosis.target_concept_name}
            </div>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
              {diagnosis.misconception_summary}
            </p>
            {diagnosis.evidence && (
              <p className="mt-3 text-sm text-ink-faint border-l-2 border-base-border pl-3">
                &ldquo;{diagnosis.evidence}&rdquo;
              </p>
            )}
          </Panel>

          <div className="mt-6">
            <PrimaryButton onClick={() => router.push(`/retest?session=${sessionId}`)}>
              Continue to probing
            </PrimaryButton>
          </div>
        </>
      )}
    </Shell>
  );
}

export default function DiagnosisPage() {
  return (
    <Suspense>
      <DiagnosisInner />
    </Suspense>
  );
}
