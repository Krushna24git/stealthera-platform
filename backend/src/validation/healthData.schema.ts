import { z } from "zod";
import { PHYSIOLOGICAL_BOUNDS } from "../config/vitals.js";

function boundedNumber(field: keyof typeof PHYSIOLOGICAL_BOUNDS) {
  const bound = PHYSIOLOGICAL_BOUNDS[field];
  return z
    .number({ invalid_type_error: `${field} must be a number` })
    .min(bound.min, `${field} below physiological range (${bound.min}${bound.unit})`)
    .max(bound.max, `${field} above physiological range (${bound.max}${bound.unit})`);
}

export const healthDataPayloadSchema = z
  .object({
    deviceId: z.string().trim().min(1, "deviceId is required"),
    patientId: z.string().trim().min(1, "patientId is required"),
    timestamp: z
      .string()
      .datetime({ offset: true, message: "timestamp must be an ISO-8601 datetime" }),
    heartRate: boundedNumber("heartRate").optional(),
    spo2: boundedNumber("spo2").optional(),
    temperature: boundedNumber("temperature").optional(),
    steps: boundedNumber("steps").int("steps must be an integer").optional(),
    fallDetected: z.boolean().optional().default(false),
  })
  .strict()
  .refine(
    (value) =>
      value.heartRate !== undefined ||
      value.spo2 !== undefined ||
      value.temperature !== undefined ||
      value.steps !== undefined ||
      value.fallDetected === true,
    { message: "at least one vital signal must be present" }
  );

export type HealthDataPayload = z.infer<typeof healthDataPayloadSchema>;
