import type { Request, Response } from "express";
import { pingDatabase } from "../db/connection.js";

export function getRoot(_req: Request, res: Response): void {
  res.json({ service: "StealthEra RPM API", version: "1.0.0", docs: "/docs" });
}

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const mongoUp = await pingDatabase();
  res.status(mongoUp ? 200 : 503).json({
    status: mongoUp ? "ok" : "degraded",
    mongo: mongoUp ? "up" : "down",
    uptimeSeconds: Math.round(process.uptime()),
  });
}
