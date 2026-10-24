import { extendTailwindMerge } from "tailwind-merge";

type ClassValue = string | number | null | false | undefined;

/**
 * tailwind-merge con los tamaños propios del proyecto, para que sepa que
 * `text-heading`, `text-body`… son colores (no tamaños de letra) y no los
 * descarte al resolver conflictos.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "text-color": [
        {
          text: [
            "heading",
            "body",
            "muted",
            "accent",
            "action",
          ],
        },
      ],
    },
  },
});

/**
 * Une clases condicionales y resuelve los conflictos de Tailwind: si llegan
 * `w-full` y `w-24`, gana la última (antes solo se concatenaban y el
 * resultado dependía del orden del CSS).
 */
export function cn(...classes: ClassValue[]): string {
  return twMerge(classes.filter(Boolean).join(" "));
}
