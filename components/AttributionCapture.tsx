"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/** Guarda el origen de la visita la primera vez que se carga una página. */
export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);
  return null;
}
