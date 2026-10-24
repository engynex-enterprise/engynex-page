/**
 * Minigráfica de una serie (sin ejes): línea de 2 px con relleno suave, en
 * el color de la serie. Para la tendencia de las tarjetas de métricas.
 */
export function Sparkline({ values, className = "text-brand-green-dark dark:text-brand-green", label }: { values: number[]; className?: string; label: string }) {
  const w = 120;
  const h = 40;
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? w / (values.length - 1) : w;
  const points = values.map((v, i) => [i * step, h - 4 - (v / max) * (h - 8)] as const);
  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={`h-10 w-28 shrink-0 ${className}`} role="img" aria-label={label} preserveAspectRatio="none">
      <path d={area} fill="currentColor" opacity={0.12} />
      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
