import { healthDataRepo } from "../repositories/healthData.repo.js";
import { alertRepo } from "../repositories/alert.repo.js";
import { patientRepo } from "../repositories/patient.repo.js";
import { toVitalsDto, toAlertDto, type VitalsDto, type AlertDto } from "./mappers.js";
import { computeRecoveryScore, type RecoveryScore } from "./recovery.service.js";
import { notFound } from "../utils/errors.js";
import { round } from "../utils/stats.js";

export interface HistoryQuery {
  from?: Date;
  to?: Date;
  limit: number;
  order: 1 | -1;
}

async function assertPatientHasData(patientId: string): Promise<void> {
  const known = (await patientRepo.exists(patientId)) || (await healthDataRepo.countForPatient(patientId)) > 0;
  if (!known) throw notFound(`No records found for patient ${patientId}`);
}

export interface PatientListRow {
  patientId: string;
  name: string;
  sex: string;
  deviceIds: string[];
  latest: VitalsDto | null;
  latestAlert: AlertDto | null;
}

export async function listPatients(opts: {
  skip: number;
  limit: number;
}): Promise<{ patients: PatientListRow[]; total: number }> {
  const { patients, total } = await patientRepo.list(opts);
  const patientIds = patients.map((patient) => patient.patientId);
  const [latestByPatient, latestAlertByPatient] = await Promise.all([
    healthDataRepo.latestForPatients(patientIds),
    alertRepo.latestForPatients(patientIds),
  ]);

  const rows = patients.map((patient) => {
    const latest = latestByPatient.get(patient.patientId);
    const latestAlert = latestAlertByPatient.get(patient.patientId);
    return {
      patientId: patient.patientId,
      name: patient.name ?? "",
      sex: patient.sex ?? "unknown",
      deviceIds: patient.deviceIds ?? [],
      latest: latest ? toVitalsDto(latest) : null,
      latestAlert: latestAlert ? toAlertDto(latestAlert) : null,
    };
  });
  return { patients: rows, total };
}

export async function getLatestVitals(patientId: string): Promise<VitalsDto> {
  const latest = await healthDataRepo.latestForPatient(patientId);
  if (!latest) throw notFound(`No records found for patient ${patientId}`);
  return toVitalsDto(latest);
}

export async function getHistory(
  patientId: string,
  query: HistoryQuery
): Promise<{ patientId: string; count: number; total: number; data: VitalsDto[] }> {
  await assertPatientHasData(patientId);
  const [docs, total] = await Promise.all([
    healthDataRepo.history(patientId, query),
    healthDataRepo.countForPatient(patientId),
  ]);
  return { patientId, count: docs.length, total, data: docs.map(toVitalsDto) };
}

export async function getAlerts(
  patientId: string,
  opts: { limit: number; order: 1 | -1 }
): Promise<{ patientId: string; count: number; total: number; data: AlertDto[] }> {
  await assertPatientHasData(patientId);
  const [alerts, total] = await Promise.all([
    alertRepo.listForPatient(patientId, opts),
    alertRepo.countForPatient(patientId),
  ]);
  return { patientId, count: alerts.length, total, data: alerts.map(toAlertDto) };
}

export interface PatientSummary {
  patientId: string;
  latestVitals: VitalsDto | null;
  averages: { heartRate: number | null; spo2: number | null };
  totals: { steps: number };
  sampleCount: number;
  window: { firstAt: string | null; lastAt: string | null };
  latestAlert: AlertDto | null;
  recoveryScore: RecoveryScore;
}

export async function getSummary(patientId: string): Promise<PatientSummary> {
  await assertPatientHasData(patientId);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [latest, aggregate, latestAlert, recentCritical] = await Promise.all([
    healthDataRepo.latestForPatient(patientId),
    healthDataRepo.summaryAggregate(patientId),
    alertRepo.latestForPatient(patientId),
    alertRepo.countRecentCritical(patientId, since),
  ]);

  const recoveryScore = computeRecoveryScore({
    heartRate: latest?.heartRate ?? null,
    spo2: latest?.spo2 ?? null,
    temperature: latest?.temperature ?? null,
    recentCriticalAlerts: recentCritical,
  });

  return {
    patientId,
    latestVitals: latest ? toVitalsDto(latest) : null,
    averages: {
      heartRate: aggregate.avgHeartRate !== null ? round(aggregate.avgHeartRate, 1) : null,
      spo2: aggregate.avgSpo2 !== null ? round(aggregate.avgSpo2, 1) : null,
    },
    totals: { steps: aggregate.totalSteps },
    sampleCount: aggregate.sampleCount,
    window: {
      firstAt: aggregate.firstAt ? new Date(aggregate.firstAt).toISOString() : null,
      lastAt: aggregate.lastAt ? new Date(aggregate.lastAt).toISOString() : null,
    },
    latestAlert: latestAlert ? toAlertDto(latestAlert) : null,
    recoveryScore,
  };
}
