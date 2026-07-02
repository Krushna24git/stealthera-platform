import { clamp, round } from "../utils/stats.js";

export interface RecoveryInput {
  heartRate: number | null;
  spo2: number | null;
  temperature: number | null;
  recentCriticalAlerts: number;
}

export interface RecoveryScore {
  score: number;
  band: "poor" | "fair" | "good" | "excellent";
  factors: string[];
}

export function computeRecoveryScore(input: RecoveryInput): RecoveryScore {
  let score = 100;
  const factors: string[] = [];

  if (input.heartRate !== null) {
    const overResting = Math.max(0, input.heartRate - 100);
    const underResting = Math.max(0, 55 - input.heartRate);
    const penalty = Math.min(30, (overResting + underResting) * 0.8);
    if (penalty > 0) {
      score -= penalty;
      factors.push(`heart rate ${input.heartRate} bpm outside resting band`);
    }
  }

  if (input.spo2 !== null && input.spo2 < 97) {
    const penalty = Math.min(30, (97 - input.spo2) * 4);
    score -= penalty;
    factors.push(`SpO2 ${input.spo2}% below optimal`);
  }

  if (input.temperature !== null) {
    const deviation = Math.abs(input.temperature - 36.8);
    if (deviation > 0.5) {
      const penalty = Math.min(20, (deviation - 0.5) * 15);
      score -= penalty;
      factors.push(`temperature ${input.temperature}C deviates from baseline`);
    }
  }

  if (input.recentCriticalAlerts > 0) {
    const penalty = Math.min(25, input.recentCriticalAlerts * 12);
    score -= penalty;
    factors.push(`${input.recentCriticalAlerts} recent critical alert(s)`);
  }

  const finalScore = round(clamp(score, 0, 100));
  return { score: finalScore, band: toBand(finalScore), factors };
}

function toBand(score: number): RecoveryScore["band"] {
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  return "poor";
}
