import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { connectDatabase, disconnectDatabase } from "../db/connection.js";
import { HealthData } from "../db/models/HealthData.js";
import { Alert } from "../db/models/Alert.js";
import { Patient } from "../db/models/Patient.js";
import { Device } from "../db/models/Device.js";
import { userRepo } from "../repositories/user.repo.js";
import { geneticsRepo } from "../repositories/genetics.repo.js";
import { patientRepo } from "../repositories/patient.repo.js";
import { ingestHealthData } from "../services/ingestion.service.js";
import { logger } from "../utils/logger.js";
import type { HealthDataPayload } from "../validation/healthData.schema.js";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "../../sample-data");

interface PatientSeed {
  patientId: string;
  name: string;
  sex: "male" | "female" | "other" | "unknown";
  dateOfBirth: string;
  cardiacRisk: "Low" | "Moderate" | "High";
  diabetesRisk: "Low" | "Moderate" | "High";
}

function load<T>(file: string): T {
  return JSON.parse(readFileSync(resolve(dataDir, file), "utf8")) as T;
}

async function seed(): Promise<void> {
  await connectDatabase();

  await Promise.all([
    HealthData.deleteMany({}),
    Alert.deleteMany({}),
    Patient.deleteMany({}),
    Device.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash(env.seed.adminPassword, 10);
  await userRepo.createIfAbsent({
    email: env.seed.adminEmail,
    name: "StealthEra Admin",
    role: "admin",
    passwordHash,
  });

  const patients = load<PatientSeed[]>("patients.json");
  for (const patient of patients) {
    await Patient.updateOne(
      { patientId: patient.patientId },
      {
        $set: {
          patientId: patient.patientId,
          name: patient.name,
          sex: patient.sex,
          dateOfBirth: new Date(patient.dateOfBirth),
        },
      },
      { upsert: true }
    );
    await geneticsRepo.upsert({
      patientId: patient.patientId,
      cardiacRisk: patient.cardiacRisk,
      diabetesRisk: patient.diabetesRisk,
    });
  }

  const records = load<HealthDataPayload[]>("health-data.json");
  let stored = 0;
  let alerts = 0;
  for (const record of records) {
    const result = await ingestHealthData({ ...record, fallDetected: record.fallDetected ?? false });
    if (result.created) stored += 1;
    alerts += result.alerts.length;
  }

  const patientDocs = await patientRepo.list({ skip: 0, limit: 100 });
  logger.info(
    `seed complete: ${patientDocs.total} patients, ${stored} samples, ${alerts} alerts, admin=${env.seed.adminEmail}`
  );

  await disconnectDatabase();
}

seed().catch(async (error) => {
  logger.error("seed failed", error);
  await disconnectDatabase();
  process.exit(1);
});
