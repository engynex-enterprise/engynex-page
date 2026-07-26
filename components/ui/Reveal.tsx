"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type RevealState = "idle" | "hidden" | "visible";

/**
 * Anima el contenido al entrar en el viewport (fade + slide up).
 *
 * Estrategia a prueba de fallos: el contenido es VISIBLE por defecto
 * (SSR, sin JS o above-the-fold). Solo el contenido por debajo del viewport
 * se oculta y se revela mediante un listener de scroll (fiable, no se pierde
 * con scroll rápido) + un fallback por temporizador que garantiza que nada
 * quede oculto permanentemente.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<RevealState>("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) return; // se queda "idle" (visible, sin animar)

    let raf = 0;
    let timer = 0;

    const inView = () => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight * 0.9 && r.bottom > 0;
    };
    const reveal = () => {
      setState("visible");
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
    const onScroll = () => {
      if (inView()) reveal();
    };

    // La decisión se toma tras el primer paint (no en el cuerpo del efecto).
    raf = requestAnimationFrame(() => {
      if (inView()) return; // ya visible: se queda idle
      setState("hidden");
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      // Fallback: si nunca se dispara el scroll, se revela igual.
      timer = window.setTimeout(reveal, 3000);
    });

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn(
        state !== "idle" && "reveal",
        state === "hidden" && "is-hidden",
        state === "visible" && "is-visible",
        className,
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
