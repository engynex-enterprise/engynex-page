import { Clock, ShieldCheck, TrendingUp, HeartHandshake } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { hue, hueAt } from "@/lib/accents";
import { cn } from "@/lib/utils";

const icons = [Clock, ShieldCheck, TrendingUp, HeartHandshake];

/**
 * Barra de confianza justo bajo el hero: cuatro argumentos con su icono a
 * color y un filete superior del mismo tono.
 */
export function TrustStrip({
  items,
  tone = "light",
}: {
  items: readonly { title: string; desc: string }[];
  tone?: "light" | "muted";
}) {
  return (
    <section
      className={cn(
        "border-b border-line py-4",
        tone === "muted" ? "bg-surface-soft" : "bg-surface",
      )}
    >
      <Container>
        <dl className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => {
            const Icon = icons[i % icons.length];
            const c = hue[hueAt(i)];
            return (
              <div key={item.title} className="group py-6 lg:py-7">
                <span
                  aria-hidden
                  className={cn("mb-5 block h-0.5 w-10 rounded-full transition-all duration-300 group-hover:w-16", c.dot)}
                />
                <div className="flex items-start gap-3.5">
                  <span
                    className={cn(
                      "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
                      c.tile,
                      c.tileHover,
                    )}
                  >
                    <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                  </span>
                  <div>
                    <dt className="text-sm font-extrabold text-heading">
                      {item.title}
                    </dt>
                    <dd className="mt-1 text-sm leading-snug text-body">
                      {item.desc}
                    </dd>
                  </div>
                </div>
              </div>
            );
          })}
        </dl>
      </Container>
    </section>
  );
}
