"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Desplazamiento a distinta velocidad que el resto de la página.
 *
 * El contenedor exterior es el que se mide (queda quieto) y el interior es el
 * que se traslada, para no medir un elemento que ya está desplazado. El cálculo
 * se hace dentro de `requestAnimationFrame` y solo mientras el bloque está en
 * pantalla, así el scroll no se resiente.
 *
 * Con `prefers-reduced-motion` no se aplica ningún movimiento.
 */
export function Parallax({
  children,
  /** Recorrido total en píxeles a lo largo de toda la ventana. */
  distance = 60,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  distance?: number;
  className?: string;
  innerClassName?: string;
}) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = outer.current;
    const target = inner.current;
    if (!host || !target) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let visible = false;

    const apply = () => {
      frame = 0;
      const rect = host.getBoundingClientRect();
      const viewport = window.innerHeight;
      // -1 cuando el bloque entra por abajo, +1 cuando sale por arriba.
      const progress =
        (rect.top + rect.height / 2 - viewport / 2) /
        (viewport / 2 + rect.height / 2);
      const clamped = Math.max(-1, Math.min(1, progress));
      target.style.transform = `translate3d(0, ${clamped * distance}px, 0)`;
    };

    const schedule = () => {
      if (!visible || frame) return;
      frame = requestAnimationFrame(apply);
    };

    // Solo escuchamos el scroll mientras el bloque está a la vista.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) schedule();
      },
      { rootMargin: "120px 0px" },
    );
    observer.observe(host);

    apply();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      target.style.transform = "";
    };
  }, [distance]);

  return (
    <div ref={outer} className={className}>
      <div
        ref={inner}
        className={cn("will-change-transform", innerClassName)}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Variante para fondos que ocupan toda la sección.
 *
 * La capa se extiende por encima y por debajo del contenedor (`-inset-y`) para
 * que al desplazarse no aparezcan franjas vacías en los bordes.
 */
export function ParallaxLayer({
  children,
  distance = 60,
  className,
}: {
  children: React.ReactNode;
  distance?: number;
  className?: string;
}) {
  // El colchón vertical debe superar el recorrido para no descubrir el borde.
  const padding = Math.ceil(distance * 1.4);

  return (
    <Parallax
      distance={distance}
      className={cn("pointer-events-none absolute inset-0", className)}
      innerClassName="absolute inset-0"
    >
      <div
        className="absolute inset-x-0"
        style={{ top: -padding, bottom: -padding }}
      >
        {children}
      </div>
    </Parallax>
  );
}
