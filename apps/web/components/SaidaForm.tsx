"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type Client = { id: string; name: string };
type Product = { id: string; name: string };

type Line = {
  productId: string;
  quantity: string;
  unit: "UN" | "CX" | "PAL";
  sector: "A" | "B" | "C" | "D";
};

export function SaidaForm() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState("");
  const [exitInvoiceNumber, setExitInvoiceNumber] = useState("");
  const [withdrawalDate, setWithdrawalDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [pickedUpBy, setPickedUpBy] = useState("");
  const [destination, setDestination] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { productId: "", quantity: "1", unit: "UN", sector: "A" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [c, p] = await Promise.all([
          fetch(apiUrl("/clients")).then((r) => r.json()),
          fetch(apiUrl("/products")).then((r) => r.json()),
        ]);
        setClients(c);
        setProducts(p);
        if (c[0]) setClientId(c[0].id);
        if (p[0]) {
          setLines([{ productId: p[0].id, quantity: "1", unit: "UN", sector: "A" }]);
        }
      } catch {
        setError("Não foi possível carregar clientes/produtos.");
      }
    })();
  }, []);

  function addLine() {
    const pid = products[0]?.id ?? "";
    setLines((prev) => [
      ...prev,
      { productId: pid, quantity: "1", unit: "UN", sector: "A" },
    ]);
  }

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l, j) => (j === i ? { ...l, ...patch } : l))
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const body = {
      clientId,
      exitInvoiceNumber,
      withdrawalDate: new Date(withdrawalDate).toISOString(),
      pickedUpBy,
      destination,
      lines: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unit: l.unit,
        sector: l.sector,
      })),
    };
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/outbounds"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || JSON.stringify(j.issues) || res.statusText);
      }
      router.push("/saidas");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-4">
      <p>
        <Link
          href="/saidas"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400"
        >
          ← Voltar às saídas
        </Link>
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Cliente
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            required
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          NF de saída
          <input
            value={exitInvoiceNumber}
            onChange={(e) => setExitInvoiceNumber(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Data de retirada
          <input
            type="datetime-local"
            value={withdrawalDate}
            onChange={(e) => setWithdrawalDate(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Quem retirou
          <input
            value={pickedUpBy}
            onChange={(e) => setPickedUpBy(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            required
          />
        </label>
        <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
          Destino da carga
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            required
          />
        </label>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Itens (setor de origem)</span>
          <button
            type="button"
            onClick={addLine}
            className="text-sm text-zinc-600 underline dark:text-zinc-400"
          >
            + Linha
          </button>
        </div>
        {lines.map((line, i) => (
          <div
            key={i}
            className="flex flex-wrap items-end gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <label className="min-w-[160px] flex-1 text-xs">
              Produto
              <select
                value={line.productId}
                onChange={(e) => updateLine(i, { productId: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="w-20 text-xs">
              Qtd
              <input
                type="text"
                inputMode="decimal"
                value={line.quantity}
                onChange={(e) => updateLine(i, { quantity: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                required
              />
            </label>
            <label className="w-24 text-xs">
              Un.
              <select
                value={line.unit}
                onChange={(e) =>
                  updateLine(i, { unit: e.target.value as Line["unit"] })
                }
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="UN">UN</option>
                <option value="CX">CX</option>
                <option value="PAL">PAL</option>
              </select>
            </label>
            <label className="w-24 text-xs">
              Setor
              <select
                value={line.sector}
                onChange={(e) =>
                  updateLine(i, {
                    sector: e.target.value as Line["sector"],
                  })
                }
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              >
                {(["A", "B", "C", "D"] as const).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {loading ? "Registrando…" : "Registrar saída"}
      </button>
    </form>
  );
}
