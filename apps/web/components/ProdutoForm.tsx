"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { requestJson } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";

export function ProdutoForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await requestJson("/products", {
        method: "POST",
        body: { name },
      });
      setName("");
      showToast("success", "Produto cadastrado.");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro";
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <label htmlFor="prod" className="text-xs text-zinc-500">
          Novo produto
        </label>
        <input
          id="prod"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
          placeholder="Nome do produto"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading && <Spinner className="h-4 w-4 border-white" />}
        {loading ? "Salvando…" : "Adicionar"}
      </button>
      {error && (
        <p className="w-full text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
