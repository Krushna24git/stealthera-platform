import { Alert, type AlertDoc, type IAlert } from "../db/models/Alert.js";

interface AlertInput {
  patientId: string;
  deviceId: string;
  type: string;
  severity: string;
  message: string;
  metric: string | null;
  value: number | null;
  threshold: number | null;
  timestamp: Date;
}

type AlertLean = IAlert & { _id: unknown };

// One packet can trigger several rules at the same timestamp; "latest alert"
// must then surface the most severe one, not whichever the index returns first.
const SEVERITY_ORDER = ["critical", "warning", "info"];

function latestAlertPipeline(match: Record<string, unknown>) {
  return [
    { $match: match },
    { $addFields: { severityRank: { $indexOfArray: [SEVERITY_ORDER, "$severity"] } } },
    { $sort: { patientId: 1 as const, timestamp: -1 as const, severityRank: 1 as const, createdAt: -1 as const } },
    { $group: { _id: "$patientId", doc: { $first: "$$ROOT" } } },
  ];
}

export const alertRepo = {
  async insertMany(alerts: AlertInput[]): Promise<AlertDoc[]> {
    if (alerts.length === 0) return [];
    return Alert.insertMany(alerts);
  },

  async latestForPatient(patientId: string): Promise<AlertLean | null> {
    const rows = await Alert.aggregate<{ _id: string; doc: AlertLean }>(
      latestAlertPipeline({ patientId })
    );
    return rows[0]?.doc ?? null;
  },

  // Batched variant for list views; see healthDataRepo.latestForPatients.
  async latestForPatients(patientIds: string[]): Promise<Map<string, AlertLean>> {
    if (patientIds.length === 0) return new Map();
    const rows = await Alert.aggregate<{ _id: string; doc: AlertLean }>(
      latestAlertPipeline({ patientId: { $in: patientIds } })
    );
    return new Map(rows.map((row) => [row._id, row.doc]));
  },

  async listForPatient(
    patientId: string,
    opts: { limit: number; order: 1 | -1 }
  ): Promise<AlertDoc[]> {
    return Alert.find({ patientId }).sort({ timestamp: opts.order }).limit(opts.limit);
  },

  async countForPatient(patientId: string): Promise<number> {
    return Alert.countDocuments({ patientId });
  },

  async countRecentCritical(patientId: string, since: Date): Promise<number> {
    return Alert.countDocuments({ patientId, severity: "critical", timestamp: { $gte: since } });
  },
};
