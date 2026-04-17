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
          if (v?.length) parts.push(`${k}: ${v.join(", ")}`);
        }
      }
      if (parts.length) return parts.join(" · ");
    }
  }
  return res.statusText || "Erro na requisição";
}
