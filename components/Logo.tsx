import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_DARK = "/images/logos/logo.png"; // texto oscuro (fondos claros)
const LOGO_WHITE = "/images/logos/logo-white.png"; // texto blanco (fondos oscuros)
const RATIO = 3000 / 500; // proporción real del logo

/**
 * Logotipo real de Engynex.
 * - variant="white": versión blanca (footer, hero oscuro)
 * - variant="dark": versión oscura (fondos claros)
 * - variant="adaptive": oscura en tema claro, blanca en tema oscuro
 */
export function Logo({
  variant = "dark",
  className,
  height = 38,
}: {
  variant?: "dark" | "white" | "adaptive";
  className?: string;
  height?: number;
}) {
  const width = Math.round(height * RATIO);
  const common = cn("w-auto object-contain", className);

  if (variant === "adaptive") {
    return (
      <span className="inline-flex items-center" style={{ height }}>
        <Image
          src={LOGO_DARK}
          alt="Engynex Colombia"
          width={width}
          height={height}
          priority
          className={cn(common, "dark:hidden")}
          style={{ height, width: "auto" }}
        />
        <Image
          src={LOGO_WHITE}
          alt="Engynex Colombia"
          width={width}
          height={height}
          priority
          className={cn(common, "hidden dark:block")}
          style={{ height, width: "auto" }}
        />
      </span>
    );
  }

  return (
    <Image
      src={variant === "white" ? LOGO_WHITE : LOGO_DARK}
      alt="Engynex Colombia"
      width={width}
      height={height}
      priority
      className={common}
      style={{ height, width: "auto" }}
    />
  );
}
