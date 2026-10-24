import type { Locale } from "@/i18n/config";

/** Administración de respuestas rápidas. */
const es = {
  subtitle: "Textos listos para responder en un clic. Las variables se reemplazan con los datos de la solicitud.",
  new: "Nueva respuesta",
  search: "Buscar…",
  empty: "Aún no hay respuestas rápidas. Crea la primera.",
  noResults: "Ninguna coincide con la búsqueda.",
  edit: "Editar",
  delete: "Eliminar",
  confirmDelete: "¿Eliminar «{title}»?",
  form: {
    newTitle: "Nueva respuesta rápida",
    editTitle: "Editar respuesta rápida",
    title: "Nombre",
    titlePlaceholder: "Ej.: Pedir captura de pantalla",
    body: "Texto",
    bodyPlaceholder: "Hola {nombre}, …",
    vars: "Insertar variable",
    setStatus: "Al enviar, cambiar el estado a",
    keep: "No cambiar",
    preview: "Vista previa",
    save: "Guardar",
    cancel: "Cancelar",
    required: "Ponle nombre y texto.",
    error: "No se pudo guardar.",
  },
  vars: { nombre: "Nombre del cliente", numero: "N.º de solicitud", asunto: "Asunto" } as Record<string, string>,
  sample: { nombre: "Laura", numero: "1042", asunto: "No llegan los correos" } as Record<string, string>,
  setsStatus: "Cambia a «{status}»",
  chars: "{n} caracteres",
};

export type SupportMacrosCopy = typeof es;

const en: SupportMacrosCopy = {
  subtitle: "Ready-made texts to reply in one click. Variables are replaced with the request's data.",
  new: "New reply",
  search: "Search…",
  empty: "No canned replies yet. Create the first one.",
  noResults: "None match the search.",
  edit: "Edit",
  delete: "Delete",
  confirmDelete: "Delete “{title}”?",
  form: {
    newTitle: "New canned reply",
    editTitle: "Edit canned reply",
    title: "Name",
    titlePlaceholder: "E.g.: Ask for a screenshot",
    body: "Text",
    bodyPlaceholder: "Hi {nombre}, …",
    vars: "Insert variable",
    setStatus: "When sent, change status to",
    keep: "Don't change",
    preview: "Preview",
    save: "Save",
    cancel: "Cancel",
    required: "Give it a name and text.",
    error: "Couldn't save.",
  },
  vars: { nombre: "Client name", numero: "Request no.", asunto: "Subject" },
  sample: { nombre: "Laura", numero: "1042", asunto: "Emails aren't arriving" },
  setsStatus: "Sets “{status}”",
  chars: "{n} characters",
};

export const supportMacrosCopy: Record<Locale, SupportMacrosCopy> = { es, en };
