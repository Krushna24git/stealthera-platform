import type { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { logger } from "../utils/logger.js";

const REDACT_KEYS = new Set(["password", "token", "authorization", "apikey", "secret"]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      out[key] = REDACT_KEYS.has(key.toLowerCase()) ? "[redacted]" : sanitize(val);
    }
    return out;
  }
  return value;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if ((req.originalUrl ?? "").endsWith("/health")) return next();

  const requestId = randomUUID().slice(0, 8);
  (req as Request & { requestId: string }).requestId = requestId;
  res.setHeader("x-request-id", requestId);
  const start = process.hrtime.bigint();

  const hasBody = req.body && typeof req.body === "object" && Object.keys(req.body).length > 0;
  logger.debug(`--> ${req.method} ${req.originalUrl}`, {
    requestId,
    ip: req.ip,
    query: Object.keys(req.query).length ? req.query : undefined,
    body: hasBody ? sanitize(req.body) : undefined,
  });

  res.on("finish", () => {
    const durationMs = Math.round((Number(process.hrtime.bigint() - start) / 1e6) * 1000) / 1000;
    const meta = {
      requestId,
      status: res.statusCode,
      durationMs,
      length: res.getHeader("content-length") ?? 0,
    };
    const line = `<-- ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`;
    if (res.statusCode >= 500) logger.error(line, meta);
    else if (res.statusCode >= 400) logger.warn(line, meta);
    else logger.info(line, meta);
  });

  next();
}
