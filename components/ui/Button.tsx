import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "glass"
  | "dark"
  | "ghost"
  | "outline-light"
  | "outline";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-deep-700 dark:focus-visible:ring-action focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60 disabled:pointer-events-none";

/**
 * Botones píldora al estilo meta.com: planos, sin sombras ni desplazamientos.
 * Sobre fotografía se combinan `primary` (azul) y `glass` (gris translúcido).
 */
const variants: Record<Variant, string> = {
  /** Verde primario #9FDB4F con texto marino. */
  primary: "bg-action text-deep-700 hover:bg-action-hover",
  /** Marino secundario #1F2A46; en oscuro se invierte para no perderse. */
  dark: "bg-deep-700 text-white hover:bg-deep-600 dark:bg-white dark:text-deep-700 dark:hover:bg-deep-100",
  secondary:
    "bg-card-soft text-heading hover:bg-line dark:bg-white/10 dark:hover:bg-white/15",
  /** Gris translúcido con desenfoque, para usar sobre fotografía. */
  glass:
    "bg-[rgba(241,244,247,0.72)] text-deep-700 backdrop-blur-md hover:bg-[rgba(241,244,247,0.92)]",
  // Para fondos oscuros.
  ghost: "bg-white/10 text-white backdrop-blur hover:bg-white/20",
  "outline-light":
    "text-heading ring-1 ring-line-strong hover:bg-card-soft",
  outline: "text-heading ring-1 ring-line-strong hover:bg-card-soft",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-[0.95rem]",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: React.ReactNode;
};

export function Button({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps &
  ({ href: string } & React.ComponentPropsWithoutRef<typeof Link>)) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function ButtonExternal({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: CommonProps &
  ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)) {
  return (
    <a
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </a>
  );
}

export const buttonClasses = (
  variant: Variant = "primary",
  size: Size = "md",
  className?: string,
) => cn(base, variants[variant], sizes[size], className);
