"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Activity, ClipboardCheck, Home, PenLine, RotateCcw } from "lucide-react";
import { Logo } from "./ui";

const ITEMS = [
  { href: "/", label: "Start", icon: Home },
  { href: "/teach", label: "Teach", icon: PenLine },
  { href: "/diagnosis", label: "Diagnosis", icon: Activity },
  { href: "/retest", label: "Retest", icon: ClipboardCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const sessionId = useSearchParams().get("session");
  const qs = sessionId ? `?session=${sessionId}` : "";

  return (
    <aside className="hidden md:flex md:w-56 shrink-0 flex-col justify-between border-r border-base-border bg-base-sidebar px-4 py-6">
      <div>
        <div className="px-2 mb-8">
          <Logo />
        </div>
        <nav className="flex flex-col gap-1">
          {ITEMS.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={`${item.href}${qs}`}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand-soft text-brand"
                    : "text-ink-muted hover:bg-base-borderSoft hover:text-ink-primary"
                }`}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <Link
        href="/"
        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted hover:bg-base-borderSoft hover:text-ink-primary transition-colors"
      >
        <RotateCcw size={17} strokeWidth={2} />
        New Session
      </Link>
    </aside>
  );
}
