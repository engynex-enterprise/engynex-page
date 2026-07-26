import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <html lang="es" className="h-full">
      <body className="flex min-h-full flex-col items-center justify-center bg-navy-950 px-6 py-24 text-center font-sans text-ink-100">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="bg-grid absolute inset-0 opacity-30" />
          <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-blue/20 blur-[130px]" />
        </div>
        <div className="relative">
          <Logo variant="white" />
          <p className="mt-10 text-7xl font-extrabold text-gradient sm:text-8xl">
            404
          </p>
          <h1 className="mt-4 text-2xl font-extrabold text-white">
            Página no encontrada · Page not found
          </h1>
          <p className="mx-auto mt-3 max-w-md text-ink-300">
            La página que buscas no existe o fue movida. / The page you are
            looking for doesn&apos;t exist or was moved.
          </p>
          <Link
            href="/es"
            className="mt-8 inline-flex h-12 items-center justify-center rounded-full bg-brand-green px-8 font-bold text-navy-950 shadow-lg shadow-brand-green/25 transition-all hover:-translate-y-0.5 hover:bg-brand-green-light"
          >
            Volver al inicio / Back home
          </Link>
        </div>
      </body>
    </html>
  );
}
