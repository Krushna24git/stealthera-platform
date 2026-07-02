import type { HealthDataDoc } from "../db/models/HealthData.js";
import type { AlertDoc } from "../db/models/Alert.js";

export interface VitalsDto {
  recordId: string;
  deviceId: string;
  patientId: string;
  timestamp: string;
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  steps: number | null;
  fallDetected: boolean;
}

export interface AlertDto {
  id: string;
  patientId: string;
  deviceId: string;
  type: string;
  severity: string;
  message: string;
  metric: string | null;
  value: number | null;
  threshold: number | null;
  timestamp: string;
}

export function toVitalsDto(doc: HealthDataDoc): VitalsDto {
  return {
    recordId: String(doc._id),
    deviceId: doc.deviceId,
    patientId: doc.patientId,
    timestamp: doc.timestamp.toISOString(),
    heartRate: doc.heartRate ?? null,
    spo2: doc.spo2 ?? null,
    temperature: doc.temperature ?? null,
    steps: doc.steps ?? null,
    fallDetected: Boolean(doc.fallDetected),
  };
}

export function toAlertDto(doc: AlertDoc): AlertDto {
  return {
    id: String(doc._id),
    patientId: doc.patientId,
    deviceId: doc.deviceId,
    type: doc.type,
    severity: doc.severity,
    message: doc.message,
    metric: doc.metric ?? null,
    value: doc.value ?? null,
    threshold: doc.threshold ?? null,
    timestamp: doc.timestamp.toISOString(),
  };
}
