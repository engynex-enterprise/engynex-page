"use client";

import { useSyncExternalStore } from "react";

/**
 * Lado de las pestañas laterales. El visitante elige dónde va la de WhatsApp
 * (por defecto, a la derecha) y la de accesibilidad se pone en el costado
 * contrario. La elección se recuerda en el navegador.
 */
export type Side = "left" | "right";

const SIDE_KEY = "engynex-whatsapp-side";
const SIDE_EVENT = "engynex-whatsapp-side-change";

function readSide(): Side {
  try {
    return localStorage.getItem(SIDE_KEY) === "left" ? "left" : "right";
  } catch {
    return "right";
  }
}

function subscribeSide(callback: () => void) {
  window.addEventListener(SIDE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(SIDE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function saveWhatsAppSide(side: Side) {
  try {
    localStorage.setItem(SIDE_KEY, side);
  } catch {
    // Sin almacenamiento: el cambio vale solo para esta página.
  }
  window.dispatchEvent(new Event(SIDE_EVENT));
}

/** Lado de la pestaña de WhatsApp. */
export function useWhatsAppSide(): Side {
  return useSyncExternalStore(subscribeSide, readSide, () => "right");
}
