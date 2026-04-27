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
