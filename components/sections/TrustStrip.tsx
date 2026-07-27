import { Clock, ShieldCheck, TrendingUp, HeartHandshake } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

const icons = [Clock, ShieldCheck, TrendingUp, HeartHandshake];

export function TrustStrip({
  items,
  tone = "light",
}: {
  items: readonly { title: string; desc: string }[];
  tone?: "light" | "mesh";
}) {
  return (
    <section
      className={cn(
        "border-y border-line py-10",
        tone === "mesh" ? "bg-mesh-soft" : "bg-surface",
      )}
    >
      <Container>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={item.title} className="group flex items-start gap-3.5">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/12 text-accent transition-colors duration-300 group-hover:bg-brand-green group-hover:text-navy-950">
                  <Icon className="h-5 w-5" strokeWidth={2} aria-hidden />
                </span>
                <div>
                  <p className="font-extrabold text-heading">{item.title}</p>
                  <p className="mt-0.5 text-sm text-body">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
