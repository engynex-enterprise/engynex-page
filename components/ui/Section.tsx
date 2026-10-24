import { cn } from "@/lib/utils";
import { Container } from "./Container";

type Tone = "light" | "muted" | "dark" | "mesh" | "mesh-strong";

/**
 * Los tonos usan los tokens semánticos (`surface`, `body`…) definidos en
 * globals.css, así que se adaptan al tema sin duplicar cada color con `dark:`.
 */
const toneClasses: Record<Tone, string> = {
  light: "bg-surface text-body",
  muted: "bg-surface-soft text-body",
  dark: "bg-deep-950 text-ink-100",
  mesh: "bg-mesh-soft text-body",
  "mesh-strong": "bg-mesh text-body",
};

export function Section({
  children,
  className,
  containerClassName,
  tone = "light",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  tone?: Tone;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn("isolate py-20 sm:py-28 lg:py-32", toneClasses[tone], className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
