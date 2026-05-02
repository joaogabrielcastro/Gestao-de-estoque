"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { requestJson } from "@/lib/api";
import { loadCatalogs, type CatalogItem } from "@/lib/catalogs";
import { Spinner } from "@/components/ui/Spinner";

type Client = CatalogItem;
type Product = CatalogItem;

type Line = {
  productId: string;
  quantity: string;
  unit: "UN" | "CX" | "PAL";
  sector: "A" | "B" | "C" | "D";
};

function isoToDatetimeLocal(iso: string) {
  const d = new Date(iso);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export type SaidaFormInitial = {
  clientId: string;
  exitInvoiceNumber: string;
  withdrawalDateIso: string;
  pickedUpBy: string;
  destination: string;
  notes: string | null;
  lines: Line[];
};

export type SaidaFormProps = {
  mode?: "create" | "edit";
  outboundId?: string;
  initial?: SaidaFormInitial;
};

export function SaidaForm({
  mode = "create",
  outboundId,
  initial,
}: SaidaFormProps = {}) {
  const router = useRouter();
  const { showToast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clientId, setClientId] = useState(initial?.clientId ?? "");
  const [exitInvoiceNumber, setExitInvoiceNumber] = useState(
    initial?.exitInvoiceNumber ?? ""
  );
  const [withdrawalDate, setWithdrawalDate] = useState(() =>
    initial?.withdrawalDateIso
      ? isoToDatetimeLocal(initial.withdrawalDateIso)
      : (() => {
          const d = new Date();
          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
          return d.toISOString().slice(0, 16);
        })()
  );
  const [pickedUpBy, setPickedUpBy] = useState(initial?.pickedUpBy ?? "");
  const [destination, setDestination] = useState(initial?.destination ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [lines, setLines] = useState<Line[]>(
    initial?.lines?.length
      ? initial.lines
      : [{ productId: "", quantity: "1", unit: "UN", sector: "A" }]
  );
  const [error, setError] = useState<string | null>(null);
  const [stockAlert, setStockAlert] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const catalogs = await loadCatalogs();
        setClients(catalogs.clients);
        setProducts(catalogs.products);
        if (mode === "edit" && initial) {
          setClientId(initial.clientId);
          setExitInvoiceNumber(initial.exitInvoiceNumber);
          setWithdrawalDate(isoToDatetimeLocal(initial.withdrawalDateIso));
          setPickedUpBy(initial.pickedUpBy);
          setDestination(initial.destination);
          setNotes(initial.notes ?? "");
          setLines(initial.lines);
        } else {
          if (catalogs.clients[0]) setClientId(catalogs.clients[0].id);
          if (catalogs.products[0]) {
            setLines([
              {
                productId: catalogs.products[0].id,
                quantity: "1",
                unit: "UN",
                sector: "A",
              },
            ]);
          }
        }
      } catch {
        setError("Não foi possível carregar clientes/produtos.");
      }
    })();
  }, [mode, initial]);

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

  function clientName() {
    return clients.find((c) => c.id === clientId)?.name ?? "—";
  }

  function productName(id: string) {
    return products.find((p) => p.id === id)?.name ?? "—";
  }

  function openConfirm() {
    setError(null);
    setStockAlert(null);
    const el = formRef.current;
    if (el && !el.checkValidity()) {
      el.reportValidity();
      return;
    }
    setConfirmOpen(true);
  }

  async function submitOutbound() {
    setError(null);
    const body = {
      clientId,
      exitInvoiceNumber,
      withdrawalDate: new Date(withdrawalDate).toISOString(),
      pickedUpBy,
      destination,
      notes: notes || undefined,
      lines: lines.map((l) => ({
        productId: l.productId,
        quantity: l.quantity,
        unit: l.unit,
        sector: l.sector,
      })),
    };
    setLoading(true);
    try {
      const isEdit = mode === "edit" && outboundId;
      await requestJson(isEdit ? `/outbounds/${outboundId}` : "/outbounds", {
        method: isEdit ? "PUT" : "POST",
        body,
      });
      showToast(
        "success",
        isEdit ? "Saída atualizada." : "Saída confirmada com sucesso."
      );
      setConfirmOpen(false);
      router.push("/saidas");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro";
      setError(msg);
      if (/Estoque insuficiente/i.test(msg)) {
        setStockAlert(msg);
      }
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  const catEmpty = clients.length === 0 || products.length === 0;

  return (
    <>
      <form ref={formRef} className="max-w-2xl space-y-4" noValidate>
        <p>
          <Link
            href="/saidas"
            className="text-sm text-zinc-600 underline hover:text-zinc-900"
          >
            ← Voltar às saídas
          </Link>
        </p>
        {catEmpty && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Cadastre ao menos um cliente e um produto antes de registrar a saída.{" "}
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
            NF de saída (nota fiscal)
            <input
              value={exitInvoiceNumber}
              onChange={(e) => setExitInvoiceNumber(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Data de retirada
            <input
              type="datetime-local"
              value={withdrawalDate}
              onChange={(e) => setWithdrawalDate(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Quem retirou
            <input
              value={pickedUpBy}
              onChange={(e) => setPickedUpBy(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2"
              required
            />
          </label>
          <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
            Destino da carga
            <input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2"
              required
            />
          </label>
          <label className="sm:col-span-2 flex flex-col gap-1 text-sm">
            Observação (opcional)
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-2"
              placeholder="Condição da carga, avaria, etc."
            />
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Itens da retirada (setor de origem no barracão)
            </span>
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
              <label className="min-w-[160px] flex-1 text-xs">
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
              <label className="w-20 text-xs">
                Quantidade
                <input
                  type="text"
                  inputMode="decimal"
                  value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: e.target.value })}
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
                  required
                />
              </label>
              <label className="w-24 text-xs">
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
              <label className="w-24 text-xs">
                Setor origem
                <select
                  value={line.sector}
                  onChange={(e) =>
                    updateLine(i, {
                      sector: e.target.value as Line["sector"],
                    })
                  }
                  className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm"
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

        {stockAlert && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
            <strong>Saldo insuficiente no barracão.</strong> {stockAlert}
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={openConfirm}
          disabled={loading || catEmpty}
          className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading && <Spinner className="h-4 w-4 border-white" />}
          {mode === "edit"
            ? "Revisar e salvar alterações na retirada"
            : "Revisar e registrar retirada"}
        </button>
      </form>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-zinc-200 bg-white p-5 shadow-lg">
            <h2
              id="confirm-title"
              className="text-lg font-semibold text-zinc-900"
            >
              {mode === "edit"
                ? "Confirmar alteração nesta retirada?"
                : "Confirmar esta retirada de carga?"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {mode === "edit"
                ? "O saldo no barracão será atualizado conforme os novos itens e quantidades."
                : "Depois de confirmar, o sistema baixa o estoque por cliente, produto, setor e unidade (UN/CX/PAL). Confira NF e quantidades."}
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-xs text-zinc-500">Cliente</dt>
                <dd className="font-medium">{clientName()}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">NF de saída (nota fiscal)</dt>
                <dd className="font-mono">{exitInvoiceNumber}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">Data e hora da retirada</dt>
                <dd>
                  {new Date(withdrawalDate).toLocaleString("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-500">
                  Quem retirou · destino da carga
                </dt>
                <dd>
                  {pickedUpBy} → {destination}
                </dd>
              </div>
              {notes ? (
                <div>
                  <dt className="text-xs text-zinc-500">Observação</dt>
                  <dd>{notes}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4">
              <div className="text-xs font-medium text-zinc-600">
                Itens da retirada
              </div>
              <ul className="mt-1 list-inside list-disc text-sm text-zinc-800">
                {lines.map((l, i) => (
                  <li key={i}>
                    {productName(l.productId)} · {l.quantity} {l.unit} · setor{" "}
                    {l.sector}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
                disabled={loading}
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => void submitOutbound()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading && <Spinner className="h-4 w-4 border-white" />}
                {mode === "edit"
                  ? "Confirmar alteração"
                  : "Confirmar e baixar estoque"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
