import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3011),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  /** Atrás de Traefik/Coolify o cliente vem em X-Forwarded-For — sem trust proxy o express-rate-limit quebra (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR). */
  TRUST_PROXY: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => {
      if (v === "true") return true;
      if (v === "false") return false;
      return process.env.NODE_ENV === "production";
    }),
});

export const env = envSchema.parse(process.env);
