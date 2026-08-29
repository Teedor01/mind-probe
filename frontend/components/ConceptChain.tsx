"use client";

import type { ConceptScore } from "@/lib/types";
import { ConceptDial } from "./ConceptDial";

export function ConceptChain({
  scores,
  targetConceptId,
  compact = false,
}: {
  scores: ConceptScore[];
  targetConceptId?: string | null;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-x-2 gap-y-5">
        {scores.map((c) => (
          <ConceptDial
            key={c.concept_id}
            concept={c}
            size="sm"
            active={c.concept_id === targetConceptId}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-1 sm:gap-3">
      {scores.map((c, i) => (
        <div key={c.concept_id} className="flex items-center flex-1">
          <ConceptDial concept={c} size="md" active={c.concept_id === targetConceptId} />
          {i < scores.length - 1 && (
            <div className="flex-1 h-px mx-1 sm:mx-2 mt-[-28px] relative">
              <div
                className="h-px w-full"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, #E8E8F2 0, #E8E8F2 6px, transparent 6px, transparent 11px)",
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
