"use client";

import { AreaChart, Gauge, MoveUpRight, Sigma, Waypoints } from "lucide-react";
import type { ConceptScore } from "@/lib/types";
import { TIER_BAR, scoreTier } from "@/lib/score";

const CONCEPT_ICON: Record<string, React.ReactNode> = {
  slope: <MoveUpRight size={15} />,
  derivative: <AreaChart size={15} />,
  gradient: <Sigma size={15} />,
  learning_rate: <Gauge size={15} />,
  gradient_descent: <Waypoints size={15} />,
};

export function ProgressBar({ concept }: { concept: ConceptScore }) {
  const tier = scoreTier(concept.score);
  const pct = Math.max(0, Math.min(100, Math.round(concept.score)));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="inline-flex items-center gap-2 text-sm font-medium text-ink-secondary">
          <span className="text-ink-faint">{CONCEPT_ICON[concept.concept_id]}</span>
          {concept.name}
        </span>
        <span className={`text-sm font-semibold ${tier === "red" ? "text-signal-redText" : tier === "orange" ? "text-signal-orangeText" : "text-signal-greenText"}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-base-borderSoft overflow-hidden">
        <div
          className={`h-full rounded-full ${TIER_BAR[tier]} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function ConceptScoreList({ scores }: { scores: ConceptScore[] }) {
  return (
    <div className="flex flex-col gap-4">
      {scores.map((c) => (
        <ProgressBar key={c.concept_id} concept={c} />
      ))}
    </div>
  );
}
