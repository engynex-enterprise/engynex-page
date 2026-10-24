"use client";

import { useSyncExternalStore } from "react";

/**
 * Colores de gráficas validados con el script de la guía de visualización
 * (separación para daltonismo, luminosidad y contraste) en claro y oscuro.
 * Los colores de lead (verde/amarillo/rojo) siempre van con leyenda y tabla.
 */
export const CHART = {
  light: {
    tiers: { green: "#1d8a73", yellow: "#c08a0c", red: "#d64545" },
    single: "#1f2a46",
    accent: "#467316",
    grid: "#ececee",
    axis: "#71717a",
    surface: "#ffffff",
    tooltipBg: "#18181b",
  },
  dark: {
    tiers: { green: "#26a17a", yellow: "#c08a0c", red: "#e2595c" },
    single: "#9fb0d8",
    accent: "#9fdb4f",
    grid: "#2a2a2e",
    axis: "#a1a1aa",
    surface: "#18181b",
    tooltipBg: "#f4f4f5",
  },
};

const subscribe = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
};

/** Paleta del tema actual (cambia sola al pasar a modo oscuro). */
export function useChartTheme() {
  const dark = useSyncExternalStore(subscribe, () => document.documentElement.classList.contains("dark"), () => false);
  return dark ? CHART.dark : CHART.light;
}
