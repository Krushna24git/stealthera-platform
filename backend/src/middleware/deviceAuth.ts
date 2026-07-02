import { createHash, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { unauthorized } from "../utils/errors.js";

// Hash both sides to equal length so timingSafeEqual is usable regardless of
// key length; keeps the comparison independent of how many characters match.
function keysMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export function deviceAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!env.auth.enabled) return next();

  if (env.auth.deviceApiKeys.length === 0) {
    return next(unauthorized("Device ingestion auth is enabled but no device keys are configured"));
  }

  const provided = req.header("x-api-key");
  if (!provided || !env.auth.deviceApiKeys.some((key) => keysMatch(provided, key))) {
    return next(unauthorized("Invalid or missing X-API-Key"));
  }
  next();
}
