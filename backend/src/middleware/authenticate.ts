import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";
import { unauthorized } from "../utils/errors.js";
import { verifyToken, type TokenPayload } from "../utils/token.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  if (!env.auth.enabled) return next();

  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return next(unauthorized("Missing bearer token"));
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(unauthorized("Invalid or expired token"));
  }
}
