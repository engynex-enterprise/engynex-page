"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  KeyRound,
  Loader2,
  MoreHorizontal,
  Plus,
  Power,
  Search,
  ShieldCheck,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AccountKind, AppRole, Profile } from "@/lib/supabase/types";
import { buttonClasses } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { inputClass } from "@/components/auth/inputClass";
import { portalCopy, rolesByKind } from "@/content/portal";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

type Row = Pick<
  Profile,
  | "id"
  | "email"
  | "full_name"
  | "kind"
  | "role"
  | "active"
  | "must_change_password"
  | "last_seen_at"
  | "company"
>;

type Dialog =
  | { type: "create" }
  | { type: "edit"; user: Row }
  | { type: "temp"; name: string; password: string }
  | null;

const KINDS: AccountKind[] = ["employee", "client", "provider"];

/** Gestión de usuarios y roles (solo administradores). */
export function UsersManager({
  locale,
  users,
  currentUserId,
}: {
  locale: Locale;
  users: Row[];
  currentUserId: string;
}) {
  const t = portalCopy[locale].portal;
  const u = t.users;
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<AccountKind | "all">("all");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(
      (row) =>
        (kindFilter === "all" || row.kind === kindFilter) &&
        (!q ||
          row.email.toLowerCase().includes(q) ||
          (row.full_name ?? "").toLowerCase().includes(q)),
    );
  }, [users, query, kindFilter]);

  const fail = (message: string) => {
    const key = Object.keys(u.errors).find((k) => message.includes(k)) as
      | keyof typeof u.errors
      | undefined;
    setError(u.errors[key ?? "generic"]);
  };

  const toggleActive = async (row: Row) => {
    setBusy(row.id);
    setError(null);
    const { error: rpcError } = await createClient().rpc("admin_set_active", {
      p_user: row.id,
      p_active: !row.active,
    });
    setBusy(null);
    if (rpcError) return fail(rpcError.message);
    router.refresh();
  };

  const resetPassword = async (row: Row) => {
    setBusy(row.id);
    setError(null);
    const { data, error: rpcError } = await createClient().rpc("admin_reset_password", {
      p_user: row.id,
    });
    setBusy(null);
    if (rpcError) return fail(rpcError.message);
    setDialog({
      type: "temp",
      name: row.full_name ?? row.email,
      password: (data as { temp_password: string }).temp_password,
    });
    router.refresh();
  };

  const lastSeen = (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(locale, {
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "America/Bogota",
        }).format(new Date(iso))
      : u.never;

  return (
    <>
      {/* Barra de herramientas */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block sm:w-80">
            <span className="sr-only">{u.search}</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={u.search}
              className={cn(inputClass, "h-11 rounded-full pl-10")}
            />
          </label>
          <div role="group" aria-label={u.columns.kind} className="flex gap-1.5">
            {(["all", ...KINDS] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kindFilter === k}
                onClick={() => setKindFilter(k)}
                className={cn(
                  "h-9 rounded-full px-4 text-sm font-semibold transition-colors",
                  kindFilter === k
                    ? "bg-deep-700 text-white dark:bg-white dark:text-deep-700"
                    : "text-heading ring-1 ring-line-strong hover:bg-surface",
                )}
              >
                {k === "all" ? u.all : t.kindLabel[k]}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setError(null);
            setDialog({ type: "create" });
          }}
          className={buttonClasses("primary", "md")}
        >
          <Plus className="h-4 w-4" aria-hidden />
          {u.create}
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg bg-surface shadow-meta dark:bg-card">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs text-muted">
              <th scope="col" className="px-5 py-3 font-semibold">{u.columns.user}</th>
              <th scope="col" className="px-5 py-3 font-semibold">{u.columns.kind}</th>
              <th scope="col" className="px-5 py-3 font-semibold">{u.columns.role}</th>
              <th scope="col" className="px-5 py-3 font-semibold">{u.columns.status}</th>
              <th scope="col" className="px-5 py-3 font-semibold">{u.columns.lastSeen}</th>
              <th scope="col" className="px-5 py-3"><span className="sr-only">{u.actions}</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((row) => (
              <tr key={row.id} className={cn(!row.active && "opacity-60")}>
                <td className="px-5 py-3.5">
                  <p className="font-bold text-heading">{row.full_name ?? row.email}</p>
                  <p className="text-xs text-muted">
                    {row.email}
                    {row.company ? ` · ${row.company}` : ""}
                  </p>
                </td>
                <td className="px-5 py-3.5 text-body">{t.kindLabel[row.kind]}</td>
                <td className="px-5 py-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-2.5 py-1 text-xs font-bold text-heading dark:bg-white/[0.08]">
                    {row.role === "admin" && <ShieldCheck className="h-3.5 w-3.5 text-accent" aria-hidden />}
                    {t.roleLabel[row.role]}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="flex items-center gap-2 text-body">
                    <span className={cn("h-2 w-2 rounded-full", row.active ? "bg-emerald-500" : "bg-deep-400")} aria-hidden />
                    {row.active ? u.active : u.inactive}
                  </span>
                  {row.must_change_password && (
                    <span className="mt-0.5 block text-xs text-muted">{u.pending}</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-body">{lastSeen(row.last_seen_at)}</td>
                <td className="px-5 py-3.5 text-right">
                  {busy === row.id ? (
                    <Loader2 className="ml-auto h-4 w-4 animate-spin text-muted" aria-hidden />
                  ) : (
                    <RowActions
                      labels={u}
                      row={row}
                      isSelf={row.id === currentUserId}
                      onEdit={() => {
                        setError(null);
                        setDialog({ type: "edit", user: row });
                      }}
                      onToggle={() => toggleActive(row)}
                      onReset={() => resetPassword(row)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {dialog?.type === "create" && (
        <UserDialog
          locale={locale}
          mode="create"
          onClose={() => setDialog(null)}
          onCreated={(name, password) => {
            setDialog({ type: "temp", name, password });
            router.refresh();
          }}
        />
      )}
      {dialog?.type === "edit" && (
        <UserDialog
          locale={locale}
          mode="edit"
          user={dialog.user}
          onClose={() => setDialog(null)}
          onCreated={() => {
            setDialog(null);
            router.refresh();
          }}
        />
      )}
      {dialog?.type === "temp" && (
        <TempPasswordDialog
          locale={locale}
          name={dialog.name}
          password={dialog.password}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */

function RowActions({
  labels,
  row,
  isSelf,
  onEdit,
  onToggle,
  onReset,
}: {
  labels: (typeof portalCopy)["es"]["portal"]["users"];
  row: Row;
  isSelf: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-heading hover:bg-surface-soft dark:hover:bg-white/[0.06]";
  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`${labels.actions}: ${row.full_name ?? row.email}`}
        className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface-soft hover:text-heading dark:hover:bg-white/[0.08]"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-20 mt-1 w-60 rounded-lg bg-surface p-1.5 text-left shadow-[0_16px_40px_-12px_rgba(11,16,32,0.35)] shadow-meta dark:bg-card">
          <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); onEdit(); }}>
            <ShieldCheck className="h-4 w-4 text-muted" aria-hidden />
            {labels.edit}
          </button>
          <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); onReset(); }}>
            <KeyRound className="h-4 w-4 text-muted" aria-hidden />
            {labels.resetPassword}
          </button>
          {!isSelf && (
            <button role="menuitem" type="button" className={item} onClick={() => { setOpen(false); onToggle(); }}>
              <Power className="h-4 w-4 text-muted" aria-hidden />
              {row.active ? labels.deactivate : labels.activate}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(event) => event.target === ref.current && ref.current?.close()}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-[2rem] bg-surface p-0 text-heading shadow-2xl backdrop:bg-black/55 dark:bg-card"
    >
      <div className="px-6 py-7 sm:px-9 sm:py-9">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl text-heading">{title}</h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="×"
            className="-mr-2 -mt-1 grid h-10 w-10 place-items-center rounded-full hover:bg-card-soft"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6">{children}</div>
      </div>
    </dialog>
  );
}

function UserDialog({
  locale,
  mode,
  user,
  onClose,
  onCreated,
}: {
  locale: Locale;
  mode: "create" | "edit";
  user?: Row;
  onClose: () => void;
  onCreated: (name: string, password: string) => void;
}) {
  const t = portalCopy[locale].portal;
  const u = t.users;
  const id = useId();
  const [values, setValues] = useState({
    full_name: user?.full_name ?? "",
    email: user?.email ?? "",
    phone: "",
    company: user?.company ?? "",
    kind: (user?.kind ?? "employee") as AccountKind,
    role: (user?.role ?? "sales") as AppRole,
  });
  const [status, setStatus] = useState<"idle" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);

  const setKind = (kind: AccountKind) =>
    setValues((v) => ({
      ...v,
      kind,
      role: rolesByKind[kind].includes(v.role) ? v.role : rolesByKind[kind][0],
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    const supabase = createClient();
    if (mode === "create") {
      const { data, error: rpcError } = await supabase.rpc("admin_create_user", {
        p_email: values.email,
        p_full_name: values.full_name,
        p_kind: values.kind,
        p_role: values.role,
        p_phone: values.phone || null,
        p_company: values.company || null,
      });
      setStatus("idle");
      if (rpcError) {
        const key = Object.keys(u.errors).find((k) => rpcError.message.includes(k)) as
          | keyof typeof u.errors
          | undefined;
        return setError(u.errors[key ?? "generic"]);
      }
      onCreated(values.full_name || values.email, (data as { temp_password: string }).temp_password);
    } else if (user) {
      const { error: rpcError } = await supabase.rpc("admin_set_role", {
        p_user: user.id,
        p_kind: values.kind,
        p_role: values.role,
      });
      setStatus("idle");
      if (rpcError) {
        const key = Object.keys(u.errors).find((k) => rpcError.message.includes(k)) as
          | keyof typeof u.errors
          | undefined;
        return setError(u.errors[key ?? "generic"]);
      }
      onCreated("", "");
    }
  };

  const text = (key: "full_name" | "email" | "phone" | "company", label: string, type = "text") => (
    <div>
      <label htmlFor={`${id}-${key}`} className="mb-2 block text-sm font-semibold text-heading">
        {label}
      </label>
      <input
        id={`${id}-${key}`}
        type={type}
        value={values[key]}
        onChange={(event) => setValues((v) => ({ ...v, [key]: event.target.value }))}
        required={key === "full_name" || key === "email"}
        className={inputClass}
      />
    </div>
  );

  return (
    <Modal title={mode === "create" ? u.createTitle : u.editTitle} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-5">
        {mode === "create" ? (
          <>
            {text("full_name", u.fullName)}
            {text("email", u.email, "email")}
            <div className="grid gap-5 sm:grid-cols-2">
              {text("phone", u.phone, "tel")}
              {text("company", u.company)}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted">
            <span className="font-bold text-heading">{user?.full_name ?? user?.email}</span> · {user?.email}
          </p>
        )}
        <Select
          size="md"
          label={u.kind}
          value={values.kind}
          onChange={(v) => setKind(v as AccountKind)}
          options={KINDS.map((k) => ({ value: k, label: t.kindLabel[k] }))}
        />
        <div>
          <Select
            size="md"
            label={u.role}
            value={values.role}
            onChange={(v) => setValues((s) => ({ ...s, role: v as AppRole }))}
            options={rolesByKind[values.kind].map((r) => ({ value: r, label: t.roleLabel[r] }))}
          />
          <p className="mt-2 text-xs text-muted">{u.roleHelp[values.role]}</p>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-500/10 px-4 py-3 text-sm font-medium text-red-700 dark:text-red-300">
            {error}
          </p>
        )}
        <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={buttonClasses("outline", "md")}>
            {u.cancel}
          </button>
          <button type="submit" disabled={status === "saving"} className={buttonClasses("primary", "md")}>
            {status === "saving" && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {mode === "create" ? u.createSubmit : u.save}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function TempPasswordDialog({
  locale,
  name,
  password,
  onClose,
}: {
  locale: Locale;
  name: string;
  password: string;
  onClose: () => void;
}) {
  const u = portalCopy[locale].portal.users;
  const [copied, setCopied] = useState(false);
  return (
    <Modal title={u.tempTitle} onClose={onClose}>
      <p className="text-sm leading-relaxed text-body">{u.tempText.replace("{name}", name)}</p>
      <div className="mt-5 flex items-center gap-2 rounded-lg bg-surface-soft p-2 pl-5 dark:bg-white/[0.06]">
        <code className="min-w-0 flex-1 truncate font-mono text-lg font-bold tracking-wide text-heading">
          {password}
        </code>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(password);
            setCopied(true);
          }}
          className={buttonClasses("dark", "md")}
        >
          {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
          {copied ? u.copied : u.copy}
        </button>
      </div>
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={onClose} className={buttonClasses("primary", "md")}>
          {u.done}
        </button>
      </div>
    </Modal>
  );
}
