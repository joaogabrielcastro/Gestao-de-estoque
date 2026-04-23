import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";

function normalizeOrigin(value: string) {
  const cleaned = value.trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
  try {
    return new URL(cleaned).origin;
  } catch {
    return cleaned;
  }
}

export function createApp() {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (allowedOrigins.includes("*")) return callback(null, true);
        if (allowedOrigins.length === 0) return callback(null, true);
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(normalizeOrigin(origin))) return callback(null, true);
        return callback(new Error("Origin não permitida pelo CORS"));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use("/api", apiRouter);
  app.use(errorHandler);
  return app;
}
