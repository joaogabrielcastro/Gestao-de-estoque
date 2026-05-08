"use client";

import { useState } from "react";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/ui/ToastProvider";

type Props = {
  label?: string;
  title: string;
  description: string;
  onDelete: () => Promise<void>;
  variant?: "danger" | "subtle";
};

export function DeleteConfirmButton({
  label = "Excluir",
  title,
  description,
  onDelete,
  variant = "danger",
}: Props) {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    try {
      await onDelete();
      showToast("success", "Registro excluído.");
      setOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir";
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  const btnClass =
    variant === "danger"
      ? "text-red-700 hover:bg-red-50"
      : "text-zinc-600 hover:bg-zinc-100";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-md px-2 py-1 text-xs font-medium ${btnClass}`}
      >
        {label}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-lg">
            <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{description}</p>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirm()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading && <Spinner className="h-4 w-4 border-white" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

