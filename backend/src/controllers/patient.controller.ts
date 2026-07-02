import type { Request, Response } from "express";
import {
  listPatients,
  getLatestVitals,
  getHistory,
  getAlerts,
  getSummary,
} from "../services/patient.service.js";
import { env } from "../config/env.js";
import { clamp } from "../utils/stats.js";
import { toInt, toStr, parsePagination, paginate } from "../utils/pagination.js";

function parseDate(value: unknown): Date | undefined {
  const raw = toStr(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export async function getPatients(req: Request, res: Response): Promise<void> {
  const { page, pageSize, skip } = parsePagination(req.query as Record<string, unknown>);
  const { patients, total } = await listPatients({ skip, limit: pageSize });
  res.json(paginate(patients, page, pageSize, total));
}

export async function getLatest(req: Request, res: Response): Promise<void> {
  res.json(await getLatestVitals(req.params.id));
}

export async function getPatientHistory(req: Request, res: Response): Promise<void> {
  const limit = clamp(
    toInt(req.query.limit, env.limits.defaultHistoryLimit),
    1,
    env.limits.maxHistoryLimit
  );
  const order: 1 | -1 = toStr(req.query.order)?.toLowerCase() === "asc" ? 1 : -1;
  res.json(
    await getHistory(req.params.id, {
      from: parseDate(req.query.from),
      to: parseDate(req.query.to),
      limit,
      order,
    })
  );
}

export async function getPatientAlerts(req: Request, res: Response): Promise<void> {
  const limit = clamp(toInt(req.query.limit, env.limits.defaultPageSize), 1, env.limits.maxPageSize);
  const order: 1 | -1 = toStr(req.query.order)?.toLowerCase() === "asc" ? 1 : -1;
  res.json(await getAlerts(req.params.id, { limit, order }));
}

export async function getPatientSummary(req: Request, res: Response): Promise<void> {
  res.json(await getSummary(req.params.id));
}
