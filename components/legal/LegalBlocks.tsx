import { Fragment } from "react";
import Link from "next/link";
import type { LegalBlock } from "@/content/legal";
import type { Locale } from "@/i18n/config";
import { localizedHref } from "@/lib/site";

const linkClass =
  "font-semibold text-heading underline decoration-line-strong underline-offset-4 transition-colors hover:decoration-current";

/**
 * Convierte el texto plano de un documento en nodos: `[texto](doc:slug)`
 * enlaza a otro documento legal, `[texto](#id)` a una sección y los correos
 * electrónicos se enlazan solos.
 */
function renderInline(text: string, locale: Locale): React.ReactNode[] {
  const pattern = /\[([^\]]+)\]\(([^)]+)\)|([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g;
  const nodes: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[3]) {
      // Un correo al final de una frase no debe arrastrar el punto.
      const address = match[3].replace(/\.$/, "");
      nodes.push(
        <a key={key++} href={`mailto:${address}`} className={linkClass}>
          {address}
        </a>,
      );
      if (address.length < match[3].length) nodes.push(".");
    } else {
      const [, label, target] = match;
      const href = target.startsWith("doc:")
        ? localizedHref(locale, `legal/${target.slice(4)}`)
        : target;
      nodes.push(
        <Link key={key++} href={href} className={linkClass}>
          {label}
        </Link>,
      );
    }
    last = pattern.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function LegalBlocks({
  blocks,
  locale,
}: {
  blocks: LegalBlock[];
  locale: Locale;
}) {
  return (
    <>
      {blocks.map((block, i) => {
        if (typeof block === "string") {
          return (
            <p key={i} className="mt-4 text-base leading-relaxed text-body first:mt-0">
              {renderInline(block, locale)}
            </p>
          );
        }
        const ListTag = block.ordered ? "ol" : "ul";
        return (
          <ListTag
            key={i}
            className={`mt-4 space-y-2 pl-6 text-base leading-relaxed text-body first:mt-0 marker:text-muted ${
              block.ordered ? "list-decimal" : "list-disc"
            }`}
          >
            {block.list.map((item, j) => (
              <li key={j} className="pl-1">
                <Fragment>{renderInline(item, locale)}</Fragment>
              </li>
            ))}
          </ListTag>
        );
      })}
    </>
  );
}
