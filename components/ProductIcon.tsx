import { productIcons } from "./icons";
import type { ProductIcon as ProductIconKey } from "@/content/products";

export function ProductIcon({
  name,
  className,
}: {
  name: ProductIconKey;
  className?: string;
}) {
  const Icon = productIcons[name];
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
