"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT } from "@/lib/cookieConsent";
import { TRACK_EVENT, type TrackDetail } from "@/lib/tracking";
import {
  analyticsAllowed,
  clearVisitor,
  getSessionId,
  getVisitorId,
} from "@/lib/visitor";

const ENDPOINT = "/api/t";

function send(body: Record<string, unknown>, beacon = false) {
  const payload = JSON.stringify(body);
  if (beacon && navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([payload], { type: "application/json" }));
    return Promise.resolve(null);
  }
  return fetch(ENDPOINT, {
    method: "POST",
    body: payload,
    keepalive: true,
    headers: { "Content-Type": "application/json" },
  })
    .then((res) => (res.ok && res.status !== 204 ? res.json() : null))
    .catch(() => null);
}

/**
 * Analítica propia del sitio público. Registra cada página vista, el tiempo
 * de lectura y el scroll máximo, solo con consentimiento de analítica. Si el
 * visitante retira el permiso, se borra su rastro.
 */
export function AnalyticsTracker({ locale }: { locale: string }) {
  const pathname = usePathname();
  const view = useRef<{ id: number | null; start: number; scroll: number; visitor: string } | null>(null);

  // Cierre de la vista actual (tiempo y scroll).
  const leave = () => {
    const current = view.current;
    if (!current?.id) return;
    send(
      {
        type: "leave",
        view_id: current.id,
        visitor_id: current.visitor,
        duration_ms: Math.round(performance.now() - current.start),
        max_scroll: current.scroll,
      },
      true,
    );
  };

  // Nueva vista en cada cambio de página.
  useEffect(() => {
    const visitor = getVisitorId();
    const session = getSessionId();
    if (!visitor || !session) return;
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const value = params.get(key);
      if (value) utm[key] = value.slice(0, 200);
    }
    const referrer =
      document.referrer && !document.referrer.startsWith(window.location.origin)
        ? document.referrer
        : null;
    view.current = { id: null, start: performance.now(), scroll: 0, visitor };
    const current = view.current;
    void send({
      type: "view",
      visitor_id: visitor,
      session_id: session,
      path: pathname,
      title: document.title,
      referrer,
      utm: Object.keys(utm).length ? utm : null,
      gclid: params.get("gclid"),
      locale,
    }).then((data) => {
      if (data && typeof data.id === "number") current.id = data.id;
    });
    return () => leave();
  }, [pathname, locale]);

  // Scroll máximo y cierre al ocultar la pestaña.
  useEffect(() => {
    const onScroll = () => {
      const current = view.current;
      if (!current) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(100, Math.round((window.scrollY / max) * 100)) : 100;
      if (pct > current.scroll) current.scroll = pct;
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") leave();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  // Eventos: los que emite el código (formulario, chat, reunión) y los clics
  // en WhatsApp, teléfono, correo, enlaces externos y elementos con data-track.
  useEffect(() => {
    const emit = (name: string, label?: string | null) => {
      const visitor = getVisitorId();
      const session = getSessionId();
      if (!visitor || !session) return;
      void send({ type: "event", visitor_id: visitor, session_id: session, name, label: label?.slice(0, 200) ?? null, path: window.location.pathname }, true);
    };
    const onTrack = (event: Event) => {
      const { name, label } = (event as CustomEvent<TrackDetail>).detail;
      emit(name, label);
    };
    const onClick = (event: MouseEvent) => {
      const el = (event.target as HTMLElement | null)?.closest<HTMLElement>("a, button, [data-track]");
      if (!el) return;
      const tracked = el.closest<HTMLElement>("[data-track]")?.dataset.track;
      const text = (el.getAttribute("aria-label") ?? el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80);
      if (tracked) return emit("cta_click", tracked);
      const href = el instanceof HTMLAnchorElement ? el.href : "";
      if (!href) return;
      if (/wa\.me|whatsapp\.com/i.test(href)) return emit("whatsapp_click", text || "link");
      if (href.startsWith("tel:")) return emit("phone_click", href.slice(4));
      if (href.startsWith("mailto:")) return emit("email_click", href.slice(7).split("?")[0]);
      if (/\.(pdf|docx?|xlsx?|zip)(\?|$)/i.test(href)) return emit("file_download", href.split("/").pop() ?? href);
      try {
        const url = new URL(href);
        if (url.origin !== window.location.origin) return emit("outbound_click", url.hostname.replace(/^www\./, ""));
        if (/\/cotizar|\/contacto|\/agendar/.test(url.pathname) && el.className.includes("bg-")) emit("cta_click", text || url.pathname);
      } catch {
        // Enlace inválido: se ignora.
      }
    };
    window.addEventListener(TRACK_EVENT, onTrack);
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener(TRACK_EVENT, onTrack);
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  // Si retira el consentimiento: se borra el rastro.
  useEffect(() => {
    const onConsent = () => {
      if (analyticsAllowed()) return;
      const id = clearVisitor();
      view.current = null;
      if (id) void send({ type: "forget", visitor_id: id });
    };
    window.addEventListener(CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(CONSENT_EVENT, onConsent);
  }, []);

  return null;
}
