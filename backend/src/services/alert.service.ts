import { env } from "../config/env.js";

export interface VitalSample {
  patientId: string;
  deviceId: string;
  timestamp: Date;
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  steps: number | null;
  fallDetected: boolean;
}

export interface EvaluatedAlert {
  patientId: string;
  deviceId: string;
  type: string;
  severity: "info" | "warning" | "critical";
  message: string;
  metric: string | null;
  value: number | null;
  threshold: number | null;
  timestamp: Date;
}

type Rule = (sample: VitalSample) => Omit<EvaluatedAlert, "patientId" | "deviceId" | "timestamp"> | null;

const rules: Rule[] = [
  (s) => {
    if (s.heartRate === null) return null;
    if (s.heartRate > env.thresholds.heartRateHigh) {
      return {
        type: "HIGH_HEART_RATE",
        severity: s.heartRate > env.thresholds.heartRateHigh + 30 ? "critical" : "warning",
        message: `Heart rate ${s.heartRate} bpm exceeds ${env.thresholds.heartRateHigh} bpm`,
        metric: "heartRate",
        value: s.heartRate,
        threshold: env.thresholds.heartRateHigh,
      };
    }
    if (s.heartRate < env.thresholds.heartRateLow) {
      return {
        type: "LOW_HEART_RATE",
        severity: "warning",
        message: `Heart rate ${s.heartRate} bpm is below ${env.thresholds.heartRateLow} bpm`,
        metric: "heartRate",
        value: s.heartRate,
        threshold: env.thresholds.heartRateLow,
      };
    }
    return null;
  },
  (s) => {
    if (s.spo2 === null || s.spo2 >= env.thresholds.spo2Low) return null;
    return {
      type: "LOW_SPO2",
      severity: s.spo2 < env.thresholds.spo2Low - 5 ? "critical" : "warning",
      message: `SpO2 ${s.spo2}% is below ${env.thresholds.spo2Low}%`,
      metric: "spo2",
      value: s.spo2,
      threshold: env.thresholds.spo2Low,
    };
  },
  (s) => {
    if (s.temperature === null) return null;
    if (s.temperature > env.thresholds.temperatureHigh) {
      return {
        type: "HIGH_TEMPERATURE",
        severity: s.temperature > env.thresholds.temperatureHigh + 1.5 ? "critical" : "warning",
        message: `Temperature ${s.temperature}C exceeds ${env.thresholds.temperatureHigh}C`,
        metric: "temperature",
        value: s.temperature,
        threshold: env.thresholds.temperatureHigh,
      };
    }
    if (s.temperature < env.thresholds.temperatureLow) {
      return {
        type: "LOW_TEMPERATURE",
        severity: "warning",
        message: `Temperature ${s.temperature}C is below ${env.thresholds.temperatureLow}C`,
        metric: "temperature",
        value: s.temperature,
        threshold: env.thresholds.temperatureLow,
      };
    }
    return null;
  },
  (s) => {
    if (!s.fallDetected) return null;
    return {
      type: "FALL_DETECTED",
      severity: "critical",
      message: "Fall detected by wearable device",
      metric: "fallDetected",
      value: null,
      threshold: null,
    };
  },
];

export function evaluateAlerts(sample: VitalSample): EvaluatedAlert[] {
  const alerts: EvaluatedAlert[] = [];
  for (const rule of rules) {
    const outcome = rule(sample);
    if (outcome) {
      alerts.push({
        ...outcome,
        patientId: sample.patientId,
        deviceId: sample.deviceId,
        timestamp: sample.timestamp,
      });
    }
  }
  return alerts;
}
