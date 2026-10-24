"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({
  label,
  tone = "dark",
}: {
  label: string;
  tone?: "light" | "dark";
}) {
  const [dark, setDark] = useState(false);

  // Sincroniza el icono con el tema aplicado (tras el primer paint).
  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setDark(document.documentElement.classList.contains("dark")),
    );
    return () => cancelAnimationFrame(raf);
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* almacenamiento no disponible */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-full ring-1 transition-colors",
        tone === "dark"
          ? "bg-white/5 text-ink-200 ring-white/15 hover:bg-white/10 hover:text-white"
          : "bg-deep-900/5 text-deep-700 ring-deep-900/10 hover:bg-deep-900/10 hover:text-deep-900 dark:bg-white/5 dark:text-ink-200 dark:ring-white/15 dark:hover:bg-white/10",
      )}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
