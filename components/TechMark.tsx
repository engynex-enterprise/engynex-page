import Image from "next/image";
import { Braces, KeyRound, Webhook } from "lucide-react";
import { techIcon } from "@/lib/techIcons";
import { cn } from "@/lib/utils";

const genericIcons = { braces: Braces, webhook: Webhook, key: KeyRound };

/**
 * Logo de una tecnología: la marca real (simple-icons o su logo oficial), un icono
 * genérico para conceptos (REST, Webhooks…) o un monograma cuando la marca
 * no tiene logo libre. Es decorativo: el nombre siempre va como texto aparte.
 */
export function TechMark({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const icon = techIcon(name);

  if (icon.kind === "brand") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className={className}
        fill={icon.hex}
      >
        <path d={icon.path} />
      </svg>
    );
  }

  if (icon.kind === "image") {
    return <Image src={icon.src} alt="" aria-hidden width={24} height={24} unoptimized className={cn("object-contain", className)} />;
  }

  if (icon.kind === "generic") {
    const Icon = genericIcons[icon.icon];
    return (
      <Icon className={cn("text-deep-700", className)} strokeWidth={1.75} aria-hidden />
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <rect width="24" height="24" rx="7" fill="#1F2A46" />
      <text
        x="12"
        y="12"
        dy="0.36em"
        textAnchor="middle"
        fontSize={icon.text.length > 1 ? 9.5 : 12}
        fontWeight={700}
        fill="#9FDB4F"
        fontFamily="var(--font-figtree), sans-serif"
      >
        {icon.text}
      </text>
    </svg>
  );
}
