import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validação falhou",
      issues: err.flatten(),
    });
  }
  const message = err instanceof Error ? err.message : "Erro interno";
  const status = (err as { status?: number }).status ?? 500;
  if (status >= 500) {
    console.error(err);
  }
  return res.status(status).json({ message });
}
