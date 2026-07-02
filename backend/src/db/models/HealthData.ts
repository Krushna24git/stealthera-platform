import { Schema, model, type HydratedDocument } from "mongoose";

export interface IHealthData {
  deviceId: string;
  patientId: string;
  timestamp: Date;
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  steps: number | null;
  fallDetected: boolean;
  ingestedAt: Date;
}

const healthDataSchema = new Schema<IHealthData>(
  {
    deviceId: { type: String, required: true, index: true },
    patientId: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true },
    heartRate: { type: Number, default: null },
    spo2: { type: Number, default: null },
    temperature: { type: Number, default: null },
    steps: { type: Number, default: null },
    fallDetected: { type: Boolean, default: false },
    ingestedAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

healthDataSchema.index({ deviceId: 1, timestamp: 1 }, { unique: true });
healthDataSchema.index({ patientId: 1, timestamp: -1 });

export type HealthDataDoc = HydratedDocument<IHealthData>;

export const HealthData = model<IHealthData>("HealthData", healthDataSchema, "health_data");
