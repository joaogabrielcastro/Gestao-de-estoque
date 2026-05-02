const FIELD_LABELS: Record<string, string> = {
  clientId: "Cliente",
  productId: "Produto",
  destinationCity: "Cidade de destino",
  invoiceNumbers: "NFs",
  exitInvoiceNumber: "NF de saída",
  withdrawalDate: "Data de retirada",
  pickedUpBy: "Quem retirou",
  destination: "Destino",
  sector: "Setor",
  quantity: "Quantidade",
  unit: "Unidade",
  lines: "Itens",
  notes: "Observação",
};

function friendlyFieldLabel(path: string): string {
  const base = path.replace(/\.\d+/g, "");
  const head = base.split(".")[0] ?? path;
  return FIELD_LABELS[head] ?? head.replace(/_/g, " ");
}

/** Extrai mensagem legível de respostas JSON da API (Zod, erros de negócio). */
export async function readApiErrorMessage(res: Response): Promise<string> {
  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text) as Record<string, unknown>;
  } catch {
    return text || res.statusText || "Erro ao processar resposta";
  }
  if (body && typeof body === "object") {
    const o = body as { message?: string; issues?: unknown };
    if (typeof o.message === "string" && o.message) return o.message;
    if (o.issues && typeof o.issues === "object") {
      const flat = o.issues as {
        fieldErrors?: Record<string, string[] | undefined>;
        formErrors?: string[];
      };
      const parts: string[] = [];
      if (flat.formErrors?.length) parts.push(...flat.formErrors);
      if (flat.fieldErrors) {
        for (const [k, v] of Object.entries(flat.fieldErrors)) {
          if (v?.length) {
            const label = friendlyFieldLabel(k);
            parts.push(`${label}: ${v.join(", ")}`);
          }
        }
      }
      if (parts.length) return parts.join(" · ");
    }
  }
  return res.statusText || "Erro na requisição";
}
