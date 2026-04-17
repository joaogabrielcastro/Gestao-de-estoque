"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteConfirmButton, fetchDelete } from "@/components/DeleteConfirmButton";
import { apiUrl } from "@/lib/api";

export function OutboundRowActions({ id }: { id: string }) {
  const router = useRouter();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2">
      <Link
        href={`/saidas/${id}/editar`}
        className="rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
      >
        Editar
      </Link>
      <DeleteConfirmButton
        title="Excluir esta saída?"
        description="O estoque será devolvido (como se a retirada não tivesse ocorrido). Não é possível desfazer."
        onDelete={async () => {
          await fetchDelete(apiUrl(`/outbounds/${id}`));
          router.refresh();
        }}
      />
    </div>
  );
}
