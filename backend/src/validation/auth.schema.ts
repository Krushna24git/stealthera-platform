import { z } from "zod";

export const loginSchema = z
  .object({
    email: z.string().trim().email("valid email is required"),
    password: z.string().min(1, "password is required"),
  })
  .strict();

export type LoginPayload = z.infer<typeof loginSchema>;
