import { cn } from "@/lib/utils";

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
        "inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.14em]",
        tone === "dark" ? "text-brand-green-light" : "text-brand-green-dark dark:text-brand-green",
        className,
      )}
    >
      <span className="h-px w-6 bg-current opacity-60" aria-hidden />
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
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: string;
  tone?: "light" | "dark";
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <Eyebrow
          tone={tone}
          className={align === "center" ? "justify-center" : ""}
        >
          {eyebrow}
        </Eyebrow>
      )}
      <h2
        className={cn(
          "mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl md:text-[2.75rem] md:leading-[1.1]",
          tone === "dark" ? "text-white" : "text-navy-900 dark:text-white",
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-5 text-lg leading-relaxed",
            tone === "dark" ? "text-ink-300" : "text-slate-600 dark:text-ink-300",
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
