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
      const err = new Error(
        `Número de NF repetido na mesma entrada: "${num}". Remova duplicatas.`
      );
      (err as { status?: number }).status = 400;
      throw err;
    }
    seen.add(key);
  }
}
