"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

type Client = { id: string; name: string };

type Props = {
  initialClients: Client[];
};

export function ClientesList({ initialClients }: Props) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = useMemo(() => clients.length === 0, [clients]);

  async function handleEdit(client: Client) {
    const nextName = window.prompt("Novo nome do cliente:", client.name)?.trim();
    if (!nextName || nextName === client.name) return;

    setError(null);
    setSavingId(client.id);
    try {
      const res = await fetch(apiUrl(`/clients/${client.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nextName }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || res.statusText);
      }
      setClients((prev) =>
        prev
          .map((row) => (row.id === client.id ? { ...row, name: nextName } : row))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar cliente");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(client: Client) {
    const confirmed = window.confirm(`Excluir cliente "${client.name}"?`);
    if (!confirmed) return;

    setError(null);
    setSavingId(client.id);
    try {
      const res = await fetch(apiUrl(`/clients/${client.id}`), { method: "DELETE" });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || res.statusText);
      }
      setClients((prev) => prev.filter((row) => row.id !== client.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir cliente");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {isEmpty && (
          <li className="px-4 py-6 text-sm text-zinc-500">Nenhum cliente.</li>
        )}
        {clients.map((client) => {
          const busy = savingId === client.id;
          return (
            <li
              key={client.id}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="truncate">{client.name}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleEdit(client)}
                  disabled={busy}
                  className="rounded-md border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-900"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(client)}
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
