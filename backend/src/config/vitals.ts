export interface PhysiologicalBound {
  min: number;
  max: number;
  unit: string;
}

export const PHYSIOLOGICAL_BOUNDS: Record<string, PhysiologicalBound> = {
  heartRate: { min: 20, max: 240, unit: "bpm" },
  spo2: { min: 50, max: 100, unit: "%" },
  temperature: { min: 30, max: 45, unit: "C" },
  steps: { min: 0, max: 200000, unit: "count" },
};

export const VITAL_FIELDS = ["heartRate", "spo2", "temperature", "steps"] as const;
export type VitalField = (typeof VITAL_FIELDS)[number];
