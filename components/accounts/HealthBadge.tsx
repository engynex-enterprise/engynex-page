import { healthLevel, healthTone } from "@/lib/accounts";
import { cn } from "@/lib/utils";

/** Salud de la cuenta: número + barra corta + texto (no solo color). */
export function HealthBadge({ value, labels, compact = false }: { value: number; labels: { good: string; fair: string; poor: string }; compact?: boolean }) {
  const level = healthLevel(value);
  return (
    <span className="inline-flex items-center gap-2" title={labels[level]}>
      <span className="h-1.5 w-12 overflow-hidden rounded-full bg-line" aria-hidden>
        <span className={cn("block h-full rounded-full", healthTone[level].bar)} style={{ width: `${value}%` }} />
      </span>
      <span className={cn("text-sm font-semibold tabular-nums", healthTone[level].text)}>{value}</span>
      {!compact && <span className="text-xs text-muted">{labels[level]}</span>}
      {compact && <span className="sr-only">{labels[level]}</span>}
    </span>
  );
}
