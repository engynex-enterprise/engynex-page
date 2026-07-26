import { cn } from "@/lib/utils";

/**
 * Figuras vectoriales decorativas (anillos, cruces, triángulos, puntos).
 * Se coloca dentro de una sección con `position: relative`.
 */
export function Decor({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {/* Anillo */}
      <svg
        viewBox="0 0 100 100"
        className="animate-float-slow absolute left-[4%] top-[14%] h-16 w-16 text-brand-green/40 dark:text-brand-green/25"
      >
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
        />
      </svg>

      {/* Cruz / plus */}
      <svg
        viewBox="0 0 100 100"
        className="animate-float absolute right-[7%] top-[20%] h-10 w-10 text-brand-blue/40 dark:text-brand-blue-light/30"
        style={{ animationDelay: "1.2s" }}
      >
        <path
          d="M50 12v76M12 50h76"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
        />
      </svg>

      {/* Triángulo */}
      <svg
        viewBox="0 0 100 100"
        className="animate-float-slow absolute bottom-[16%] right-[14%] h-14 w-14 text-brand-green/35 dark:text-brand-green/25"
        style={{ animationDelay: "0.6s" }}
      >
        <path
          d="M50 16 84 78H16Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinejoin="round"
        />
      </svg>

      {/* Puntos */}
      <svg
        viewBox="0 0 60 60"
        className="animate-float absolute bottom-[18%] left-[10%] h-16 w-16 text-brand-blue/40 dark:text-brand-blue-light/25"
        style={{ animationDelay: "1.8s" }}
      >
        <g fill="currentColor">
          {[6, 22, 38, 54].map((y) =>
            [6, 22, 38, 54].map((x) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="3" />
            )),
          )}
        </g>
      </svg>

      {/* Círculo relleno pequeño */}
      <span className="animate-float absolute right-[24%] bottom-[30%] h-3 w-3 rounded-full bg-brand-green/50" />
    </div>
  );
}
