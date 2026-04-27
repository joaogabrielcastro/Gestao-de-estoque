"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readApiErrorMessage } from "@/lib/api-error";
import { apiUrl } from "@/lib/api";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";

type Client = { id: string; name: string };
type Product = { id: string; name: string };
type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

type Line = { productId: string; quantity: string; unit: "UN" | "CX" | "PAL" };

export type EntradaFormInitial = {
  clientId: string;
  destinationCity: string;
  supplierOrBrand: string | null;
  notes: string | null;
  sector: "A" | "B" | "C" | "D";
  invoiceNumbers: string[];
  lines: Line[];
};

export type EntradaFormProps = {
  mode?: "create" | "edit";
  inboundId?: string;
  initial?: EntradaFormInitial;
};

export function EntradaForm({
  mode = "create",
  inboundId,
  initial,
}: EntradaFormProps = {}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [destinationCity, setDestinationCity] = useState(
    initial?.destinationCity ?? ""
  );
  const [supplierOrBrand, setSupplierOrBrand] = useState(
    initial?.supplierOrBrand ?? ""
  );
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [sector, setSector] = useState<"A" | "B" | "C" | "D">(
    initial?.sector ?? "A"
  );
  const [invoiceText, setInvoiceText] = useState(
    initial?.invoiceNumbers?.join("\n") ?? ""
  );
  const [lines, setLines] = useState<Line[]>(
    initial?.lines?.length
      ? initial.lines
      : [{ productId: "", quantity: "1", unit: "UN" }]
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [c, p] = await Promise.all([
          fetch(apiUrl("/clients?page=1&pageSize=200")).then((r) => r.json()),
          fetch(apiUrl("/products?page=1&pageSize=200")).then((r) => r.json()),
        ]);
        const clientsPayload = c as Paginated<Client>;
        const productsPayload = p as Paginated<Product>;
        setClients(clientsPayload.items);
        setProducts(productsPayload.items);
        if (mode === "edit" && initial) {
          setClientId(initial.clientId);
          setDestinationCity(initial.destinationCity);
          setSupplierOrBrand(initial.supplierOrBrand ?? "");
          setNotes(initial.notes ?? "");
          setSector(initial.sector);
          setInvoiceText(initial.invoiceNumbers.join("\n"));
          setLines(initial.lines);
        } else {
          if (clientsPayload.items[0]) setClientId(clientsPayload.items[0].id);
          if (productsPayload.items[0]) {
            setLines((prev) =>
              prev.length === 1 && !prev[0].productId
                ? [
                    {
                      productId: productsPayload.items[0].id,
                      quantity: "1",
                      unit: "UN",
                    },
                  ]
                : prev
            );
          }
        }
      } catch {
        setError("Não foi possível carregar clientes/produtos.");
      }
    })();
  }, [mode, initial]);

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
      notes: notes || undefined,
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
      const isEdit = mode === "edit" && inboundId;
      const res = await fetch(
        isEdit ? apiUrl(`/inbounds/${inboundId}`) : apiUrl("/inbounds"),
        {
          method: isEdit ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res));
      }
      showToast(
        "success",
        isEdit ? "Entrada atualizada." : "Entrada registrada com sucesso."
      );
      router.push("/entradas");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro";
      setError(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  const catEmpty = clients.length === 0 || products.length === 0;

  return (
    <form onSubmit={onSubmit} className="w-full space-y-4">
      <p>
        <Link
          href="/entradas"
          className="text-sm text-zinc-600 underline hover:text-zinc-900"
        >
          ← Voltar às entradas
        </Link>
      </p>
      {catEmpty && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Cadastre ao menos um cliente e um produto antes de registrar a entrada.{" "}
          <Link className="underline" href="/clientes">
            Clientes
          </Link>{" "}
          ·{" "}
          <Link className="underline" href="/produtos">
            Produtos
          </Link>
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Cliente
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2"
            required
            disabled={clients.length === 0}
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
            className="rounded-md border border-zinc-300 bg-white px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Fornecedor / marca (opcional)
          <input
            value={supplierOrBrand}
            onChange={(e) => setSupplierOrBrand(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Setor
          <select
            value={sector}
            onChange={(e) =>
              setSector(e.target.value as "A" | "B" | "C" | "D")
            }
            className="rounded-md border border-zinc-300 bg-white px-3 py-2"
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
        Observação (opcional)
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2"
          placeholder="Condição da carga, avaria, motorista, etc."
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Números das NFs (um por linha ou separados por vírgula)
        <textarea
          value={invoiceText}
          onChange={(e) => setInvoiceText(e.target.value)}
          rows={3}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 font-mono text-sm"
          required
        />
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Produtos</span>
          <button
            type="button"
            onClick={addLine}
            className="text-sm text-zinc-600 underline"
          >
            + Linha
          </button>
        </div>
        {lines.map((line, i) => (
          <div
            key={i}
            className="flex flex-wrap items-end gap-2 rounded-md border border-zinc-200 p-3"
          >
            <label className="min-w-[180px] flex-1 text-xs">
              Produto
              <select
                value={line.productId}
                onChange={(e) => updateLine(i, { productId: e.target.value })}
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
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
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
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
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
              >
                <option value="UN">UN</option>
                <option value="CX">CX</option>
                <option value="PAL">PAL</option>
              </select>
            </label>
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading || catEmpty}
        className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        {loading && <Spinner className="h-4 w-4 border-white" />}
        {loading
          ? mode === "edit"
            ? "Salvando…"
            : "Registrando…"
          : mode === "edit"
            ? "Salvar alterações"
            : "Registrar entrada"}
      </button>
    </form>
  );
}
