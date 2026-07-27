import { serviceIcons } from "./icons";
import type { ServiceIcon as ServiceIconKey } from "@/content/services";

export function ServiceIcon({
  name,
  className,
}: {
  name: ServiceIconKey;
  className?: string;
}) {
  const Icon = serviceIcons[name];
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
