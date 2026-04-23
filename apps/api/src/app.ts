import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
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
