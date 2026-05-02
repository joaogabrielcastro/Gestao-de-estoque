"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const searchEnabled = process.env.NEXT_PUBLIC_ENABLE_GLOBAL_SEARCH === "true";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/guia", label: "Guia" },
  { href: "/entradas", label: "Entradas" },
  { href: "/estoque", label: "Estoque" },
  { href: "/movimentacoes", label: "Movimentações" },
  { href: "/saidas", label: "Saídas" },
  { href: "/clientes", label: "Clientes" },
  { href: "/produtos", label: "Produtos" },
  { href: "/relatorios", label: "Relatórios" },
  ...(searchEnabled ? [{ href: "/busca", label: "Busca" } as const] : []),
];

function isNavActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname === "/";
  }
  if (href === "/guia") {
    return pathname === "/guia";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 font-semibold text-zinc-900"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Logo"
            width={112}
            height={40}
            className="h-9 w-auto"
          />
          <span className="hidden sm:inline">Gestão de estoque</span>
        </Link>
        <nav className="flex flex-wrap gap-2 text-sm" aria-label="Principal">
          {links.map((l) => {
            const active = isNavActive(pathname, l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-md px-2 py-1 text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900 ${
                  active
                    ? "border-2 border-red-600 font-semibold text-zinc-900"
                    : "border-2 border-transparent"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
