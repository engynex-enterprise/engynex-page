import type { Locale } from "@/i18n/config";

/** Pedidos de dominio en el portal. */
const es = {
  title: "Dominios",
  kpis: { open: "Pedidos en curso", registered: "Registrados", revenue: "Ventas pagadas", attention: "Requieren acción" },
  tabs: { open: "En curso", done: "Cerrados", all: "Todos" },
  search: "Buscar dominio, cliente o referencia",
  empty: "No hay pedidos aquí.",
  cols: { domain: "Dominio", customer: "Cliente", price: "Precio", status: "Estado", date: "Fecha", actions: "Acciones" },
  statuses: {
    pending_payment: "Esperando pago",
    manual: "Cobrar a mano",
    paid: "Pagado · registrar",
    registering: "Registrando",
    registered: "Registrado",
    failed: "Error al registrar",
    declined: "Pago rechazado",
    cancelled: "Cancelado",
  } as Record<string, string>,
  actions: {
    register: "Registrar en Hostinger",
    paid: "Marcar pagado",
    markRegistered: "Marcar registrado",
    cancel: "Cancelar",
    confirmCancel: "¿Cancelar este pedido?",
  },
  registered: "Solicitud enviada a Hostinger.",
  registerFailed: "No se pudo registrar",
  hint: "Todo es automático: al aprobarse el pago (aviso de Wompi o consulta activa cada 5 minutos) el dominio se registra a nombre del cliente. «Verificar pago» consulta a Wompi al instante y «Copiar enlace de pago» sirve para reenviarlo al cliente. Los pedidos «Prueba» vienen del modo sandbox y no se compran en Hostinger.",
};

export type DomainOrdersCopy = typeof es;

const en: DomainOrdersCopy = {
  title: "Domains",
  kpis: { open: "Open orders", registered: "Registered", revenue: "Paid sales", attention: "Need action" },
  tabs: { open: "Open", done: "Closed", all: "All" },
  search: "Search domain, customer or reference",
  empty: "No orders here.",
  cols: { domain: "Domain", customer: "Customer", price: "Price", status: "Status", date: "Date", actions: "Actions" },
  statuses: {
    pending_payment: "Awaiting payment",
    manual: "Collect manually",
    paid: "Paid · register",
    registering: "Registering",
    registered: "Registered",
    failed: "Registration error",
    declined: "Payment declined",
    cancelled: "Cancelled",
  },
  actions: { register: "Register at Hostinger", paid: "Mark paid", markRegistered: "Mark registered", cancel: "Cancel", confirmCancel: "Cancel this order?" },
  registered: "Request sent to Hostinger.",
  registerFailed: "Couldn't register",
  hint: "Everything is automatic: once payment is approved (Wompi notice or active check every 5 minutes) the domain is registered in the customer's name. “Check payment” asks Wompi right away and “Copy payment link” lets you resend it. “Test” orders come from sandbox mode and aren't bought at Hostinger.",
};

export const domainOrdersCopy: Record<Locale, DomainOrdersCopy> = { es, en };
