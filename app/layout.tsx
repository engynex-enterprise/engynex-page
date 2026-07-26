import "./globals.css";

/**
 * Root layout (pass-through).
 * El <html> y <body> reales se renderizan en app/[locale]/layout.tsx,
 * para que el atributo lang refleje el idioma activo (es / en).
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
