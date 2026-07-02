import { geneticsRepo, deriveRiskFromId } from "../repositories/genetics.repo.js";
import type { GeneticsResult } from "./genetics.service.js";

export async function getMockGenetics(patientId: string): Promise<GeneticsResult> {
  const stored = await geneticsRepo.get(patientId);
  if (stored) {
    return { cardiacRisk: stored.cardiacRisk, diabetesRisk: stored.diabetesRisk };
  }
  return deriveRiskFromId(patientId);
}
