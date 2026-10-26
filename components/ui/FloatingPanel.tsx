"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";

const GAP = 6;
const MARGIN = 8;

/**
 * Panel flotante (menús contextuales, selectores) que se dibuja en el <body>
 * con `position: fixed`, junto al elemento que lo abre. Así ningún contenedor
 * con `overflow` (tablas con scroll, tarjetas, cajones) lo recorta. Se abre
 * hacia abajo y, si no cabe, hacia arriba; nunca se sale de la pantalla y
 * sigue al ancla al hacer scroll. Se cierra con clic afuera o Escape.
 *
 * `data-popover` y `data-row-menu` se ponen en el panel para que los
 * manejadores de clic afuera que ya existían lo reconozcan como propio.
 */
export function FloatingPanel({
  anchor,
  open,
  onClose,
  align = "end",
  placement = "bottom",
  className,
  children,
  role,
  ariaLabel,
  matchWidth = false,
}: {
  anchor: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  /** Borde del ancla con el que se alinea el panel. */
  align?: "start" | "end";
  /** Lado preferido; se invierte si no hay espacio. */
  placement?: "bottom" | "top";
  className?: string;
  children: ReactNode;
  role?: string;
  ariaLabel?: string;
  /** Usa el mismo ancho del ancla (listas de sugerencias bajo un campo). */
  matchWidth?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({ position: "fixed", top: 0, left: 0, visibility: "hidden" });
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });

  useLayoutEffect(() => {
    if (!open || !anchor) return;
    const place = () => {
      const el = panel.current;
      if (!el) return;
      const a = anchor.getBoundingClientRect();
      if (matchWidth) el.style.width = `${a.width}px`;
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const below = vh - a.bottom - GAP - MARGIN;
      const above = a.top - GAP - MARGIN;
      const up = placement === "top" ? above >= h || above > below : below < h && above > below;
      let top = up ? a.top - GAP - h : a.bottom + GAP;
      top = Math.max(MARGIN, Math.min(top, vh - h - MARGIN));
      let left = align === "end" ? a.right - w : a.left;
      left = Math.max(MARGIN, Math.min(left, vw - w - MARGIN));
      setStyle({ position: "fixed", top, left, maxHeight: vh - MARGIN * 2, visibility: "visible", ...(matchWidth ? { width: a.width } : {}) });
    };
    place();
    const ro = new ResizeObserver(place);
    if (panel.current) ro.observe(panel.current);
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [open, anchor, align, placement, matchWidth]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panel.current?.contains(target) || anchor?.contains(target)) return;
      close.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close.current();
        anchor?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, anchor]);

  if (!open || !anchor) return null;
  return createPortal(
    <div ref={panel} role={role} aria-label={ariaLabel} data-popover data-row-menu style={style} className={`z-[90] overflow-y-auto ${className ?? ""}`}>
      {children}
    </div>,
    // Dentro de un <dialog> modal el panel debe vivir en el mismo diálogo:
    // la capa superior del navegador taparía todo lo que esté en el <body>.
    anchor.closest("dialog[open]") ?? document.body,
  );
}
