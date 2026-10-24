"use client";

import { useSyncExternalStore } from "react";
import {
  A11Y_CLASSES,
  A11Y_DEFAULTS,
  EVENT,
  KEY,
  TEXT_SIZES,
  type A11ySettings,
} from "@/lib/a11yConfig";

export { A11Y_DEFAULTS, type A11ySettings } from "@/lib/a11yConfig";

/**
 * Ajustes de accesibilidad que elige el visitante (pestaña "Accesibilidad").
 *
 * Se guardan en el navegador y se aplican como clases en <html>; las reglas
 * están en globals.css (sección "Accesibilidad"). El script inicial del
 * layout (`A11Y_BOOT_SCRIPT`) las aplica antes del primer pintado para que la
 * página no "salte" al cargar.
 */
let cachedRaw: string | null | undefined;
let cached: A11ySettings = A11Y_DEFAULTS;

function read(): A11ySettings {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // Sin almacenamiento: valores por defecto.
  }
  // Misma referencia mientras no cambie, como pide useSyncExternalStore.
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      cached = raw ? { ...A11Y_DEFAULTS, ...JSON.parse(raw) } : A11Y_DEFAULTS;
    } catch {
      cached = A11Y_DEFAULTS;
    }
  }
  return cached;
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function apply(settings: A11ySettings) {
  const root = document.documentElement;
  for (const [key, className] of Object.entries(A11Y_CLASSES)) {
    root.classList.toggle(className, !!settings[key as keyof typeof A11Y_CLASSES]);
  }
  TEXT_SIZES.forEach((className, level) => {
    if (className) root.classList.toggle(className, level === settings.textSize);
  });
}

export function saveA11y(settings: A11ySettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Ignorado: el ajuste vale solo para esta página.
  }
  apply(settings);
  window.dispatchEvent(new Event(EVENT));
}

export function useA11y(): A11ySettings {
  return useSyncExternalStore(subscribe, read, () => A11Y_DEFAULTS);
}
