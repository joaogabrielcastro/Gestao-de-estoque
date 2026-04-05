import { ClienteForm } from "@/components/ClienteForm";
import { fetchJson } from "@/lib/api";

export const dynamic = "force-dynamic";

type Client = { id: string; name: string };

export default async function ClientesPage() {
  let clients: Client[] = [];
  let err: string | null = null;
  try {
    clients = await fetchJson<Client[]>("/clients");
  } catch {
    err = "API indisponível.";
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Clientes
      </h1>
      {err && (
        <p className="text-sm text-amber-700 dark:text-amber-300">{err}</p>
      )}
      <ClienteForm />
      <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {clients.length === 0 && (
          <li className="px-4 py-6 text-sm text-zinc-500">Nenhum cliente.</li>
        )}
        {clients.map((c) => (
          <li key={c.id} className="px-4 py-3 text-sm">
            {c.name}
          </li>
        ))}
      </ul>
    </div>
  );
}
