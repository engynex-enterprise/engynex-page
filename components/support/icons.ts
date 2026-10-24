import {
  Globe,
  HelpCircle,
  KeyRound,
  LayoutDashboard,
  Mail,
  Monitor,
  Receipt,
  RefreshCcw,
  ShieldAlert,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { SupportIcon } from "@/content/support";

/**
 * Iconos del centro de soporte. Vive fuera de SupportDesk ("use client")
 * porque la página, que es de servidor, también los usa: un objeto exportado
 * desde un módulo de cliente no llega al servidor.
 */
export const supportIcons: Record<SupportIcon, LucideIcon> = {
  Globe,
  Mail,
  Monitor,
  LayoutDashboard,
  ShieldAlert,
  Wrench,
  Receipt,
  RefreshCcw,
  KeyRound,
  HelpCircle,
};
