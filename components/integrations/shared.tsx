"use client";

import { useState } from "react";
import { Check, CheckCircle2, CircleAlert, CircleDashed, Copy, Package, Workflow } from "lucide-react";
import type { IntegrationDef, Pricing } from "@/lib/integrationCatalog";
import { cn } from "@/lib/utils";

export type IntegrationStatus = "connected" | "partial" | "off" | "builtin" | "via";

/** Monograma con el color de la marca (sin logos registrados). */
export function IntegrationLogo({ def, size = "md" }: { def: IntegrationDef; size?: "md" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-xl font-semibold tracking-tight text-white",
        size === "lg" ? "h-14 w-14 text-base" : "h-11 w-11 text-[0.8rem]",
      )}
      style={{ background: def.color }}
    >
      {def.mono}
    </span>
  );
}

const STATUS_TONE: Record<IntegrationStatus, { tone: string; icon: typeof CheckCircle2 }> = {
  connected: { tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300", icon: CheckCircle2 },
  partial: { tone: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300", icon: CircleAlert },
  off: { tone: "bg-[var(--meta-active)] text-muted", icon: CircleDashed },
  builtin: { tone: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300", icon: Package },
  via: { tone: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300", icon: Workflow },
};

export function StatusPill({ status, label }: { status: IntegrationStatus; label: string }) {
  const { tone, icon: Icon } = STATUS_TONE[status];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", tone)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}

export function PricingBadge({ pricing, label }: { pricing: Pricing; label: string }) {
  return (
    <span
      className={cn(
        "whitespace-nowrap rounded-md px-1.5 py-0.5 text-[0.7rem] font-semibold ring-1",
        pricing === "free" ? "text-emerald-700 ring-emerald-300 dark:text-emerald-300 dark:ring-emerald-500/40" : pricing === "paid" ? "text-amber-700 ring-amber-300 dark:text-amber-300 dark:ring-amber-500/40" : "text-muted ring-line",
      )}
    >
      {label}
    </span>
  );
}

export function CopyButton({ value, label, done, className }: { value: string; label: string; done: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]", className)}
    >
      {copied ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      {copied ? done : label}
    </button>
  );
}
