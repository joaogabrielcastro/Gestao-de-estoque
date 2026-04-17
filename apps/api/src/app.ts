import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { requestContext } from "./middleware/requestContext";
import { requestLogger } from "./middleware/requestLogger";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(requestContext);
  app.use(requestLogger);
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60_000,
      max: env.API_RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );
  app.use(express.json());
  app.use("/api", apiRouter);
  app.use(errorHandler);
  return app;
}
