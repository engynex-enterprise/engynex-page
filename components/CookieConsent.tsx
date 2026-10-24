"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import {
  OPEN_SETTINGS_EVENT,
  optionalCategories,
  parseConsent,
  readConsentRaw,
  saveConsent,
  subscribeConsent,
  type OptionalCategory,
} from "@/lib/cookieConsent";
import type { Dictionary } from "@/i18n/dictionaries";
import { cn } from "@/lib/utils";

type Copy = Dictionary["cookies"];
type Choices = Record<OptionalCategory, boolean>;

const NONE: Choices = { preferences: false, analytics: false, marketing: false };
const ALL: Choices = { preferences: true, analytics: true, marketing: true };

/**
 * Aviso de cookies: una tarjeta abajo a la izquierda en la primera visita
 * (a todo el ancho en móvil) con "Aceptar todas", "Rechazar opcionales" y
 * "Personalizar". "Personalizar" —o el enlace "Configuración de cookies" del
 * footer— abre un modal con un interruptor por categoría.
 *
 * Mientras no haya decisión, las categorías opcionales cuentan como
 * rechazadas. En el servidor no se pinta nada: el aviso aparece al hidratar
 * solo si el navegador aún no tiene una decisión guardada.
 */
export function CookieConsent({
  copy,
  policyHref,
}: {
  copy: Copy;
  policyHref: string;
}) {
  // `undefined` en el servidor; `null` en el navegador si no hay decisión.
  const raw = useSyncExternalStore(
    subscribeConsent,
    readConsentRaw,
    () => undefined,
  );
  const consent = raw === undefined ? undefined : parseConsent(raw);
  const showBanner = consent === null;

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<Choices>(NONE);
  const titleId = useId();

  const openSettings = useCallback(() => {
    const current = parseConsent(readConsentRaw());
    setDraft(
      current
        ? {
            preferences: current.preferences,
            analytics: current.analytics,
            marketing: current.marketing,
          }
        : NONE,
    );
    dialogRef.current?.showModal();
  }, []);

  // El footer abre la configuración con un evento.
  useEffect(() => {
    window.addEventListener(OPEN_SETTINGS_EVENT, openSettings);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, openSettings);
  }, [openSettings]);

  const decide = (choices: Choices) => {
    saveConsent(choices);
    dialogRef.current?.close();
  };

  return (
    <>
      {showBanner && (
        <section
          role="region"
          aria-label={copy.title}
          className="fixed inset-x-3 bottom-3 z-[60] rounded-3xl bg-surface p-6 shadow-[0_16px_50px_-12px_rgba(11,16,32,0.45)] ring-1 ring-line sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-md sm:p-7 dark:bg-card"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <Cookie className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </span>
            <h2 className="text-lg text-heading">{copy.title}</h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-body">
            {copy.text}{" "}
            <Link
              href={policyHref}
              className="font-semibold text-heading underline underline-offset-2"
            >
              {copy.policy}
            </Link>
            .
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => decide(ALL)}
              className={buttonClasses("primary", "md")}
            >
              {copy.acceptAll}
            </button>
            <button
              type="button"
              onClick={() => decide(NONE)}
              className={buttonClasses("outline", "md")}
            >
              {copy.rejectOptional}
            </button>
          </div>
          <button
            type="button"
            onClick={openSettings}
            className="mt-3 w-full text-center text-sm font-semibold text-heading underline-offset-4 hover:underline"
          >
            {copy.customize}
          </button>
        </section>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-[40rem] rounded-[2.5rem] bg-surface p-0 text-heading shadow-2xl backdrop:bg-black/55"
      >
        <div className="px-6 py-8 sm:px-12 sm:py-12">
          <div className="flex items-start justify-between gap-6">
            <h2 id={titleId} className="text-[1.6rem] leading-tight text-heading">
              {copy.settingsTitle}
            </h2>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label={copy.close}
              className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-card-soft"
            >
              <X className="h-6 w-6" strokeWidth={1.6} />
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {copy.settingsText}{" "}
            <Link
              href={policyHref}
              onClick={() => dialogRef.current?.close()}
              className="font-semibold text-heading underline underline-offset-2"
            >
              {copy.policy}
            </Link>
          </p>

          <ul className="mt-6 divide-y divide-line rounded-2xl border border-line-strong">
            <CategoryRow
              title={copy.categories.necessary.title}
              desc={copy.categories.necessary.desc}
              checked
              disabled
              alwaysOn={copy.alwaysOn}
            />
            {optionalCategories.map((key) => (
              <CategoryRow
                key={key}
                title={copy.categories[key].title}
                desc={copy.categories[key].desc}
                checked={draft[key]}
                onChange={(value) => setDraft((d) => ({ ...d, [key]: value }))}
              />
            ))}
          </ul>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => decide(NONE)}
              className={buttonClasses("outline", "md", "whitespace-nowrap")}
            >
              {copy.rejectOptional}
            </button>
            <button
              type="button"
              onClick={() => decide(draft)}
              className={buttonClasses("dark", "md", "whitespace-nowrap")}
            >
              {copy.save}
            </button>
            <button
              type="button"
              onClick={() => decide(ALL)}
              className={buttonClasses("primary", "md", "whitespace-nowrap")}
            >
              {copy.acceptAll}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}

/** Fila de categoría con interruptor (role="switch"). */
function CategoryRow({
  title,
  desc,
  checked,
  disabled = false,
  alwaysOn,
  onChange,
}: {
  title: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  alwaysOn?: string;
  onChange?: (value: boolean) => void;
}) {
  const id = useId();
  return (
    <li className="flex items-start gap-4 px-5 py-4 sm:px-6">
      <div className="min-w-0 flex-1">
        <p id={`${id}-label`} className="font-bold text-heading">
          {title}
        </p>
        <p id={`${id}-desc`} className="mt-1 text-sm leading-relaxed text-muted">
          {desc}
        </p>
      </div>
      {disabled ? (
        <span className="mt-0.5 shrink-0 text-xs font-semibold text-accent">
          {alwaysOn}
        </span>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-desc`}
          onClick={() => onChange?.(!checked)}
          className={cn(
            "relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors",
            checked ? "bg-deep-700 dark:bg-brand-green" : "bg-line-strong",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform",
              checked && "translate-x-5",
            )}
          />
        </button>
      )}
    </li>
  );
}
