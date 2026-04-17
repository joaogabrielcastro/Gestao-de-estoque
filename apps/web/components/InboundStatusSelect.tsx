"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { readApiErrorMessage } from "@/lib/api-error";
import { apiUrl } from "@/lib/api";

type Status = "ARMAZENADA" | "SEPARADA" | "RETIRADA";

const labels: Record<Status, string> = {
  ARMAZENADA: "Armazenada",
  SEPARADA: "Separada",
  RETIRADA: "Retirada",
};

export function InboundStatusSelect({
  inboundId,
  initialStatus,
}: {
  inboundId: string;
  initialStatus: Status;
}) {
  const { showToast } = useToast();
  const [status, setStatus] = useState<Status>(initialStatus);
  const [loading, setLoading] = useState(false);

  async function onChange(nextStatus: Status) {
    setStatus(nextStatus);
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/inbounds/${inboundId}/status`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        throw new Error(await readApiErrorMessage(res));
      }
      showToast("success", "Status da carga atualizado.");
    } catch (err) {
      setStatus(initialStatus);
      showToast("error", err instanceof Error ? err.message : "Falha ao atualizar status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      onChange={(e) => void onChange(e.target.value as Status)}
      disabled={loading}
      className="rounded border border-zinc-300 bg-white px-2 py-1 text-xs"
      aria-label="Status da carga"
    >
      {(Object.keys(labels) as Status[]).map((s) => (
        <option key={s} value={s}>
          {labels[s]}
        </option>
      ))}
    </select>
  );
}

