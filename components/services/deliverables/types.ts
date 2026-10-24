import type { SignatureProps, Tone } from "../signatures/types";

/**
 * Diseño propio de la sección "Qué recibes" de un servicio. Reemplaza la
 * lista genérica de entregables. Recibe el tono (blanco/gris) que le toca.
 */
export type DeliverablesDesign = (
  props: SignatureProps & { tone: Tone; title: string },
) => React.ReactNode;
