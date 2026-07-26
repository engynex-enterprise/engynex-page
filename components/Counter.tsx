"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cuenta ascendente al entrar en el viewport.
 * `value` acepta prefijos/sufijos: "+120", "98%", "8".
 * Triple garantía de que nunca queda en 0: IntersectionObserver + fallback
 * por temporizador que fuerza la animación aunque la detección falle.
 */
export function Counter({
  value,
  className,
  duration = 1600,
}: {
  value: string;
  className?: string;
  duration?: number;
}) {
  const match = value.match(/^(\D*)(\d+)(\D*)$/);
  const prefix = match?.[1] ?? "";
  const target = match ? parseInt(match[2], 10) : 0;
  const suffix = match?.[3] ?? "";
  const hasNumber = match !== null;

  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el || !hasNumber) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    let raf = 0;
    let startTs = 0;
    let started = false;
    let timer = 0;
    let observer: IntersectionObserver | undefined;

    const animate = () => {
      if (started) return;
      started = true;
      window.clearTimeout(timer);
      observer?.disconnect();
      if (reduceMotion) {
        setDisplay(target);
        return;
      }
      const step = (ts: number) => {
        if (!startTs) startTs = ts;
        const p = Math.min((ts - startTs) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        setDisplay(Math.round(eased * target));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };

    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) animate();
        },
        { threshold: 0, rootMargin: "0px 0px -12% 0px" },
      );
      observer.observe(el);
    }
    // Fallback: si nada dispara la animación, arranca igual.
    timer = window.setTimeout(animate, 2400);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [target, duration, hasNumber]);

  if (!hasNumber) return <span className={className}>{value}</span>;

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
