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
        "border-y border-navy-900/10 py-10 dark:border-white/10",
        tone === "mesh" ? "bg-mesh-soft" : "bg-white dark:bg-navy-950",
      )}
    >
      <Container>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => {
            const Icon = icons[i % icons.length];
            return (
              <div key={item.title} className="flex items-start gap-3.5">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-green/12 text-brand-green-dark dark:bg-brand-green/15 dark:text-brand-green">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-extrabold text-navy-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-ink-300">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
