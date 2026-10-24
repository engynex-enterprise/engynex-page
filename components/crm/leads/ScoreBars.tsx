/** Puntaje como 10 barras (de amarillo a verde) y "9/10", como en la tabla de referencia. */
const COLORS = ["#eab308", "#d6c40d", "#c2c912", "#a8cc19", "#8fce20", "#77cb26", "#62c62c", "#4fbf31", "#3fb636", "#31ad3a"];

export function ScoreBars({ score }: { score: number }) {
  const filled = Math.max(0, Math.min(10, Math.round(score / 10)));
  return (
    <span className="inline-flex items-center gap-2" title={`${score}/100`}>
      <span className="flex items-end gap-[3px]" aria-hidden>
        {COLORS.map((c, i) => (
          <span key={i} className="block h-4 w-[3px] rounded-full" style={{ background: i < filled ? c : "var(--line-strong)" }} />
        ))}
      </span>
      <span className="rounded-md border border-line-strong px-1.5 py-0.5 text-[0.72rem] font-semibold tabular-nums text-heading">{filled}/10</span>
    </span>
  );
}
