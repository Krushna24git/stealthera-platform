import { GeneticProfile, type GeneticProfileDoc } from "../db/models/GeneticProfile.js";

const RISK_LEVELS = ["Low", "Moderate", "High"] as const;

export const geneticsRepo = {
  async get(patientId: string): Promise<GeneticProfileDoc | null> {
    return GeneticProfile.findOne({ patientId });
  },

  async upsert(input: {
    patientId: string;
    cardiacRisk: (typeof RISK_LEVELS)[number];
    diabetesRisk: (typeof RISK_LEVELS)[number];
  }): Promise<void> {
    await GeneticProfile.updateOne(
      { patientId: input.patientId },
      { $set: { ...input, updatedAt: new Date() } },
      { upsert: true }
    );
  },
};

export function deriveRiskFromId(patientId: string): {
  cardiacRisk: (typeof RISK_LEVELS)[number];
  diabetesRisk: (typeof RISK_LEVELS)[number];
} {
  let hash = 0;
  for (const char of patientId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return {
    cardiacRisk: RISK_LEVELS[hash % 3],
    diabetesRisk: RISK_LEVELS[(hash >> 3) % 3],
  };
}
