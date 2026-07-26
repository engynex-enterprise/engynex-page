type ClassValue = string | number | null | false | undefined;

/** Une clases condicionales (mini utilidad, sin dependencias). */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
