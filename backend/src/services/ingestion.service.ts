import { healthDataRepo } from "../repositories/healthData.repo.js";
import { alertRepo } from "../repositories/alert.repo.js";
import { patientRepo } from "../repositories/patient.repo.js";
import { evaluateAlerts, type VitalSample } from "./alert.service.js";
import type { HealthDataPayload } from "../validation/healthData.schema.js";

export interface IngestionResult {
  created: boolean;
  recordId: string;
  patientId: string;
  deviceId: string;
  timestamp: string;
  alerts: Array<{ type: string; severity: string; message: string }>;
}

export async function ingestHealthData(payload: HealthDataPayload): Promise<IngestionResult> {
  const timestamp = new Date(payload.timestamp);

  const record = {
    deviceId: payload.deviceId,
    patientId: payload.patientId,
    timestamp,
    heartRate: payload.heartRate ?? null,
    spo2: payload.spo2 ?? null,
    temperature: payload.temperature ?? null,
    steps: payload.steps ?? null,
    fallDetected: payload.fallDetected,
  };

  const { created, doc } = await healthDataRepo.insertUnique(record);

  if (!created) {
    return {
      created: false,
      recordId: String(doc._id),
      patientId: doc.patientId,
      deviceId: doc.deviceId,
      timestamp: timestamp.toISOString(),
      alerts: [],
    };
  }

  await patientRepo.registerObservation(payload.patientId, payload.deviceId, timestamp);

  const sample: VitalSample = { ...record };
  const evaluated = evaluateAlerts(sample);
  await alertRepo.insertMany(evaluated);

  return {
    created: true,
    recordId: String(doc._id),
    patientId: doc.patientId,
    deviceId: doc.deviceId,
    timestamp: timestamp.toISOString(),
    alerts: evaluated.map((a) => ({ type: a.type, severity: a.severity, message: a.message })),
  };
}
