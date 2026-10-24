"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT } from "@/lib/cookieConsent";
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
