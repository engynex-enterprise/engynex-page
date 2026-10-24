"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronRight,
  PanelLeft,
  PanelRight,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { WhatsappIcon } from "./SocialIcons";
import { buttonClasses } from "@/components/ui/Button";
import { siteConfig } from "@/lib/site";
import { saveWhatsAppSide, useWhatsAppSide } from "@/lib/sideTabs";
import type { Dictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Copy = Dictionary["chat"];
type Department = Copy["departments"][number];

/* ------------------------------------------------------------------ */
/*  Estado externo: horario de atención y tipo de dispositivo          */
/* ------------------------------------------------------------------ */

/** ¿Estamos dentro del horario de atención (hora de Colombia)? */
function isOpenNow(): boolean {
  const { timeZone, days } = siteConfig.businessHours;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday"),
  );
  const hours = (Number(get("hour")) % 24) + Number(get("minute")) / 60;
  const range = days[day];
  return !!range && hours >= range[0] && hours < range[1];
}

/** Revisa el horario cada minuto. En el servidor no se sabe (null). */
function subscribeClock(callback: () => void) {
  const id = window.setInterval(callback, 60_000);
  return () => window.clearInterval(id);
}

const DESKTOP_QUERY = "(min-width: 768px) and (pointer: fine)";
function subscribeDesktop(callback: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/* ------------------------------------------------------------------ */
/*  Enlaces de WhatsApp                                                */
/* ------------------------------------------------------------------ */

const waLink = (text: string) =>
  `https://wa.me/${siteConfig.whatsapp}?text=${encodeURIComponent(text)}`;
const waWebLink = (text: string) =>
  `https://web.whatsapp.com/send?phone=${siteConfig.whatsapp}&text=${encodeURIComponent(text)}`;

/**
 * Contacto por WhatsApp.
 *
 * Una pestaña vertical anclada a un costado ("Contactar por WhatsApp"; a la
 * derecha por defecto, y el visitante puede pasarla a la izquierda desde el
 * panel, con su elección recordada en el navegador) abre un panel con el
 * lenguaje de meta.com:
 *
 * 1. Estado en vivo según el horario de atención (en línea / fuera de horario).
 * 2. "¿Con quién quieres hablar?": ventas, soporte, demo o pagos. Cada tema
 *    prepara un mensaje distinto, con la página desde la que escribe.
 * 3. El mensaje se puede editar. En el celular abre la app de WhatsApp; en el
 *    computador muestra un código QR (qrcode.react) para seguir en el teléfono,
 *    como la página de "clic para chatear" de WhatsApp, más WhatsApp Web y la
 *    app de escritorio.
 */
export function WhatsAppWidget({
  chat,
  locale,
}: {
  chat: Copy;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);
  const [message, setMessage] = useState("");
  const tabRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const messageId = useId();

  const online = useSyncExternalStore(subscribeClock, isOpenNow, () => null);
  const side = useWhatsAppSide();
  const left = side === "left";
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );

  const close = useCallback(() => {
    setOpen(false);
    tabRef.current?.focus();
  }, []);

  // Esc cierra; al abrir, el foco entra al panel.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current
      ?.querySelector<HTMLElement>("button[data-autofocus], textarea")
      ?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, department, close]);

  const pick = (item: Department) => {
    const page = `${document.title} (${window.location.href})`;
    setDepartment(item);
    setMessage(`${item.message}\n\n${chat.pageContext.replace("{page}", page)}`);
  };

  const text = message.trim() || department?.message || chat.greeting;

  return (
    <>
      {/* -------- Pestaña vertical, anclada a un costado -------- */}
      <button
        ref={tabRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        aria-controls="whatsapp-panel"
        className={cn(
          "fixed top-1/2 z-50 flex w-8 -translate-y-1/2 items-center justify-center gap-2.5 bg-[#25D366] px-1.5 py-3.5 font-semibold text-deep-950 shadow-[0_10px_30px_-10px_rgba(11,16,32,0.45)] transition-[padding,background-color] hover:bg-[#1fbe5b] sm:w-10 sm:px-2 sm:py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 focus-visible:ring-offset-2",
          "[writing-mode:vertical-rl]",
          // A la izquierda el texto se lee de abajo arriba; a la derecha, de
          // arriba abajo (como las pestañas laterales habituales).
          // El giro de 180° invierte las esquinas: se redondea el lado
          // izquierdo para que, ya girada, la curva quede hacia adentro.
          left
            ? "left-0 rotate-180 rounded-l-xl hover:pl-2.5 sm:hover:pl-3"
            : "right-0 rounded-l-xl hover:pr-2.5 sm:hover:pr-3",
        )}
      >
        <WhatsappIcon className={cn("h-5 w-5", left ? "rotate-90" : "-rotate-90")} />
        {/* En celular, solo "WhatsApp" (la pestaña tapa menos contenido) */}
        <span className="text-xs tracking-wide sm:hidden">WhatsApp</span>
        <span className="hidden text-[0.8rem] tracking-wide sm:inline">
          {chat.tab}
        </span>
        {online && (
          <span
            aria-hidden
            className="h-2 w-2 rounded-full bg-deep-950 motion-safe:animate-pulse"
          />
        )}
      </button>

      {/* -------- Panel -------- */}
      <div
        ref={panelRef}
        id="whatsapp-panel"
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        hidden={!open}
        className={cn(
          "fixed z-50 flex max-h-[85dvh] flex-col overflow-hidden rounded-3xl bg-surface text-heading shadow-[0_24px_70px_-20px_rgba(11,16,32,0.5)] ring-1 ring-line dark:bg-card",
          "inset-x-3 bottom-3 md:inset-x-auto md:bottom-auto md:top-1/2 md:w-[24rem] md:-translate-y-1/2",
          left ? "md:left-16" : "md:right-16",
        )}
      >
        {/* Encabezado */}
        <div className="flex items-start gap-3 border-b border-line px-6 pb-5 pt-6">
          <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-full bg-deep-700">
            <Image
              src="/images/logos/favico.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
            <span
              aria-hidden
              className={cn(
                "absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full ring-2 ring-surface dark:ring-card",
                online === false ? "bg-deep-400" : "bg-[#25D366]",
              )}
            />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg leading-tight text-heading">
              {chat.title}
            </h2>
            {online !== null && (
              <p className="mt-0.5 text-sm text-muted">
                {online ? chat.online : chat.offline}
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted">
              {siteConfig.hours[locale]}
            </p>
          </div>
          {/* Pasar la pestaña al otro costado (solo tiene sentido con ratón y
              pantalla ancha, pero también funciona en celular) */}
          <button
            type="button"
            onClick={() => saveWhatsAppSide(left ? "right" : "left")}
            aria-label={left ? chat.moveRight : chat.moveLeft}
            title={left ? chat.moveRight : chat.moveLeft}
            className="-mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-card-soft hover:text-heading"
          >
            {left ? (
              <PanelRight className="h-5 w-5" aria-hidden />
            ) : (
              <PanelLeft className="h-5 w-5" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={close}
            aria-label={chat.close}
            className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full hover:bg-card-soft"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 pb-6 pt-5">
          {!department ? (
            <>
              {/* Saludo, como burbuja de WhatsApp */}
              <p className="rounded-2xl rounded-tl-sm bg-surface-soft px-4 py-3 text-sm leading-relaxed text-body dark:bg-white/[0.06]">
                {chat.greeting}
              </p>
              <h3 className="mt-6 text-base text-heading">{chat.pickTitle}</h3>
              <ul className="mt-3 grid gap-2">
                {chat.departments.map((item, i) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      data-autofocus={i === 0 ? "" : undefined}
                      onClick={() => pick(item)}
                      className="group flex w-full items-center gap-3 rounded-2xl border border-line px-4 py-3.5 text-left transition-colors hover:bg-surface-soft"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-heading">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {item.desc}
                        </span>
                      </span>
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                        aria-hidden
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setDepartment(null)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-heading"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {chat.back}
              </button>
              <p className="mt-3 text-base font-bold text-heading">
                {department.label}
              </p>

              <label htmlFor={messageId} className="mt-4 block text-sm text-muted">
                {chat.messageLabel}
              </label>
              <textarea
                id={messageId}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-line-strong bg-surface px-4 py-3 text-sm leading-relaxed text-heading outline-none focus:border-deep-700 focus:ring-2 focus:ring-deep-700/15 dark:bg-card dark:focus:border-brand-green dark:focus:ring-brand-green/20"
              />

              {desktop ? (
                <div className="mt-5 flex items-center gap-4 rounded-2xl bg-surface-soft p-4 dark:bg-white/[0.06]">
                  <div className="shrink-0 rounded-xl bg-white p-2">
                    <QRCodeSVG
                      value={waLink(text)}
                      size={104}
                      level="M"
                      fgColor="#1F2A46"
                      title={chat.qrTitle}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-heading">{chat.qrTitle}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted">
                      {chat.qrHint}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid gap-2">
                <a
                  href={desktop ? waWebLink(text) : waLink(text)}
                  target="_blank"
                  rel="noopener noreferrer"
                  // Verde de WhatsApp: se arma aparte porque `cn` no resuelve
                  // clases en conflicto con el verde del botón primario.
                  className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 text-[0.95rem] font-semibold text-deep-950 transition-colors hover:bg-[#1fbe5b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 focus-visible:ring-offset-2"
                >
                  <WhatsappIcon className="h-5 w-5" />
                  {desktop ? chat.openWeb : chat.openApp}
                </a>
                {desktop && (
                  <a
                    href={waLink(text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClasses("outline", "md", "w-full")}
                  >
                    {chat.openDesktop}
                  </a>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-muted">{chat.privacy}</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
