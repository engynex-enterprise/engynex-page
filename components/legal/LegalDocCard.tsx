import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Tarjeta de documento del centro legal: gris, título, resumen y «Leer ↗». */
export function LegalDocCard({
  href,
  title,
  summary,
  readLabel,
  tone = "soft",
}: {
  href: string;
  title: string;
  summary: string;
  readLabel: string;
  /** `soft` sobre fondo blanco; `card` sobre fondo gris. */
  tone?: "soft" | "card";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full flex-col rounded-3xl p-7 transition-colors sm:p-8",
        tone === "soft"
          ? "bg-surface-soft hover:bg-line dark:hover:bg-card"
          : "bg-card hover:bg-card-soft",
      )}
    >
      <h3 className="text-xl leading-snug text-heading sm:text-2xl">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-body sm:text-base">{summary}</p>
      <span className="mt-auto inline-flex items-center gap-1 pt-8 text-sm font-semibold text-heading">
        {readLabel}
        <ArrowUpRight
          className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          aria-hidden
        />
      </span>
    </Link>
  );
}
