import type { Request, Response } from "express";
import { ingestHealthData } from "../services/ingestion.service.js";

export async function postHealthData(req: Request, res: Response): Promise<void> {
  const result = await ingestHealthData(req.body);
  res.status(result.created ? 201 : 200).json({
    status: result.created ? "stored" : "duplicate",
    data: result,
  });
}
