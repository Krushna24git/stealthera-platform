import type { Request, Response } from "express";
import { login } from "../services/auth.service.js";

export async function postLogin(req: Request, res: Response): Promise<void> {
  res.json(await login(req.body));
}

export async function getMe(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user ?? null });
}
