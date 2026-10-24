import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline-light"
  | "outline";
type Size = "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  /**
   * Acción principal: azul sólido y plano, sin brillo ni desplazamiento. Al
   * pasar el cursor solo aparece una elevación mínima, como en Material.
   */
  primary:
    "bg-brand-blue text-white hover:bg-brand-blue-dark hover:shadow-[0_1px_3px_rgba(60,64,67,0.3)]",
  secondary:
    "bg-accent-soft text-accent hover:bg-[#d2e3fc] dark:hover:bg-white/10",
  // Para fondos oscuros (heros, bandas navy).
  ghost:
    "bg-white/5 text-ink-100 ring-1 ring-white/15 backdrop-blur hover:bg-white/10 hover:ring-white/30",
  /**
   * Contorno que se adapta al tema: antes solo tenía colores de modo claro y
   * quedaba prácticamente invisible sobre fondo oscuro.
   */
  "outline-light":
    "text-accent ring-1 ring-line-strong hover:bg-accent-soft",
  outline:
    "text-accent ring-1 ring-line-strong hover:bg-accent-soft",
};

const sizes: Record<Size, string> = {
  md: "h-10 px-6 text-sm",
  lg: "h-12 px-7 text-base",
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
