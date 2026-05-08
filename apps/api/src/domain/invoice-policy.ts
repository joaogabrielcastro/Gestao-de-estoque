import { badRequest } from "../lib/http-error";

export function normalizeInvoiceNumber(value: string) {
  return value.trim().toLowerCase();
}

export function sanitizeInvoiceNumbers(values: string[]) {
  return values.map((n) => n.trim()).filter(Boolean);
}

export function assertNoDuplicateInvoiceNumbers(values: string[]) {
  const seen = new Set<string>();
  for (const num of values) {
    const key = normalizeInvoiceNumber(num);
    if (seen.has(key)) {
      throw badRequest(
        `Número de NF repetido na mesma entrada: "${num}". Remova duplicatas.`
      );
    }
    seen.add(key);
  }
}
