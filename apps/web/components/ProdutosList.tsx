"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

type Product = { id: string; name: string };

type Props = {
  initialProducts: Product[];
};

export function ProdutosList({ initialProducts }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = useMemo(() => products.length === 0, [products]);

  async function handleEdit(product: Product) {
    const nextName = window.prompt("Novo nome do produto:", product.name)?.trim();
    if (!nextName || nextName === product.name) return;

    setError(null);
    setSavingId(product.id);
    try {
      const res = await fetch(apiUrl(`/products/${product.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || res.statusText);
      }
      setProducts((prev) =>
        prev
          .map((row) => (row.id === product.id ? { ...row, name: nextName } : row))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar produto");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(`Excluir produto "${product.name}"?`);
    if (!confirmed) return;

    setError(null);
    setSavingId(product.id);
    try {
      const res = await fetch(apiUrl(`/products/${product.id}`), { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || res.statusText);
      }
      setProducts((prev) => prev.filter((row) => row.id !== product.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir produto");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {isEmpty && (
          <li className="px-4 py-6 text-sm text-zinc-500">Nenhum produto.</li>
        )}
        {products.map((product) => {
          const busy = savingId === product.id;
          return (
            <li
              key={product.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="truncate">{product.name}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleEdit(product)}
                  disabled={busy}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(product)}
                  disabled={busy}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  Excluir
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </>
  );
}
