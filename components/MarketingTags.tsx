"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { subscribeConsent } from "@/lib/cookieConsent";
import { applyTags, trackPageView } from "@/lib/tracking";

/**
 * Carga las etiquetas de Google y Meta solo después del consentimiento y las
 * actualiza si el visitante cambia su decisión. Mide la navegación interna.
 */
export function MarketingTags() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    void applyTags();
    return subscribeConsent(() => void applyTags());
  }, []);

  useEffect(() => {
    // La primera vista la registra la propia etiqueta al cargar.
    if (first.current) {
      first.current = false;
      return;
    }
    trackPageView(pathname);
  }, [pathname]);

  return null;
}
