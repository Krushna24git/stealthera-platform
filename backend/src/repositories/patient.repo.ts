import { Patient, type PatientDoc } from "../db/models/Patient.js";
import { Device } from "../db/models/Device.js";

export const patientRepo = {
  async get(patientId: string): Promise<PatientDoc | null> {
    return Patient.findOne({ patientId });
  },

  async exists(patientId: string): Promise<boolean> {
    return (await Patient.countDocuments({ patientId })) > 0;
  },

  async list(opts: { skip: number; limit: number }): Promise<{ patients: PatientDoc[]; total: number }> {
    const [patients, total] = await Promise.all([
      Patient.find().sort({ createdAt: -1 }).skip(opts.skip).limit(opts.limit),
      Patient.countDocuments(),
    ]);
    return { patients, total };
  },

  async registerObservation(patientId: string, deviceId: string, seenAt: Date): Promise<void> {
    await Patient.updateOne(
      { patientId },
      { $addToSet: { deviceIds: deviceId }, $setOnInsert: { patientId, createdAt: seenAt } },
      { upsert: true }
    );
    await Device.updateOne(
      { deviceId },
      { $set: { patientId, lastSeen: seenAt }, $setOnInsert: { firstSeen: seenAt } },
      { upsert: true }
    );
  },
};
