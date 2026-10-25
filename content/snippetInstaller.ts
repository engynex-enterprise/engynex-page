import type { Locale } from "@/i18n/config";

const es = {
  title: "Pegar el código de instalación",
  hint: "Pega aquí el código que te da el proveedor (por ejemplo, el de «Instalar Google Tag Manager»). Reconocemos el ID y lo instalamos en todas las páginas del sitio: no hay que tocar el código ni a un programador.",
  placeholder: "<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){…})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>",
  found: "Encontramos:",
  notFound: "No encontramos un ID válido en ese código. Revisa que hayas copiado el código completo.",
  install: "Instalar en el sitio",
  done: "Instalado. Ya está activo en todas las páginas.",
  error: "No se pudo instalar. Revisa que tengas permisos de administrador.",
  installed: "Instalado · {id}",
  consent: "Se carga cuando el visitante acepta las cookies (Consent Mode v2)",
  alwaysOn: "Va en todas las páginas, sin cookies",
  activeCode: "Código equivalente que el sitio pone en cada página:",
  copy: "Copiar código",
  copied: "Copiado",
  headLabel: "1. Código del <head>",
  headHint: "El primer cuadro de Google: «Pegue este código lo más arriba posible en la sección <head>».",
  bodyLabel: "2. Código del <body>",
  bodyHint: "El segundo cuadro de Google: «Pegue este código justo después de la etiqueta de apertura <body>».",
  mismatch: "Los dos códigos son de contenedores distintos ({a} y {b}). Copia ambos del mismo contenedor.",
  installedHead: "Instalado en el <head> de todas las páginas",
  installedBody: "Instalado justo después de <body> en todas las páginas",
  testTitle: "3. Probar el sitio",
  testHint: "En Google Tag Manager usa «Vista previa» (o el campo «Pruebe su sitio web») con la dirección publicada del sitio y acepta las cookies del banner: el script del <head> carga después de aceptar. localhost no se puede probar desde Google.",
};

export type SnippetCopy = typeof es;

const en: SnippetCopy = {
  title: "Paste the installation code",
  hint: "Paste the code your provider gives you (e.g. “Install Google Tag Manager”). We detect the ID and install it on every page of the site: no code changes or developer needed.",
  placeholder: "<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){…})(window,document,'script','dataLayer','GTM-XXXXXXX');</script>",
  found: "Found:",
  notFound: "We couldn't find a valid ID in that code. Make sure you copied the whole code.",
  install: "Install on the site",
  done: "Installed. It's live on every page.",
  error: "Couldn't install. Check you have admin permissions.",
  installed: "Installed · {id}",
  consent: "Loads once the visitor accepts cookies (Consent Mode v2)",
  alwaysOn: "On every page, no cookies",
  activeCode: "Equivalent code the site adds to each page:",
  copy: "Copy code",
  copied: "Copied",
  headLabel: "1. <head> code",
  headHint: "Google's first box: “Paste this code as high in the <head> of the page as possible”.",
  bodyLabel: "2. <body> code",
  bodyHint: "Google's second box: “Paste this code immediately after the opening <body> tag”.",
  mismatch: "The two codes belong to different containers ({a} and {b}). Copy both from the same container.",
  installedHead: "Installed in the <head> of every page",
  installedBody: "Installed right after <body> on every page",
  testTitle: "3. Test the site",
  testHint: "In Google Tag Manager use “Preview” (or “Test your website”) with the published site address and accept the cookie banner: the <head> script loads after consent. localhost can't be tested from Google.",
};

export const snippetCopy: Record<Locale, SnippetCopy> = { es, en };
