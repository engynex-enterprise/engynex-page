"use client";

import { useId, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Globe, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { locales, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Copy = Dictionary["region"];
type Country = keyof Copy["countries"];

const STORAGE_KEY = "engynex-country";
const DEFAULT_COUNTRY: Country = "CO";

/** Evento propio para avisar a todos los botones (barra y menú móvil). */
const CHANGE_EVENT = "engynex-country-change";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function readStored(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Sin acceso al almacenamiento (modo privado): vale el de por defecto.
    return null;
  }
}

function saveCountry(country: string) {
  try {
    localStorage.setItem(STORAGE_KEY, country);
  } catch {
    // Ignorado: el cambio no se recuerda, pero la página sigue funcionando.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Selector de país/región e idioma al estilo de meta.com: en la barra, un
 * globo con el código del país; al pulsarlo, un modal con dos selectores
 * ("País/región" e "Idioma") y los botones Cancelar / Confirmar, que solo se
 * habilita cuando algo cambió.
 *
 * El idioma cambia la ruta (/es ↔ /en) conservando la página actual. El país
 * se recuerda en el navegador y se muestra en el botón; no cambia contenido.
 */
export function RegionLanguage({
  locale,
  copy,
  className,
  onDone,
}: {
  locale: Locale;
  copy: Copy;
  className?: string;
  /** Se llama al confirmar (p. ej. para cerrar el menú móvil). */
  onDone?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const pathname = usePathname() || `/${locale}`;
  const titleId = useId();
  const countryId = useId();
  const languageId = useId();

  // El país guardado solo existe en el navegador; en el servidor (y en el
  // primer pintado) vale el de por defecto.
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  const country: Country =
    stored && stored in copy.countries ? (stored as Country) : DEFAULT_COUNTRY;
  const [draftCountry, setDraftCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [draftLocale, setDraftLocale] = useState<Locale>(locale);

  const open = () => {
    setDraftCountry(country);
    setDraftLocale(locale);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  const changed = draftCountry !== country || draftLocale !== locale;

  const confirm = () => {
    if (draftCountry !== country) saveCountry(draftCountry);
    close();
    onDone?.();
    if (draftLocale !== locale) {
      const segments = pathname.split("/");
      segments[1] = draftLocale;
      router.push(segments.join("/") || `/${draftLocale}`);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={open}
        aria-haspopup="dialog"
        aria-label={`${copy.trigger} - ${country}`}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-full px-2.5 text-[0.95rem] text-heading transition-colors hover:bg-card-soft dark:hover:bg-white/5",
          className,
        )}
      >
        <Globe className="h-6 w-6" strokeWidth={1.6} aria-hidden />
        <span>{country}</span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        // Clic en el fondo (fuera de la caja) cierra, como en meta.com.
        onClick={(event) => {
          if (event.target === dialogRef.current) close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-[44rem] rounded-[2.5rem] bg-surface p-0 text-heading shadow-2xl backdrop:bg-black/55"
      >
        <div className="px-6 py-10 sm:px-14 sm:py-14">
          <div className="flex items-start justify-between gap-6">
            <h2
              id={titleId}
              className="text-[clamp(1.5rem,3vw,1.75rem)] leading-tight text-heading"
            >
              {copy.title}
            </h2>
            <button
              type="button"
              onClick={close}
              aria-label={copy.close}
              className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-heading transition-colors hover:bg-card-soft"
            >
              <X className="h-7 w-7" strokeWidth={1.6} />
            </button>
          </div>

          <div className="mt-10 grid gap-5">
            <SelectField
              id={countryId}
              label={copy.country}
              value={draftCountry}
              onChange={(value) => setDraftCountry(value as Country)}
              options={(Object.keys(copy.countries) as Country[]).map((code) => ({
                value: code,
                label: copy.countries[code],
              }))}
            />
            <SelectField
              id={languageId}
              label={copy.language}
              value={draftLocale}
              onChange={(value) => setDraftLocale(value as Locale)}
              options={locales.map((code) => ({
                value: code,
                label: copy.languages[code],
              }))}
            />
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={close}
              className={buttonClasses("outline", "lg", "sm:min-w-36")}
            >
              {copy.cancel}
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!changed}
              className={buttonClasses(
                "primary",
                "lg",
                "sm:min-w-36 disabled:bg-line disabled:text-muted disabled:opacity-100",
              )}
            >
              {copy.confirm}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/**
 * Selector con la etiqueta dentro de la caja, encima del valor, y la flecha a
 * la derecha (el campo de meta.com). Es un `<select>` nativo, así que funciona
 * con teclado y lector de pantalla sin código extra.
 */
function SelectField({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative rounded-2xl border border-line-strong transition-colors focus-within:border-heading">
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-5 top-3 text-sm text-muted sm:left-8"
      >
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[4.75rem] w-full cursor-pointer appearance-none rounded-2xl bg-transparent pb-3 pl-5 pr-14 pt-8 text-xl text-heading outline-none sm:pl-8"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-heading sm:right-8"
        strokeWidth={1.6}
      />
    </div>
  );
}
