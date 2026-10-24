"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

const slot = () => (typeof document === "undefined" ? null : document.getElementById("portal-title-slot"));
const subscribe = () => () => {};

/**
 * Título de página. Dentro del portal, el título (y su contador, como
 * "Leads 248") va a la barra superior; la descripción y las acciones quedan
 * arriba del contenido.
 */
export function PageHeader({
  title,
  subtitle,
  action,
  count,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  count?: number | string;
}) {
  const target = useSyncExternalStore(subscribe, slot, () => null);
  const heading = (
    <h1 className="portal-page-title flex min-w-0 items-baseline gap-2 truncate text-xl font-semibold text-heading">
      <span className="truncate">{title}</span>
      {count !== undefined && <span className="text-lg font-normal tabular-nums text-muted">{count}</span>}
    </h1>
  );

  return (
    <>
      {target ? createPortal(heading, target) : <div className="mb-2">{heading}</div>}
      {(subtitle || action) && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {subtitle ? <p className="max-w-3xl text-[0.94rem] text-muted">{subtitle}</p> : <span />}
          {action}
        </div>
      )}
    </>
  );
}
