export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function mean(values: number[], decimals = 1): number | null {
  const clean = values.filter((v) => typeof v === "number" && Number.isFinite(v));
  if (clean.length === 0) return null;
  return round(clean.reduce((sum, v) => sum + v, 0) / clean.length, decimals);
}

export function sum(values: number[]): number {
  return values.filter((v) => typeof v === "number" && Number.isFinite(v)).reduce((total, v) => total + v, 0);
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}
