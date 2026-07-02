import { healthDataRepo } from "../repositories/healthData.repo.js";
import { alertRepo } from "../repositories/alert.repo.js";
import { patientRepo } from "../repositories/patient.repo.js";
import { evaluateAlerts, type VitalSample } from "./alert.service.js";
import { logger } from "../utils/logger.js";
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

  logger.debug("ingest: received sample", {
    patientId: record.patientId,
    deviceId: record.deviceId,
    timestamp: timestamp.toISOString(),
    vitals: {
      heartRate: record.heartRate,
      spo2: record.spo2,
      temperature: record.temperature,
      steps: record.steps,
      fallDetected: record.fallDetected,
    },
  });

  const { created, doc } = await healthDataRepo.insertUnique(record);

  if (!created) {
    logger.info("ingest: duplicate ignored", {
      recordId: String(doc._id),
      patientId: doc.patientId,
      deviceId: doc.deviceId,
      timestamp: timestamp.toISOString(),
    });
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

  logger.info("ingest: sample stored", {
    recordId: String(doc._id),
    patientId: doc.patientId,
    deviceId: doc.deviceId,
    timestamp: timestamp.toISOString(),
    alerts: evaluated.length,
  });
  for (const alert of evaluated) {
    logger.warn("ingest: alert triggered", {
      patientId: doc.patientId,
      deviceId: doc.deviceId,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
    });
  }

  return {
    created: true,
    recordId: String(doc._id),
    patientId: doc.patientId,
    deviceId: doc.deviceId,
    timestamp: timestamp.toISOString(),
    alerts: evaluated.map((a) => ({ type: a.type, severity: a.severity, message: a.message })),
  };
}
