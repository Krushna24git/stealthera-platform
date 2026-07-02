import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { unauthorized } from "../utils/errors.js";

export function deviceAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!env.auth.enabled) return next();

  if (env.auth.deviceApiKeys.length === 0) {
    return next(unauthorized("Device ingestion auth is enabled but no device keys are configured"));
  }

  const provided = req.header("x-api-key");
  if (!provided || !env.auth.deviceApiKeys.includes(provided)) {
    return next(unauthorized("Invalid or missing X-API-Key"));
  }
  next();
}
