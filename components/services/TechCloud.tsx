"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { TechMark } from "@/components/TechMark";
import { cn } from "@/lib/utils";

export interface CloudItem {
  name: string;
  /** Posición del centro, en % del área con margen. */
  x: number;
  y: number;
  /** Tamaño máximo de la burbuja (px). */
  size: number;
  rotate: number;
  /** 0 = al fondo, 1 = al frente. Define sombra, opacidad y parallax. */
  depth: number;
  /** Visible también en móvil. */
  mobile: boolean;
  /** Retardo del flotado (s). */
  delay: number;
}

/**
 * Nube de logos con profundidad, como las composiciones de iconos de
 * meta.com (y de las páginas de integraciones de Stripe o Linear).
 *
 * Las burbujas viven en un área con margen, así que ninguna toca el borde de
 * la sección. Las grandes están "cerca" (más sombra, se mueven más) y las
 * pequeñas "lejos" (más tenues, se mueven menos): al hacer scroll y al mover el
 * ratón se desplazan a distinta velocidad, lo que da sensación de capas. Con
 * "reducir movimiento" quedan quietas.
 */
export function TechCloud({
  items,
  children,
  className,
}: {
  items: CloudItem[];
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion() ?? false;

  // Progreso del scroll mientras la sección cruza la pantalla (0 → 1).
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Posición del ratón dentro de la sección, de -1 a 1, suavizada.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 60, damping: 18 });
  const smoothY = useSpring(pointerY, { stiffness: 60, damping: 18 });

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - box.left) / box.width) * 2 - 1);
    pointerY.set(((event.clientY - box.top) / box.height) * 2 - 1);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
      className={cn("relative isolate", className)}
    >
      {/* Área de la nube, con margen respecto a los bordes de la sección */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 inset-y-8 -z-10 sm:inset-x-12 sm:inset-y-12 lg:inset-x-16 xl:inset-x-24"
      >
        {items.map((item, i) => (
          <Bubble
            key={i}
            item={item}
            index={i}
            reduce={reduce}
            scroll={scrollYProgress}
            pointerX={smoothX}
            pointerY={smoothY}
          />
        ))}
      </div>

      {children}
    </div>
  );
}

function Bubble({
  item,
  index,
  reduce,
  scroll,
  pointerX,
  pointerY,
}: {
  item: CloudItem;
  index: number;
  reduce: boolean;
  scroll: MotionValue<number>;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
}) {
  // Cuanto más al frente, más recorrido: 30–110 px con el scroll y 6–22 px
  // siguiendo al ratón.
  const travel = 30 + item.depth * 80;
  const lean = 6 + item.depth * 16;
  const scrollY = useTransform(scroll, [0, 1], [travel, -travel]);
  const mouseX = useTransform(pointerX, (v) => v * -lean);
  const mouseY = useTransform(pointerY, (v) => v * -lean);
  const y = useTransform(() => (reduce ? 0 : scrollY.get() + mouseY.get()));
  const x = useTransform(() => (reduce ? 0 : mouseX.get()));

  const shadow =
    item.depth > 0.6
      ? "shadow-[0_18px_40px_-14px_rgba(11,16,32,0.45)]"
      : item.depth > 0.3
        ? "shadow-[0_12px_28px_-14px_rgba(11,16,32,0.35)]"
        : "shadow-[0_8px_20px_-12px_rgba(11,16,32,0.3)]";

  return (
    <motion.span
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2",
        !item.mobile && "hidden md:block",
      )}
      style={{ left: `${item.x}%`, top: `${item.y}%`, x, y }}
      initial={reduce ? false : { opacity: 0, scale: 0.6 }}
      whileInView={{ opacity: 0.55 + item.depth * 0.45, scale: 1 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 0.8,
        delay: reduce ? 0 : 0.05 * index,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <span
        className={cn(
          "grid place-items-center rounded-[28%] bg-white ring-1 ring-black/5 motion-safe:animate-float",
          shadow,
        )}
        style={{
          width: `clamp(${Math.round(item.size * 0.6)}px, ${(item.size / 14.4).toFixed(2)}vw, ${item.size}px)`,
          aspectRatio: "1",
          rotate: `${item.rotate.toFixed(1)}deg`,
          animationDelay: `${item.delay.toFixed(2)}s`,
          animationDuration: `${(7 + (1 - item.depth) * 4).toFixed(1)}s`,
        }}
      >
        <TechMark name={item.name} className="h-1/2 w-1/2" />
      </span>
    </motion.span>
  );
}
