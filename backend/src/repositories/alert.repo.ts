import { Alert, type AlertDoc } from "../db/models/Alert.js";

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

export const alertRepo = {
  async insertMany(alerts: AlertInput[]): Promise<AlertDoc[]> {
    if (alerts.length === 0) return [];
    return Alert.insertMany(alerts);
  },

  async latestForPatient(patientId: string): Promise<AlertDoc | null> {
    return Alert.findOne({ patientId }).sort({ timestamp: -1, createdAt: -1 });
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
