"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingActions({ topLabel }: { topLabel: string }) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label={topLabel}
      className={cn(
        "fixed bottom-24 right-7 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-deep-900 text-white shadow-lg ring-1 ring-white/10 transition-all duration-300 hover:bg-deep-700 dark:bg-deep-700 dark:hover:bg-deep-600",
        showTop
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
