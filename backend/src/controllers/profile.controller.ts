import type { Request, Response } from "express";
import { getPatientProfile } from "../services/profile.service.js";

export async function getProfile(req: Request, res: Response): Promise<void> {
  res.json(await getPatientProfile(req.params.id));
}
