"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

/** Ao montar, reaplica filtros salvos se a URL não traz nenhum filtro. */
export function HydrateListFilters({
  storageKey,
  applyWhenEmpty,
}: {
  storageKey: string;
  applyWhenEmpty: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!applyWhenEmpty) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, string>;
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(saved)) {
        if (v) qs.set(k, v);
      }
      if ([...qs.keys()].length === 0) return;
      qs.set("page", "1");
      router.replace(`${pathname}?${qs.toString()}`);
    } catch {
      /* ignore */
    }
  }, [applyWhenEmpty, pathname, router, storageKey]);

  return null;
}

/** Form GET que grava filtros no localStorage ao enviar. */
export function SaveFiltersForm({
  storageKey,
  action,
  children,
}: {
  storageKey: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      method="get"
      onSubmit={(e) => {
        const fd = new FormData(e.currentTarget);
        const obj: Record<string, string> = {};
        fd.forEach((v, k) => {
          if (typeof v === "string" && v.trim() !== "") obj[k] = v.trim();
        });
        delete obj.page;
        try {
          localStorage.setItem(storageKey, JSON.stringify(obj));
        } catch {
          /* quota / private mode */
        }
      }}
    >
      {children}
    </form>
  );
}

export function ClearFiltersLink({
  storageKey,
  href,
  className,
  children,
}: {
  storageKey: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          /* ignore */
        }
      }}
    >
      {children}
    </Link>
  );
}
