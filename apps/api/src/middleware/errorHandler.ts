import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/http-error";

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

  if (err instanceof HttpError) {
    return res
      .status(err.status)
      .json({ message: err.message, code: err.code, requestId });
  }

  const status = 500;
  console.error(
    JSON.stringify({
      level: "error",
      type: "request_error",
      requestId,
      status,
      error: err instanceof Error ? err.message : String(err),
    })
  );
  return res.status(status).json({
    message: "Erro interno. Tente novamente em instantes.",
    requestId,
  });
}
