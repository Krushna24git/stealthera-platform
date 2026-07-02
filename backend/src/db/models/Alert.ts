import { Schema, model, type HydratedDocument } from "mongoose";

export const ALERT_TYPES = [
  "HIGH_HEART_RATE",
  "LOW_HEART_RATE",
  "LOW_SPO2",
  "HIGH_TEMPERATURE",
  "LOW_TEMPERATURE",
  "FALL_DETECTED",
] as const;

export const ALERT_SEVERITIES = ["info", "warning", "critical"] as const;

export interface IAlert {
  patientId: string;
  deviceId: string;
  type: string;
  severity: string;
  message: string;
  metric: string | null;
  value: number | null;
  threshold: number | null;
  timestamp: Date;
  createdAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    patientId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    type: { type: String, enum: ALERT_TYPES, required: true },
    severity: { type: String, enum: ALERT_SEVERITIES, required: true },
    message: { type: String, required: true },
    metric: { type: String, default: null },
    value: { type: Number, default: null },
    threshold: { type: Number, default: null },
    timestamp: { type: Date, required: true },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

alertSchema.index({ patientId: 1, timestamp: -1 });

export type AlertDoc = HydratedDocument<IAlert>;

export const Alert = model<IAlert>("Alert", alertSchema, "alerts");
