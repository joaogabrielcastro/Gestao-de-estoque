/** Data/hora legível para telas (fuso do navegador ao hidratar; no servidor, UTC do host). */
export function formatDateTimePtBr(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
