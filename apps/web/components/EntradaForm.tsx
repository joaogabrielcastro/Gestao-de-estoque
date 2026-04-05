"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

type Client = { id: string; name: string };
type Product = { id: string; name: string };

type Line = { productId: string; quantity: string; unit: "UN" | "CX" | "PAL" };

export function EntradaForm() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [supplierOrBrand, setSupplierOrBrand] = useState("");
  const [sector, setSector] = useState<"A" | "B" | "C" | "D">("A");
  const [invoiceText, setInvoiceText] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { productId: "", quantity: "1", unit: "UN" },
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
          setLines((prev) =>
            prev.length === 1 && !prev[0].productId
              ? [{ productId: p[0].id, quantity: "1", unit: "UN" }]
              : prev
          );
        }
      } catch {
        setError("Não foi possível carregar clientes/produtos.");
      }
    })();
  }, []);

  function addLine() {
    const pid = products[0]?.id ?? "";
    setLines((prev) => [...prev, { productId: pid, quantity: "1", unit: "UN" }]);
  }

  function updateLine(i: number, patch: Partial<Line>) {
    setLines((prev) =>
      prev.map((l, j) => (j === i ? { ...l, ...patch } : l))
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const invoiceNumbers = invoiceText
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (invoiceNumbers.length === 0) {
      setError("Informe ao menos um número de NF.");
      return;
    }
    const body = {
      clientId,
      destinationCity,
      supplierOrBrand: supplierOrBrand || undefined,
      sector,
      invoiceNumbers,
      lines: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unit: l.unit,
      })),
    };
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/inbounds"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || JSON.stringify(j.issues) || res.statusText);
      }
      router.push("/entradas");
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
          href="/entradas"
          className="text-sm text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400"
        >
          ← Voltar às entradas
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
          Cidade de destino
          <input
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Fornecedor / marca (opcional)
          <input
            value={supplierOrBrand}
            onChange={(e) => setSupplierOrBrand(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Setor
          <select
            value={sector}
            onChange={(e) =>
              setSector(e.target.value as "A" | "B" | "C" | "D")
            }
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            {(["A", "B", "C", "D"] as const).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        Números das NFs (um por linha ou separados por vírgula)
        <textarea
          value={invoiceText}
          onChange={(e) => setInvoiceText(e.target.value)}
          rows={3}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
          required
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Produtos</span>
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
            <label className="min-w-[180px] flex-1 text-xs">
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
            <label className="w-24 text-xs">
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
            <label className="w-28 text-xs">
              Unidade
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
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
      >
        {loading ? "Registrando…" : "Registrar entrada"}
      </button>
    </form>
  );
}
