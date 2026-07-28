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
        "inline-flex items-center gap-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.22em]",
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
   * `sans` usa la tipografía de cuerpo con tracking cerrado (titular
   * editorial); `display` mantiene OpenDyslexic. El escape `font-sans` es
   * necesario porque la regla base de `h2` va fuera de capa (ver globals.css).
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
          eyebrow && "mt-5",
          font === "sans"
            ? cn(
                "font-sans font-extrabold tracking-[-0.028em]",
                size === "lg"
                  ? "text-[clamp(2.2rem,4.4vw,3.75rem)] leading-[1.03]"
                  : "text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1.06]",
              )
            : "text-3xl font-extrabold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.1]",
          tone === "dark" ? "text-white" : "text-heading",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed",
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
