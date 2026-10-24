import { Fragment, type ReactNode } from "react";

/**
 * Texto del chat con formato ligero (el mismo de WhatsApp):
 * *negrita* o **negrita**, _cursiva_ y enlaces automáticos. Nada de HTML.
 */
const TOKEN = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|_[^_\n]+_|https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g;

export function RichText({ text, linkClassName }: { text: string; linkClassName?: string }) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        let node: ReactNode = part;
        if (/^https?:\/\//.test(part)) {
          node = (
            <a href={part} target="_blank" rel="noopener noreferrer nofollow" className={linkClassName ?? "underline underline-offset-2"}>
              {part}
            </a>
          );
        } else if (/^\*\*[^*]+\*\*$/.test(part)) {
          node = <strong>{part.slice(2, -2)}</strong>;
        } else if (/^\*[^*]+\*$/.test(part)) {
          node = <strong>{part.slice(1, -1)}</strong>;
        } else if (/^_[^_]+_$/.test(part)) {
          node = <em>{part.slice(1, -1)}</em>;
        }
        return <Fragment key={i}>{node}</Fragment>;
      })}
    </>
  );
}
