import { Clock, ShieldCheck, TrendingUp, HeartHandshake } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

const icons = [Clock, ShieldCheck, TrendingUp, HeartHandshake];

/**
 * Cuatro garantías en tarjetas blancas sobre gris, como el bloque "Why buy
 * from Meta": icono azul, título grande en peso ligero y una línea de apoyo.
 */
export function TrustStrip({
  items,
  title,
  tone = "muted",
}: {
  items: readonly { title: string; desc: string }[];
  /** Titular centrado opcional sobre las tarjetas. */
  title?: string;
  tone?: "light" | "muted";
}) {
  return (
    <section
      className={cn(
        "py-16 sm:py-24",
        tone === "muted" ? "bg-surface-soft" : "bg-surface",
      )}
    >
      <Container>
        {title && (
          <h2 className="mb-10 text-center text-[clamp(1.75rem,2.8vw,2.25rem)] font-medium text-heading sm:mb-12">
            {title}
          </h2>
        )}
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => {
            const Icon = icons[i % icons.length];
            return (
              <li
                key={item.title}
                className={cn(
                  "rounded-3xl p-8 sm:p-10",
                  tone === "muted" ? "bg-card" : "bg-surface-soft",
                )}
              >
                <Icon className="h-7 w-7 text-accent" strokeWidth={1.75} aria-hidden />
                <h3 className="mt-8 text-[1.75rem] font-light leading-tight text-heading">
                  {item.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-body">
                  {item.desc}
                </p>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
