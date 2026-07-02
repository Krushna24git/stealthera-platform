import { Schema, model, type HydratedDocument } from "mongoose";

const RISK_LEVELS = ["Low", "Moderate", "High"] as const;

export interface IGeneticProfile {
  patientId: string;
  cardiacRisk: string;
  diabetesRisk: string;
  updatedAt: Date;
}

const geneticProfileSchema = new Schema<IGeneticProfile>(
  {
    patientId: { type: String, required: true, unique: true },
    cardiacRisk: { type: String, enum: RISK_LEVELS, required: true },
    diabetesRisk: { type: String, enum: RISK_LEVELS, required: true },
    updatedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export type GeneticProfileDoc = HydratedDocument<IGeneticProfile>;

export const GeneticProfile = model<IGeneticProfile>(
  "GeneticProfile",
  geneticProfileSchema,
  "genetic_profiles"
);
