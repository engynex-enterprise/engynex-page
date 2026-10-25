"use client";

import { Printer } from "lucide-react";

/** Imprimir o guardar como PDF (diálogo del navegador). */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-heading ring-1 ring-line hover:bg-[var(--meta-hover)]"
    >
      <Printer className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
