"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="min-h-11 rounded-md bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 active:bg-red-800 print:hidden"
    >
      Imprimir ou salvar PDF
    </button>
  );
}
