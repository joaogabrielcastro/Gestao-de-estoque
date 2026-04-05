import { ProdutoForm } from "@/components/ProdutoForm";
import { fetchJson } from "@/lib/api";

export const dynamic = "force-dynamic";

type Product = { id: string; name: string };

export default async function ProdutosPage() {
  let products: Product[] = [];
  let err: string | null = null;
  try {
    products = await fetchJson<Product[]>("/products");
  } catch {
    err = "API indisponível.";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Produtos
      </h1>
      {err && (
        <p className="text-sm text-amber-700 dark:text-amber-300">{err}</p>
      )}
      <ProdutoForm />
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {products.length === 0 && (
          <li className="px-4 py-6 text-sm text-zinc-500">Nenhum produto.</li>
        )}
        {products.map((p) => (
          <li key={p.id} className="px-4 py-3 text-sm">
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
