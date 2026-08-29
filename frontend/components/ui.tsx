"use client";

import { Brain } from "lucide-react";

export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-brand-soft flex items-center justify-center">
        <Brain size={18} className="text-brand" strokeWidth={2.2} />
      </div>
      <span className="font-semibold text-[15px] text-ink-primary tracking-tight">MindProbe</span>
    </div>
  );
}

export function StepBadge({ n, label }: { n: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-1.5 text-xs font-semibold text-white tracking-wide">
      {n}. {label.toUpperCase()}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-base-border bg-base-card shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  icon?: React.ReactNode;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 font-semibold text-sm px-5 py-2.5 rounded-xl
        bg-brand text-white hover:bg-brand-dark active:brightness-95 disabled:opacity-40
        disabled:cursor-not-allowed transition-colors shadow-[0_1px_2px_rgba(109,95,251,0.3)]"
    >
      {children}
      {icon}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 font-medium text-sm px-4 py-2 rounded-xl
        border border-base-border text-ink-secondary hover:border-brand/40 hover:text-brand
        disabled:opacity-40 disabled:cursor-not-allowed transition-colors bg-white"
    >
      {children}
    </button>
  );
}
