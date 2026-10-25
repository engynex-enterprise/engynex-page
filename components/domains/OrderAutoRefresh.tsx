"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Mientras el pedido está en curso, vuelve a leer su estado cada 5 s. */
export function OrderAutoRefresh({ active }: { active: boolean }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(id);
  }, [active, router]);
  return null;
}
