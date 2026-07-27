import {
  // Servicios
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
  ServerCog,
  // Productos
  MessagesSquare,
  Handshake,
  LifeBuoy,
  ScanBarcode,
  ReceiptText,
  Boxes,
  Network,
  SquareKanban,
  UsersRound,
  FileSignature,
  GraduationCap,
  CalendarClock,
  // Menú "Nosotros"
  Building2,
  Target,
  Gem,
  History,
  Workflow,
  Users,
  Briefcase,
  MessageCircleQuestion,
  PhoneCall,
  type LucideIcon,
} from "lucide-react";
import type { ServiceIcon as ServiceIconKey } from "@/content/services";
import type { ProductIcon as ProductIconKey } from "@/content/products";

export const serviceIcons: Record<ServiceIconKey, LucideIcon> = {
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
  ServerCog,
};

export const productIcons: Record<ProductIconKey, LucideIcon> = {
  MessagesSquare,
  Handshake,
  LifeBuoy,
  ScanBarcode,
  ReceiptText,
  Boxes,
  Network,
  SquareKanban,
  UsersRound,
  FileSignature,
  GraduationCap,
  CalendarClock,
};

/** Iconos usados solo en el mega menú de "Nosotros". */
export const aboutIcons = {
  Building2,
  Target,
  Gem,
  History,
  Workflow,
  Users,
  Briefcase,
  MessageCircleQuestion,
  PhoneCall,
} satisfies Record<string, LucideIcon>;

/** Nombre de cualquier icono usado en contenido (servicios o productos). */
export type IconName = ServiceIconKey | ProductIconKey | keyof typeof aboutIcons;

/** Registro con todos los iconos de contenido, para resolverlos por nombre. */
export const iconRegistry: Record<string, LucideIcon> = {
  ...serviceIcons,
  ...productIcons,
  ...aboutIcons,
};

/** Icono por defecto cuando el nombre no está registrado. */
export const fallbackIcon: LucideIcon = Rocket;
