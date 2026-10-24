import type { WaTemplate } from "@/lib/supabase/types";

/** Reemplaza {{n}} por el valor n (o lo deja marcado si falta). */
export function fillTemplate(text: string, values: string[]) {
  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n: string) => values[Number(n) - 1] || `{{${n}}}`);
}

/** Burbuja con el aspecto de un mensaje de WhatsApp. */
export function TemplatePreview({
  template,
  values,
  caption,
}: {
  template: Pick<WaTemplate, "header" | "body" | "footer">;
  values: string[];
  caption?: string;
}) {
  return (
    <figure className="rounded-lg bg-[#efeae2] p-4 dark:bg-[#0b141a]">
      {caption && <figcaption className="mb-3 text-center text-xs font-semibold text-[#54656f] dark:text-[#8696a0]">{caption}</figcaption>}
      <div className="max-w-[92%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-[0.9rem] leading-relaxed text-[#111b21] shadow-sm dark:bg-[#202c33] dark:text-[#e9edef]">
        {template.header && <p className="mb-1 font-bold">{template.header}</p>}
        <p className="whitespace-pre-wrap break-words">{fillTemplate(template.body, values)}</p>
        {template.footer && <p className="mt-1.5 text-xs text-[#667781] dark:text-[#8696a0]">{template.footer}</p>}
      </div>
    </figure>
  );
}
