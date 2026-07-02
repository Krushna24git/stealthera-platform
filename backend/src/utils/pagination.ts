import { env } from "../config/env.js";
import { clamp } from "./stats.js";

export interface PageParams {
  page: number;
  pageSize: number;
  skip: number;
}

export interface PagedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function parsePagination(query: Record<string, unknown>): PageParams {
  const pageSize = clamp(
    toInt(query.pageSize ?? query.limit, env.limits.defaultPageSize),
    1,
    env.limits.maxPageSize
  );
  const page = Math.max(1, toInt(query.page, 1));
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function paginate<T>(data: T[], page: number, pageSize: number, total: number): PagedResult<T> {
  return { data, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function toInt(value: unknown, fallback: number): number {
  const parsed = Number(Array.isArray(value) ? value[0] : value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

export function toStr(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  return String(Array.isArray(value) ? value[0] : value);
}
