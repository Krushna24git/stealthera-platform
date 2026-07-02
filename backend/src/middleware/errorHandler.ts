import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { HttpError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: err.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
      },
    });
    return;
  }

  if (err instanceof HttpError) {
    if (err.statusCode >= 500) logger.error(err.message, err.details);
    res.status(err.statusCode).json({
      error: {
        code: statusCodeName(err.statusCode),
        message: err.message,
        ...(err.details !== undefined ? { details: err.details } : {}),
      },
    });
    return;
  }

  logger.error("unhandled error", err);
  // Unexpected errors can carry driver/stack details; never echo those to clients
  // outside development.
  const message =
    env.nodeEnv === "development" && err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message } });
}

function statusCodeName(code: number): string {
  const map: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_ERROR",
    502: "BAD_GATEWAY",
  };
  return map[code] ?? "ERROR";
}
