import { z } from "zod";

export const patientIdParamSchema = z.object({
  id: z.string().trim().min(1, "patient id is required"),
});

export const geneticsParamSchema = z.object({
  patientId: z.string().trim().min(1, "patientId is required"),
});
