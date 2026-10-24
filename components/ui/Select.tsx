"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  /** Encabezado del grupo al que pertenece (se pinta una sola vez). */
  group?: string;
}

/**
 * Desplegable al estilo de meta.com.
 *
 * El campo lleva la etiqueta dentro, encima del valor, y la flecha a la
 * derecha. Al abrir, la lista aparece debajo con filas altas; la opción
 * elegida va sobre gris, en negrita y con ✓.
 *
 * Sigue el patrón ARIA "combobox" de solo selección: el foco se queda en el
 * botón y las flechas, Inicio/Fin, Enter, Espacio, Esc y escribir las
 * primeras letras recorren la lista. La lista usa `position: fixed`, así que
 * no la recorta un contenedor con scroll (por ejemplo, un `<dialog>`).
 *
 * Con `name`, envía su valor en un campo oculto, como un `<select>`.
 */
export function Select({
  label,
  options,
  value: controlled,
  defaultValue = "",
  onChange,
  name,
  placeholder,
  invalid = false,
  size = "lg",
  className,
}: {
  label: string;
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  name?: string;
  /** Texto cuando aún no hay valor. */
  placeholder?: string;
  invalid?: boolean;
  /**
   * `lg` es el campo grande del modal; `md`, el de formularios; `sm`, una
   * píldora compacta para barras de filtros (la etiqueta queda solo para
   * lectores de pantalla).
   */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const baseId = useId();
  const listId = `${baseId}-list`;
  const labelId = `${baseId}-label`;
  const optionId = (i: number) => `${baseId}-opt-${i}`;

  const [internal, setInternal] = useState(defaultValue);
  const value = controlled ?? internal;
  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState<{
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", timer: 0 });

  const choose = (index: number) => {
    const option = options[index];
    if (!option) return;
    if (controlled === undefined) setInternal(option.value);
    onChange?.(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const openList = (index = Math.max(selectedIndex, 0)) => {
    setActive(index);
    setOpen(true);
  };

  /** Coloca la lista bajo el campo, o encima si abajo no cabe. */
  const place = useCallback(() => {
    const box = buttonRef.current?.getBoundingClientRect();
    if (!box) return;
    const gap = 8;
    const below = window.innerHeight - box.bottom - gap - 12;
    const above = box.top - gap - 12;
    const up = below < 240 && above > below;
    setRect({
      left: box.left,
      width: box.width,
      ...(up
        ? { bottom: window.innerHeight - box.top + gap }
        : { top: box.bottom + gap }),
      maxHeight: Math.min(Math.max(up ? above : below, 160), 440),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  // Clic fuera del campo y de la lista: cierra.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        listRef.current?.contains(target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Mantiene visible la opción activa al moverse con el teclado.
  useEffect(() => {
    if (!open) return;
    document
      .getElementById(optionId(active))
      ?.scrollIntoView({ block: "nearest" });
    // optionId solo depende de baseId, que no cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const last = options.length - 1;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.min(i + 1, last));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!open) openList();
        else setActive((i) => Math.max(i - 1, 0));
        return;
      case "Home":
        if (open) {
          event.preventDefault();
          setActive(0);
        }
        return;
      case "End":
        if (open) {
          event.preventDefault();
          setActive(last);
        }
        return;
      case "Enter":
      case " ":
        event.preventDefault();
        if (open) choose(active);
        else openList();
        return;
      case "Escape":
        if (open) {
          // Solo cierra la lista, no el modal que la contiene.
          event.preventDefault();
          event.stopPropagation();
          setOpen(false);
        }
        return;
      case "Tab":
        setOpen(false);
        return;
    }
    // Escribir salta a la primera opción que empieza por esas letras.
    if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
      const state = typeahead.current;
      window.clearTimeout(state.timer);
      state.text += event.key.toLowerCase();
      state.timer = window.setTimeout(() => (state.text = ""), 600);
      const match = options.findIndex((o) =>
        o.label.toLowerCase().startsWith(state.text),
      );
      if (match >= 0) {
        if (open) setActive(match);
        else openList(match);
      }
    }
  };

  const big = size === "lg";
  const small = size === "sm";

  return (
    <div className={cn("relative", className)}>
      {name && <input type="hidden" name={name} value={value} />}

      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={labelId}
        aria-activedescendant={open ? optionId(active) : undefined}
        aria-invalid={invalid || undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "relative flex w-full flex-col items-start justify-center border bg-surface text-left outline-none transition-colors dark:bg-card",
          small ? "rounded-[var(--btn-radius,9999px)]" : "rounded-[var(--field-radius,1rem)]",
          big
            ? "h-[4.75rem] pl-5 pr-14 sm:pl-8"
            : small
              ? "h-9 pl-4 pr-10"
              : "h-16 pl-4 pr-12",
          invalid
            ? "border-red-500"
            : "border-line-strong hover:border-muted",
          // Foco y abierto: borde de 2 px en el color de acción (sin mover el
          // contenido: el borde de 1 px se dibuja con sombra interior).
          open || invalid
            ? ""
            : "focus-visible:border-deep-700 focus-visible:shadow-[inset_0_0_0_1px_var(--color-deep-700)] dark:focus-visible:border-brand-green dark:focus-visible:shadow-[inset_0_0_0_1px_var(--color-brand-green)]",
          open &&
            "border-deep-700 shadow-[inset_0_0_0_1px_var(--color-deep-700)] dark:border-brand-green dark:shadow-[inset_0_0_0_1px_var(--color-brand-green)]",
        )}
      >
        <span
          id={labelId}
          className={cn(small ? "sr-only" : "text-muted", big ? "text-sm" : "text-xs")}
        >
          {label}
        </span>
        <span
          className={cn(
            "block w-full truncate",
            big ? "mt-0.5 text-xl" : small ? "text-sm font-semibold" : "mt-0.5 text-base",
            selected ? "text-heading" : "text-muted",
          )}
        >
          {selected?.label ?? placeholder ?? " "}
        </span>
        <ChevronDown
          aria-hidden
          strokeWidth={1.6}
          className={cn(
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-heading transition-transform duration-200",
            big
              ? "right-5 h-6 w-6 sm:right-8"
              : small
                ? "right-3 h-4 w-4"
                : "right-4 h-5 w-5",
            open && "rotate-180",
          )}
        />
      </button>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        aria-labelledby={labelId}
        tabIndex={-1}
        hidden={!open}
        style={
          rect
            ? {
                left: rect.left,
                width: rect.width,
                top: rect.top,
                bottom: rect.bottom,
                maxHeight: rect.maxHeight,
              }
            : undefined
        }
        className="fixed z-[100] overflow-y-auto overscroll-contain rounded-[var(--field-radius,1rem)] border border-line bg-surface py-1 shadow-[0_12px_40px_-12px_rgba(11,16,32,0.35)] dark:bg-card"
      >
        {options.map((option, i) => {
          const isSelected = i === selectedIndex;
          const showGroup =
            option.group && option.group !== options[i - 1]?.group;
          return (
            <li key={`${option.group ?? ""}-${option.value}`} role="none">
              {showGroup && (
                <p
                  role="presentation"
                  className={cn(
                    "px-5 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-muted sm:px-8",
                    i > 0 && "border-t border-line",
                  )}
                >
                  {option.group}
                </p>
              )}
              <div
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActive(i)}
                onClick={() => choose(i)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 px-5 text-heading sm:px-8",
                  big ? "min-h-14 py-3 text-lg" : "min-h-12 py-2.5 text-base",
                  (i === active || isSelected) &&
                    "bg-surface-soft dark:bg-white/[0.06]",
                  isSelected && "font-bold",
                )}
              >
                <span className="min-w-0">{option.label}</span>
                {isSelected && (
                  <Check
                    aria-hidden
                    strokeWidth={2}
                    className={cn("shrink-0", big ? "h-6 w-6" : "h-5 w-5")}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
