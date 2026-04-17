import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3011),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(300),
  ENABLE_GLOBAL_SEARCH: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

export const env = envSchema.parse(process.env);
