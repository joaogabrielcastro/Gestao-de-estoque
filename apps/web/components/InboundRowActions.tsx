"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteConfirmButton } from "@/components/DeleteConfirmButton";
import { api } from "@/lib/api";

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
        description="Os movimentos desta entrada serão apagados. Como o saldo é calculado direto das movimentações, ele se ajusta sozinho — pode ficar zerado em alguma posição se parte já tinha saído."
        onDelete={async () => {
          await api(`/inbounds/${id}`, { method: "DELETE" });
          router.refresh();
        }}
      />
    </div>
  );
}
