"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onStoreChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onStoreChange);
  return () => query.removeEventListener("change", onStoreChange);
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches;
}

/** En el servidor asumimos que no hay preferencia de movimiento reducido. */
function getServerSnapshot() {
  return false;
}

/**
 * `true` cuando el sistema pide reducir el movimiento.
 *
 * Se lee con `useSyncExternalStore` (y no con useEffect + setState) para no
 * provocar un render en cascada tras el primer paint.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
