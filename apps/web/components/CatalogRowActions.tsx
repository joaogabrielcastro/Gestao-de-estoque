"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { requestJson } from "@/lib/api";
import { DeleteConfirmButton, fetchDelete } from "@/components/DeleteConfirmButton";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";

export function CatalogRowActions({
  kind,
  id,
  name,
}: {
  kind: "client" | "product";
  id: string;
  name: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(name);
  const [saving, setSaving] = useState(false);
  const base = kind === "client" ? "/clients" : "/products";

  async function saveEdit() {
    const trimmed = editName.trim();
    if (!trimmed) {
      showToast("error", "Nome obrigatório.");
      return;
    }
    setSaving(true);
    try {
      await requestJson(`${base}/${id}`, {
        method: "PATCH",
        body: { name: trimmed },
      });
      showToast("success", "Salvo.");
      setEditOpen(false);
      router.refresh();
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => {
          setEditName(name);
          setEditOpen(true);
        }}
        className="rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
      >
        Editar
      </button>
      <DeleteConfirmButton
        title={kind === "client" ? "Excluir cliente?" : "Excluir produto?"}
        description={
          kind === "client"
            ? "Só é possível excluir se não houver entradas ou saídas vinculadas."
            : "Só é possível excluir se o produto não aparecer em nenhuma entrada ou saída."
        }
        onDelete={async () => {
          await fetchDelete(`${base}/${id}`);
          router.refresh();
        }}
      />
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-zinc-900">
              {kind === "client" ? "Editar cliente" : "Editar produto"}
            </h2>
            <label className="mt-4 block text-sm">
              Nome
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveEdit()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {saving && <Spinner className="h-4 w-4 border-white" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
