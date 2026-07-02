import { Schema, model, type HydratedDocument } from "mongoose";

export interface IPatient {
  patientId: string;
  name: string;
  dateOfBirth: Date | null;
  sex: string;
  deviceIds: string[];
  createdAt: Date;
}

const patientSchema = new Schema<IPatient>(
  {
    patientId: { type: String, required: true, unique: true },
    name: { type: String, default: "" },
    dateOfBirth: { type: Date, default: null },
    sex: { type: String, enum: ["male", "female", "other", "unknown"], default: "unknown" },
    deviceIds: { type: [String], default: [] },
    createdAt: { type: Date, default: () => new Date() },
  },
  { versionKey: false }
);

export type PatientDoc = HydratedDocument<IPatient>;

export const Patient = model<IPatient>("Patient", patientSchema, "patients");
