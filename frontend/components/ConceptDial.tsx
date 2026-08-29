"use client";

import type { ConceptScore } from "@/lib/types";

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STATUS_COLOR: Record<ConceptScore["status"], string> = {
  unprobed: "#9CA3AF", 
  weak: "#EF4444", 
  probing: "#6D5FFB", 
  resolved: "#22C55E", 
  strong: "#F59E0B", 
};

const STATUS_LABEL: Record<ConceptScore["status"], string> = {
  unprobed: "unprobed",
  weak: "needs work",
  probing: "probing",
  resolved: "resolved",
  strong: "stable",
};

export function ConceptDial({
  concept,
  size = "md",
  active = false,
}: {
  concept: ConceptScore;
  size?: "sm" | "md" | "lg";
  active?: boolean;
}) {
  const color = STATUS_COLOR[concept.status];
  const pct = Math.max(0, Math.min(100, concept.score));
  const dashOffset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
  const dims = size === "lg" ? 128 : size === "sm" ? 76 : 104;
  const stroke = size === "lg" ? 8 : 6;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative"
        style={{ width: dims, height: dims }}
        role="img"
        aria-label={`${concept.name}: ${Math.round(pct)} percent, ${STATUS_LABEL[concept.status]}`}
      >
        <svg width={dims} height={dims} viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#F0F0F7" strokeWidth={stroke} />
          <circle
            cx="50"
            cy="50"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 50 50)"
            style={{
              filter: active ? `drop-shadow(0 0 4px ${color}66)` : undefined,
              transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1), stroke 0.4s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold" style={{ color }}>
            {Math.round(pct)}
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-medium text-ink-primary">{concept.name}</div>
        <div className="text-[10px] uppercase tracking-wider" style={{ color }}>
          {STATUS_LABEL[concept.status]}
        </div>
      </div>
    </div>
  );
}
