import { ClienteForm } from "@/components/ClienteForm";
import { ClientesList } from "@/components/ClientesList";
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
      <ClientesList initialClients={clients} />
    </div>
  );
}
