import { getSummary, type PatientSummary } from "./patient.service.js";
import { fetchGenetics, type GeneticsResult } from "./genetics.service.js";
import { patientRepo } from "../repositories/patient.repo.js";
import { logger } from "../utils/logger.js";

export interface PatientProfile {
  patientId: string;
  demographics: { name: string; sex: string; dateOfBirth: string | null } | null;
  wearable: PatientSummary;
  genetics: {
    available: boolean;
    source: "partner-api";
    data: GeneticsResult | null;
    note?: string;
  };
}

export async function getPatientProfile(patientId: string): Promise<PatientProfile> {
  const [wearable, patient] = await Promise.all([getSummary(patientId), patientRepo.get(patientId)]);

  let genetics: PatientProfile["genetics"];
  try {
    const data = await fetchGenetics(patientId);
    genetics = { available: true, source: "partner-api", data };
  } catch (error) {
    logger.warn(`degrading patient-profile: genetics unavailable for ${patientId}`);
    genetics = {
      available: false,
      source: "partner-api",
      data: null,
      note: error instanceof Error ? error.message : "genetics unavailable",
    };
  }

  return {
    patientId,
    demographics: patient
      ? {
          name: patient.name ?? "",
          sex: patient.sex ?? "unknown",
          dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString() : null,
        }
      : null,
    wearable,
    genetics,
  };
}
