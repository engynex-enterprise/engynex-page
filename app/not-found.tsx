import Link from "next/link";
import { Figtree } from "next/font/google";
import { Logo } from "@/components/Logo";
import { buttonClasses } from "@/components/ui/Button";

// Esta página vive fuera de app/[locale], así que carga su propia Figtree.
const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "swap",
});

/**
 * 404 al estilo meta.com: superficie blanca, tipografía y una sola acción.
 */
export default function NotFound() {
  return (
    <html lang="es" className={`${figtree.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-body antialiased">
        <header className="px-4 py-5 sm:px-8">
          <Link
            href="/es"
            aria-label="Engynex"
            className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
          >
            <Logo variant="dark" height={32} />
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-4 pb-24 pt-10 sm:px-8">
          <div className="w-full max-w-2xl rounded-3xl bg-surface-soft px-6 py-16 text-center sm:px-12 sm:py-20">
            <p className="text-sm font-semibold text-accent">Error 404</p>
            <h1 className="mt-3 text-balance text-[clamp(2rem,3.6vw,3rem)] font-medium leading-[1.15] text-heading">
              Página no encontrada
              <span className="block text-muted" lang="en">Page not found</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-body">
              La página que buscas no existe o fue movida.
              <span className="mt-1 block text-muted" lang="en">
                The page you are looking for doesn&apos;t exist or was moved.
              </span>
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/es" className={buttonClasses("primary", "lg")}>
                Volver al inicio
              </Link>
              <Link
                href="/en"
                lang="en"
                className={buttonClasses("outline", "lg")}
              >
                Back home
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
