import { cn } from "@/lib/utils";

/**
 * Kicker de sección: texto corto en el color de acción, sin versalitas ni
 * adornos, como los antetítulos de meta.com.
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
        "inline-flex items-center text-sm font-semibold",
        tone === "dark" ? "text-white/80" : "text-accent",
        className,
      )}
    >
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
  /** Se conserva por compatibilidad: todo usa Figtree y solo cambia la escala. */
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
          eyebrow && "mt-3",
          "font-medium",
          size === "lg" || font === "sans"
            ? "text-[clamp(2rem,3.6vw,3rem)] leading-[1.15]"
            : "text-[clamp(1.75rem,2.8vw,2.25rem)] leading-[1.25]",
          tone === "dark" ? "text-white" : "text-heading",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            align === "center" && "mx-auto",
            "max-w-2xl",
            tone === "dark" ? "text-white/75" : "text-muted",
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
