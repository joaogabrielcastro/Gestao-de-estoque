import fs from "fs";
import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const webRoot = path.dirname(fileURLToPath(import.meta.url));

/** Turbopack usa a raiz do monorepo só quando ela existe (clone completo). Deploy só com apps/web não quebra. */
function turbopackRoot(): string {
  const candidate = path.resolve(webRoot, "..", "..");
  const pkg = path.join(candidate, "package.json");
  if (!fs.existsSync(pkg)) return webRoot;
  try {
    const json = JSON.parse(fs.readFileSync(pkg, "utf8")) as { workspaces?: unknown };
    if (json.workspaces) return candidate;
  } catch {
    /* ignore */
  }
  return webRoot;
}

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: turbopackRoot(),
  },
};

export default nextConfig;
