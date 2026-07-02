import { HealthData, type HealthDataDoc, type IHealthData } from "../db/models/HealthData.js";

interface HealthDataInput {
  deviceId: string;
  patientId: string;
  timestamp: Date;
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  steps: number | null;
  fallDetected: boolean;
}

export interface SummaryAggregate {
  avgHeartRate: number | null;
  avgSpo2: number | null;
  totalSteps: number;
  sampleCount: number;
  firstAt: Date | null;
  lastAt: Date | null;
}

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
}

export const healthDataRepo = {
  async insertUnique(input: HealthDataInput): Promise<{ created: boolean; doc: HealthDataDoc }> {
    try {
      const doc = await HealthData.create(input);
      return { created: true, doc };
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const existing = await HealthData.findOne({
          deviceId: input.deviceId,
          timestamp: input.timestamp,
        });
        if (existing) return { created: false, doc: existing };
      }
      throw error;
    }
  },

  async latestForPatient(patientId: string): Promise<HealthDataDoc | null> {
    return HealthData.findOne({ patientId }).sort({ timestamp: -1 });
  },

  // Batched variant for list views: one aggregation instead of a query per
  // patient. Rides the { patientId: 1, timestamp: -1 } index.
  async latestForPatients(patientIds: string[]): Promise<Map<string, IHealthData & { _id: unknown }>> {
    if (patientIds.length === 0) return new Map();
    const rows = await HealthData.aggregate<{ _id: string; doc: IHealthData & { _id: unknown } }>([
      { $match: { patientId: { $in: patientIds } } },
      { $sort: { patientId: 1, timestamp: -1 } },
      { $group: { _id: "$patientId", doc: { $first: "$$ROOT" } } },
    ]);
    return new Map(rows.map((row) => [row._id, row.doc]));
  },

  async history(
    patientId: string,
    opts: { from?: Date; to?: Date; limit: number; order: 1 | -1 }
  ): Promise<HealthDataDoc[]> {
    const filter: Record<string, unknown> = { patientId };
    if (opts.from || opts.to) {
      const range: Record<string, Date> = {};
      if (opts.from) range.$gte = opts.from;
      if (opts.to) range.$lte = opts.to;
      filter.timestamp = range;
    }
    return HealthData.find(filter).sort({ timestamp: opts.order }).limit(opts.limit);
  },

  async countForPatient(patientId: string): Promise<number> {
    return HealthData.countDocuments({ patientId });
  },

  async summaryAggregate(patientId: string): Promise<SummaryAggregate> {
    const [result] = await HealthData.aggregate<SummaryAggregate>([
      { $match: { patientId } },
      {
        $group: {
          _id: "$patientId",
          avgHeartRate: { $avg: "$heartRate" },
          avgSpo2: { $avg: "$spo2" },
          totalSteps: { $sum: { $ifNull: ["$steps", 0] } },
          sampleCount: { $sum: 1 },
          firstAt: { $min: "$timestamp" },
          lastAt: { $max: "$timestamp" },
        },
      },
      { $project: { _id: 0, avgHeartRate: 1, avgSpo2: 1, totalSteps: 1, sampleCount: 1, firstAt: 1, lastAt: 1 } },
    ]);

    return (
      result ?? {
        avgHeartRate: null,
        avgSpo2: null,
        totalSteps: 0,
        sampleCount: 0,
        firstAt: null,
        lastAt: null,
      }
    );
  },
};
