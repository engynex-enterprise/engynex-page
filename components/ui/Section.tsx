import { cn } from "@/lib/utils";
import { Container } from "./Container";

type Tone = "light" | "muted" | "dark" | "mesh";

const toneClasses: Record<Tone, string> = {
  light: "bg-white text-navy-900",
  muted: "bg-slate-50 text-navy-900",
  dark: "bg-navy-950 text-ink-100",
  mesh: "bg-mesh-soft text-navy-900",
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
      className={cn("py-20 sm:py-28", toneClasses[tone], className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}
