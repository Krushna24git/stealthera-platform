import { env } from "../config/env.js";
import { badGateway } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

export interface GeneticsResult {
  cardiacRisk: string;
  diabetesRisk: string;
}

interface CacheEntry {
  value: GeneticsResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export async function fetchGenetics(patientId: string): Promise<GeneticsResult> {
  const cached = cache.get(patientId);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const url = `${env.genetics.baseUrl}/genetics/${encodeURIComponent(patientId)}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(env.genetics.timeoutMs),
    });
  } catch (error) {
    logger.error(`genetics partner call failed for ${patientId}`, error);
    throw badGateway("Genetics partner API is unavailable");
  }

  if (response.status === 404) {
    throw badGateway(`Genetics partner API has no record for ${patientId}`);
  }
  if (!response.ok) {
    throw badGateway(`Genetics partner API responded with ${response.status}`);
  }

  const body = (await response.json()) as Partial<GeneticsResult>;
  if (typeof body.cardiacRisk !== "string" || typeof body.diabetesRisk !== "string") {
    throw badGateway("Genetics partner API returned an unexpected payload");
  }

  const value: GeneticsResult = { cardiacRisk: body.cardiacRisk, diabetesRisk: body.diabetesRisk };
  cache.set(patientId, { value, expiresAt: Date.now() + env.genetics.cacheTtlMs });
  return value;
}
