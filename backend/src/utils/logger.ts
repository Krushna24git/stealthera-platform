import { env } from "../config/env.js";

type Level = "debug" | "info" | "warn" | "error";

const RANK: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function threshold(): number {
  return RANK[(env.logLevel as Level)] ?? RANK.info;
}

function render(meta: unknown): string {
  if (meta === undefined) return "";
  if (meta instanceof Error) return meta.stack ?? meta.message;
  if (typeof meta === "object" && meta !== null) {
    try {
      return JSON.stringify(meta);
    } catch {
      return String(meta);
    }
  }
  return String(meta);
}

function emit(level: Level, message: string, meta?: unknown): void {
  if (RANK[level] < threshold()) return;
  const line = `[${new Date().toISOString()}] ${level.toUpperCase()} ${message}`;
  const rendered = render(meta);
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  if (rendered) sink(line, rendered);
  else sink(line);
}

export const logger = {
  debug: (message: string, meta?: unknown) => emit("debug", message, meta),
  info: (message: string, meta?: unknown) => emit("info", message, meta),
  warn: (message: string, meta?: unknown) => emit("warn", message, meta),
  error: (message: string, meta?: unknown) => emit("error", message, meta),
};
