"use client";

import { useId, useState } from "react";
import { ArrowRight } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site";
import { trackContact } from "@/lib/tracking";
import { cn } from "@/lib/utils";

/**
 * Diagnóstico gratuito (al estilo del "Get news and updates" de meta.com):
 * la persona escribe la dirección de su sitio o su necesidad y se abre
 * WhatsApp con el mensaje listo para el equipo.
 */
export function AuditForm({
  title,
  body,
  label,
  placeholder,
  cta,
  note,
  message,
  kind,
}: {
  title: string;
  body: string;
  label: string;
  placeholder: string;
  cta: string;
  note: string;
  message: string;
  kind: "url" | "text";
}) {
  const id = useId();
  const [url, setUrl] = useState("");
  const valid = kind === "url" ? /^(https?:\/\/)?[\w-]+(\.[\w-]+)+(\/\S*)?$/i.test(url.trim()) : url.trim().length >= 8;

  return (
    <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-12">
      <div>
        <h2 className="text-xl font-semibold leading-snug text-heading sm:text-2xl">{title}</h2>
      </div>
      <form
        className="grid gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          trackContact("whatsapp");
          const text = message.replace("{value}", url.trim());
          window.open(`https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
        }}
      >
        <p className="max-w-2xl text-base leading-relaxed text-muted">{body}</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor={id} className="sr-only">{label}</label>
          <input
            id={id}
            type="text"
            inputMode={kind === "url" ? "url" : "text"}
            autoComplete={kind === "url" ? "url" : "off"}
            maxLength={300}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            className="h-13 min-w-0 flex-1 rounded-2xl border border-line-strong bg-surface px-5 text-base text-heading outline-none transition-colors hover:border-muted focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green"
          />
          <button type="submit" disabled={!valid} className={cn(buttonClasses("primary", "lg"), "shrink-0 disabled:opacity-50")}>
            {cta}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="text-xs text-muted">{note}</p>
      </form>
    </div>
  );
}
