import { Schema, model, type HydratedDocument } from "mongoose";

export interface IDevice {
  deviceId: string;
  patientId: string;
  model: string;
  firstSeen: Date;
  lastSeen: Date | null;
}

const deviceSchema = new Schema<IDevice>(
  {
    deviceId: { type: String, required: true, unique: true },
    patientId: { type: String, required: true, index: true },
    model: { type: String, default: "StealthEra Band" },
    firstSeen: { type: Date, default: () => new Date() },
    lastSeen: { type: Date, default: null },
  },
  { versionKey: false }
);

export type DeviceDoc = HydratedDocument<IDevice>;

export const Device = model<IDevice>("Device", deviceSchema, "devices");
