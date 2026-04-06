import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(webRoot, "..", "..");

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: monorepoRoot,
  },
};

export default nextConfig;
