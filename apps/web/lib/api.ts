import { readApiErrorMessage } from "@/lib/api-error";

function resolveApiBase(): string {
  const isServer = typeof window === "undefined";
  const raw =
    (isServer && process.env.API_URL) ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3011/api";
  const normalizedBase = raw.replace(/\/$/, "");
  return normalizedBase.endsWith("/api")
    ? normalizedBase
    : `${normalizedBase}/api`;
}

export function apiUrl(path: string) {
  const base = resolveApiBase();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

type ApiInit = Omit<RequestInit, "body"> & { body?: unknown };

/**
 * Cliente HTTP único da web. Cobre GET (sem body), métodos com payload
 * (POST/PUT/PATCH passando `body`) e DELETE (sem body, retorna `undefined`).
 * Lança Error com mensagem amigável extraída do JSON de erro da API.
 */
export async function api<T = unknown>(
  path: string,
  init?: ApiInit
): Promise<T> {
  const { body, headers, ...rest } = init ?? {};
  const res = await fetch(apiUrl(path), {
    ...rest,
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res));
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}
