/**
 * Erro HTTP padronizado: substitui o padrão `(err as { status?: number }).status = X`
 * espalhado pelo código. O `errorHandler` mapeia diretamente status/message/code.
 */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function notFound(message: string, code = "NOT_FOUND") {
  return new HttpError(404, message, code);
}

export function badRequest(message: string, code = "BAD_REQUEST") {
  return new HttpError(400, message, code);
}

export function conflict(message: string, code = "CONFLICT") {
  return new HttpError(409, message, code);
}

export function isHttpError(err: unknown): err is HttpError {
  return err instanceof HttpError;
}
