import {
  Globe,
  LayoutDashboard,
  Smartphone,
  ShoppingCart,
  Palette,
  Megaphone,
  Clapperboard,
  Bot,
  Cloud,
  ShieldCheck,
  Server,
  Rocket,
  BarChart3,
  Plug,
  Headset,
  type LucideIcon,
} from "lucide-react";
import type { ServiceIcon as ServiceIconKey } from "@/content/services";

const map: Record<ServiceIconKey, LucideIcon> = {
  Globe,
  LayoutDashboard,
  Smartphone,
  ShoppingCart,
  Palette,
  Megaphone,
  Clapperboard,
  Bot,
  Cloud,
  ShieldCheck,
  Server,
  Rocket,
  BarChart3,
  Plug,
  Headset,
};

export function ServiceIcon({
  name,
  className,
}: {
  name: ServiceIconKey;
  className?: string;
}) {
  const Icon = map[name];
  return <Icon className={className} strokeWidth={1.75} aria-hidden />;
}
