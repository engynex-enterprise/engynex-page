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
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-line bg-card shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/40 hover:shadow-card-hover"
    >
      {/* Imagen */}
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={service.image}
          alt={copy.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/88 via-navy-950/25 to-transparent" />
        <span
          className={cn(
            "absolute left-4 top-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ring-1 ring-white/30 backdrop-blur transition-transform duration-300 group-hover:scale-110",
            isGreen ? "bg-brand-green/85" : "bg-brand-blue/85",
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
        <p
          className={cn(
            "text-sm font-bold",
            isGreen ? "text-accent" : "text-brand-blue dark:text-brand-blue-light",
          )}
        >
          {copy.tagline}
        </p>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-body">
          {copy.description}
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-heading transition-colors group-hover:text-accent">
          {ctaLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
