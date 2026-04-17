import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = res.locals.requestId as string | undefined;
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validação falhou",
      issues: err.flatten(),
      requestId,
    });
  }
  const status = (err as { status?: number }).status ?? 500;
  const message =
    status >= 500
      ? "Erro interno. Tente novamente em instantes."
      : err instanceof Error
        ? err.message
        : "Erro na requisição";

  if (status >= 500) {
    console.error(
      JSON.stringify({
        level: "error",
        type: "request_error",
        requestId,
        status,
        error: err instanceof Error ? err.message : String(err),
      })
    );
  }
  return res.status(status).json({ message, requestId });
}
