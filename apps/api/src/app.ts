import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { requestContext } from "./middleware/requestContext";
import { requestLogger } from "./middleware/requestLogger";
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
  if (env.TRUST_PROXY) {
    app.set("trust proxy", 1);
  }
  app.use(helmet());
  app.use(requestContext);
  app.use(requestLogger);
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
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      max: env.API_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );
  app.use(express.json());
  app.get("/", (_req, res) => {
    res.json({
      ok: true,
      service: "gestao-api",
      health: "/api/health",
    });
  });
  app.use("/api", apiRouter);
  app.use(errorHandler);
  return app;
}
