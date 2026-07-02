import type { Request, Response } from "express";
import { getMockGenetics } from "../services/geneticsMock.service.js";

export async function getGenetics(req: Request, res: Response): Promise<void> {
  const genetics = await getMockGenetics(req.params.patientId);
  res.json(genetics);
}
