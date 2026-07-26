# Engynex — Sitio web corporativo

Sitio web profesional y bilingüe (Español / Inglés) para **Engynex**, fábrica de
desarrollo digital. Construido con **Next.js 16 (App Router)**, **TypeScript** y
**Tailwind CSS v4**.

- 🎨 Paleta de marca inspirada en Platzi (**azul + verde** sobre navy profundo)
- ✨ Efecto **glass tipo Apple** (glassmorphism), mallas de gradiente e imágenes reales
- 🔤 Tipografía **Mulish** (estilo moderno, tipo SiteGround)
- 🌐 **Bilingüe** con rutas `/es` y `/en` y selector de idioma
- 🧩 **12 servicios**, cada uno con su **página dedicada** (beneficios, entregables, FAQ)
- 🖼️ **23 imágenes reales** autoalojadas en `public/images` (optimizadas con `next/image`)
- 🧰 Funcionalidades: botón flotante de **WhatsApp**, **volver arriba**, **contadores animados** y **acordeón de FAQ**
- 📱 100% responsive (menú móvil, sin scroll horizontal)
- ⚡ Páginas estáticas (SSG), SEO, `sitemap.xml`, `robots.txt` y Open Graph
- ♿ Animaciones respetuosas con `prefers-reduced-motion`

## Requisitos

- Node.js 20+ (probado con Node 26)
- npm

## Comandos

```bash
npm install       # instalar dependencias
npm run dev       # entorno de desarrollo → http://localhost:3000
npm run build     # build de producción
npm run start     # servir el build de producción
npm run lint      # linter (ESLint)
```

Al abrir `/` se redirige automáticamente a `/es` o `/en` según el idioma del
navegador.

## Estructura

```text
app/
  layout.tsx              # layout raíz (pass-through para i18n)
  [locale]/
    layout.tsx            # <html lang>, fuentes, Navbar, Footer, SEO
    page.tsx              # Inicio
    servicios/page.tsx        # Servicios (12 servicios en cuadrícula)
    servicios/[slug]/page.tsx # Página dedicada por servicio
    portafolio/page.tsx   # Portafolio (con filtro por categoría)
    nosotros/page.tsx     # Nosotros (misión, valores, equipo)
    contacto/page.tsx     # Contacto (formulario + datos)
  api/contact/route.ts    # Endpoint del formulario de contacto
  icon.svg, robots.ts, sitemap.ts, not-found.tsx
components/               # Navbar, Footer, tarjetas, secciones y UI base
content/                  # Datos de servicios y portafolio (bilingües)
i18n/                     # Config de idiomas y diccionarios ES/EN
lib/                      # Config del sitio y utilidades
proxy.ts                  # Redirección/detección de idioma (Next 16)
```

## Personalización rápida

- **Textos y traducciones:** [i18n/dictionaries.ts](i18n/dictionaries.ts)
- **Servicios:** [content/services.ts](content/services.ts)
- **Proyectos del portafolio:** [content/portfolio.ts](content/portfolio.ts)
- **Datos de contacto y redes:** [lib/site.ts](lib/site.ts)
  (correo, teléfono, WhatsApp, dominio, redes sociales)
- **Colores y tipografía:** [app/globals.css](app/globals.css) (bloque `@theme`)
- **Imágenes:** en `public/images`. Son fotos reales de [Unsplash](https://unsplash.com)
  (uso libre) a modo de ejemplo; reemplázalas por fotos reales de tu equipo y
  proyectos manteniendo los mismos nombres de archivo.

## Formulario de contacto

El endpoint [app/api/contact/route.ts](app/api/contact/route.ts) valida los datos
y responde OK (registra el mensaje en el log del servidor). Para **enviar correos
reales**, integra un proveedor donde está marcado el `TODO` (por ejemplo
[Resend](https://resend.com), SendGrid o Nodemailer) usando una variable de
entorno como `RESEND_API_KEY`.

## Despliegue

Optimizado para [Vercel](https://vercel.com) (mismos creadores de Next.js):
conecta el repositorio y despliega sin configuración adicional. También funciona
en cualquier hosting con Node.js (`npm run build && npm run start`).

---

© Engynex — Tu fábrica de desarrollo digital.
