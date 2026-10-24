import type { Locale } from "@/i18n/config";

/** Lista de clientes y proveedores. */
const es = {
  kpis: { accounts: "Cuentas", clients: "Clientes activos", mrr: "Ingreso mensual", atRisk: "En riesgo", renewals: "Renuevan en 30 días", tickets: "Solicitudes abiertas" },
  tabs: { all: "Todas", client: "Clientes", provider: "Proveedores", risk: "En riesgo", renewals: "Renovaciones", inactive: "Inactivas" },
  search: "Buscar por nombre, empresa, correo o ciudad",
  filters: { owner: "Responsable", stage: "Etapa", tag: "Etiqueta", any: "Todos", anyTag: "Todas" },
  cols: { name: "Cuenta", stage: "Etapa", health: "Salud", owner: "Responsable", monthly: "Mensual", renewal: "Renovación", tickets: "Solicitudes", lastSeen: "Último acceso" },
  selected: "{n} seleccionadas",
  bulk: { owner: "Asignar responsable", stage: "Cambiar etapa", tag: "Agregar etiqueta", tagPrompt: "Etiqueta a agregar", clear: "Quitar selección" },
  csv: "Exportar CSV",
  newAccount: "Nueva cuenta",
  newHint: "Las cuentas se crean en Usuarios y roles (con acceso al portal).",
  empty: "No hay cuentas con estos filtros.",
  emptyAll: "Aún no hay clientes ni proveedores. Créalos en Usuarios y roles para darles acceso al portal.",
  breached: "{n} vencidas",
  inactiveTag: "Sin acceso",
  selectAll: "Seleccionar todas",
  selectRow: "Seleccionar {name}",
  sortBy: "Ordenar por {col}",
  saved: "Cambios aplicados",
  error: "No se pudieron aplicar los cambios.",
};

export type AccountsListCopy = typeof es;

const en: AccountsListCopy = {
  kpis: { accounts: "Accounts", clients: "Active clients", mrr: "Monthly revenue", atRisk: "At risk", renewals: "Renewing in 30 days", tickets: "Open requests" },
  tabs: { all: "All", client: "Clients", provider: "Providers", risk: "At risk", renewals: "Renewals", inactive: "Inactive" },
  search: "Search by name, company, email or city",
  filters: { owner: "Owner", stage: "Stage", tag: "Tag", any: "All", anyTag: "All" },
  cols: { name: "Account", stage: "Stage", health: "Health", owner: "Owner", monthly: "Monthly", renewal: "Renewal", tickets: "Requests", lastSeen: "Last seen" },
  selected: "{n} selected",
  bulk: { owner: "Assign owner", stage: "Change stage", tag: "Add tag", tagPrompt: "Tag to add", clear: "Clear selection" },
  csv: "Export CSV",
  newAccount: "New account",
  newHint: "Accounts are created in Users & roles (with portal access).",
  empty: "No accounts match these filters.",
  emptyAll: "No clients or providers yet. Create them in Users & roles to give them portal access.",
  breached: "{n} overdue",
  inactiveTag: "No access",
  selectAll: "Select all",
  selectRow: "Select {name}",
  sortBy: "Sort by {col}",
  saved: "Changes applied",
  error: "Couldn't apply the changes.",
};

export const accountsListCopy: Record<Locale, AccountsListCopy> = { es, en };
