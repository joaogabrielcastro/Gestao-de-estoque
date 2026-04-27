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

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export async function requestJson<TResponse, TBody = unknown>(
  path: string,
  options?: {
    method?: "POST" | "PUT" | "PATCH" | "DELETE";
    body?: TBody;
    init?: RequestInit;
  }
): Promise<TResponse> {
  const method = options?.method ?? "POST";
  const res = await fetch(apiUrl(path), {
    ...(options?.init ?? {}),
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options?.init?.headers ?? {}),
    },
    body: options?.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(await readApiErrorMessage(res));
  }
  if (res.status === 204) {
    return undefined as TResponse;
  }
  return res.json() as Promise<TResponse>;
}
