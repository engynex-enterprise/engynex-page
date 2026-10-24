import { cn } from "@/lib/utils";

/**
 * Kicker de sección: punto de acento + texto en versalitas espaciadas.
 * Es el mismo tratamiento que usa el hero, para que el ritmo sea el mismo en
 * toda la página.
 */
export function Eyebrow({
  children,
  tone = "light",
  className,
}: {
  children: React.ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5 text-[0.7rem] font-bold uppercase tracking-[0.22em]",
        tone === "dark" ? "text-white/60" : "text-muted",
        className,
      )}
    >
      <span
        aria-hidden
        className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green"
      />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  tone = "light",
  align = "center",
  /**
   * Se conserva por compatibilidad: los titulares van en OpenDyslexic (regla
   * base de `h2` en globals.css) y solo cambia la escala.
   */
  font = "display",
  size = "md",
  className,
  action,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  tone?: "light" | "dark";
  align?: "center" | "left";
  font?: "display" | "sans";
  size?: "md" | "lg";
  className?: string;
  /** Enlace o botón alineado a la derecha del titular (solo con align left). */
  action?: React.ReactNode;
}) {
  const heading = (
    <>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "text-balance",
          eyebrow && "mt-4",
          "font-extrabold",
          size === "lg" || font === "sans"
            ? "text-[clamp(2rem,3.8vw,3.25rem)] leading-[1.1]"
            : "text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.15]",
          tone === "dark" ? "text-white" : "text-heading",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed sm:text-xl sm:leading-relaxed",
            align === "center" && "mx-auto",
            "max-w-2xl",
            tone === "dark" ? "text-ink-300" : "text-body",
          )}
        >
          {subtitle}
        </p>
      )}
    </>
  );

  // Con acción, el titular y el enlace comparten fila en pantallas anchas.
  if (action && align === "left") {
    return (
      <div
        className={cn(
          "flex flex-col gap-8 md:flex-row md:items-end md:justify-between",
          className,
        )}
      >
        <div className="max-w-3xl">{heading}</div>
        <div className="shrink-0">{action}</div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl",
        className,
      )}
    >
      {heading}
    </div>
  );
}
