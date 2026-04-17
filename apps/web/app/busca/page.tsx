import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchJson } from "@/lib/api";

type SearchResult = {
  q: string;
  clients: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string }>;
  inbounds: Array<{
    id: string;
    destinationCity: string;
    client: { name: string };
    invoices: Array<{ number: string }>;
  }>;
  outbounds: Array<{
    id: string;
    exitInvoiceNumber: string;
    destination: string;
    client: { name: string };
  }>;
};

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (process.env.NEXT_PUBLIC_ENABLE_GLOBAL_SEARCH !== "true") {
    notFound();
  }
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  if (!q) {
    return (
      <p className="rounded-lg border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
        Informe um termo de busca para consultar clientes, produtos, entradas e saídas.
      </p>
    );
  }

  let result: SearchResult | null = null;
  try {
    result = await fetchJson<SearchResult>(`/search?q=${encodeURIComponent(q)}`);
  } catch {
    return <p className="text-sm text-red-700">Busca indisponível no momento.</p>;
  }

  return (
    <div className="space-y-6">
      <h1 className="page-title">Busca global</h1>
      <p className="text-sm text-zinc-600">
        Termo: <strong>{result.q}</strong>
      </p>

      <section>
        <h2 className="mb-2 font-medium">Clientes</h2>
        <ul className="list-inside list-disc text-sm">
          {result.clients.length === 0 && <li>Nenhum cliente encontrado.</li>}
          {result.clients.map((c) => (
            <li key={c.id}>{c.name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Produtos</h2>
        <ul className="list-inside list-disc text-sm">
          {result.products.length === 0 && <li>Nenhum produto encontrado.</li>}
          {result.products.map((p) => (
            <li key={p.id}>{p.name}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Entradas</h2>
        <ul className="space-y-2 text-sm">
          {result.inbounds.length === 0 && <li>Nenhuma entrada encontrada.</li>}
          {result.inbounds.map((i) => (
            <li key={i.id} className="rounded border border-zinc-200 p-2">
              <div>{i.client.name} · {i.destinationCity}</div>
              <div className="text-xs text-zinc-600">NFs: {i.invoices.map((nf) => nf.number).join(", ")}</div>
              <Link href={`/entradas/${i.id}/folha`} className="text-xs text-red-700 underline">
                Abrir folha
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-medium">Saídas</h2>
        <ul className="space-y-2 text-sm">
          {result.outbounds.length === 0 && <li>Nenhuma saída encontrada.</li>}
          {result.outbounds.map((o) => (
            <li key={o.id} className="rounded border border-zinc-200 p-2">
              <div>{o.client.name} · NF {o.exitInvoiceNumber}</div>
              <div className="text-xs text-zinc-600">Destino: {o.destination}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

