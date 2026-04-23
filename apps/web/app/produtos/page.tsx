import { ProdutoForm } from "@/components/ProdutoForm";
import { ProdutosList } from "@/components/ProdutosList";
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
      <ProdutosList initialProducts={products} />
    </div>
  );
}
