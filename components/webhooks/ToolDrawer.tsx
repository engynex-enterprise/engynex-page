"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

/** Panel lateral (se cierra con Escape o tocando fuera). */
export function ToolDrawer({ title, closeLabel, onClose, children, footer }: { title: string; closeLabel: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="fixed inset-y-3 right-3 z-50 flex w-[min(32rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl dark:bg-card"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="text-[0.98rem] font-semibold text-heading">{title}</h2>
          <button type="button" onClick={onClose} aria-label={closeLabel} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--meta-hover)]">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="grid flex-1 grid-cols-[minmax(0,1fr)] content-start gap-5 overflow-y-auto overflow-x-hidden px-5 py-5 text-sm">{children}</div>
        {footer && <div className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-3">{footer}</div>}
      </aside>
    </>
  );
}
