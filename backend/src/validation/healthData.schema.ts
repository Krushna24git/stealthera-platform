import { z } from "zod";
import { PHYSIOLOGICAL_BOUNDS } from "../config/vitals.js";

// Device clocks drift; readings dated slightly ahead of server time are fine,
// but a far-future timestamp is a sensor/clock fault and would corrupt
// "latest vitals" views forever, so it is rejected like an impossible reading.
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

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
      .datetime({ offset: true, message: "timestamp must be an ISO-8601 datetime" })
      .refine((value) => new Date(value).getTime() <= Date.now() + MAX_CLOCK_SKEW_MS, {
        message: "timestamp is in the future beyond allowed clock skew",
      }),
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
