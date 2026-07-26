import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { ServiceIcon } from "./ServiceIcon";
import { localizedHref } from "@/lib/site";
import type { Service } from "@/content/services";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export function ServiceCard({
  service,
  locale,
  ctaLabel,
}: {
  service: Service;
  locale: Locale;
  ctaLabel: string;
}) {
  const copy = service[locale];
  const isGreen = service.accent === "green";

  return (
    <Link
      href={localizedHref(locale, `servicios/${service.slug}`)}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-navy-900/10 dark:border-white/10 bg-white dark:bg-navy-800 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-2xl hover:shadow-navy-900/15"
    >
      {/* Imagen */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={service.image}
          alt={copy.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/85 via-navy-950/25 to-transparent" />
        <span
          className={cn(
            "absolute left-4 top-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ring-1 backdrop-blur",
            isGreen
              ? "bg-brand-green/85 ring-white/30"
              : "bg-brand-blue/85 ring-white/30",
          )}
        >
          <ServiceIcon name={service.icon} className="h-6 w-6" />
        </span>
        <h3 className="absolute bottom-4 left-4 right-4 text-lg font-extrabold text-white drop-shadow">
          {copy.title}
        </h3>
      </div>

      {/* Contenido */}
      <div className="flex flex-1 flex-col p-6">
        <p className="text-sm font-bold text-brand-green-dark dark:text-brand-green">{copy.tagline}</p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-ink-300">
          {copy.description}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-navy-900 dark:text-white transition-colors group-hover:text-brand-blue">
          {ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
