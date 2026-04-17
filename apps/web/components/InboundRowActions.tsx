"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteConfirmButton, fetchDelete } from "@/components/DeleteConfirmButton";
import { apiUrl } from "@/lib/api";

export function InboundRowActions({ id }: { id: string }) {
  const router = useRouter();

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-2">
      <Link
        href={`/entradas/${id}/editar`}
        className="rounded-md px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
      >
        Editar
      </Link>
      <DeleteConfirmButton
        title="Excluir esta entrada?"
        description="O estoque será ajustado (como se a carga não tivesse entrado). Não é possível desfazer."
        onDelete={async () => {
          await fetchDelete(apiUrl(`/inbounds/${id}`));
          router.refresh();
        }}
      />
    </div>
  );
}
