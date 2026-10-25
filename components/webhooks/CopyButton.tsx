"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

/** Copia un texto al portapapeles y confirma por 2 segundos. */
export function CopyButton({ value, label, copiedLabel, className }: { value: string; label: string; copiedLabel: string; className?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        } catch {
          // Sin permiso de portapapeles: el texto sigue visible para copiarlo a mano.
        }
      }}
      className={cn("inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[10px] px-2.5 text-xs font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]", className)}
    >
      {done ? <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
      <span aria-live="polite">{done ? copiedLabel : label}</span>
    </button>
  );
}

/** Bloque de código con botón de copiar. */
export function CodeBlock({ code, title, copy, copied }: { code: string; title?: string; copy: string; copied: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="flex items-center justify-between gap-2 border-b border-line bg-[var(--meta-hover)] px-3 py-1.5">
        <span className="text-xs font-medium text-muted">{title}</span>
        <CopyButton value={code} label={copy} copiedLabel={copied} className="h-7 ring-0" />
      </div>
      <pre className="max-h-80 overflow-auto bg-surface px-4 py-3 text-[0.78rem] leading-relaxed text-heading dark:bg-card">
        <code>{code}</code>
      </pre>
    </div>
  );
}
