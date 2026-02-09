/**
 * VitalSign Zod schemas.
 */
import { z } from "zod";

export const VitalSignSchema = z.object({
  patient_id: z.string().uuid(),
  encounter_id: z.string().uuid().optional(),
  heart_rate: z.number().min(0).max(300).optional(),
  systolic_bp: z.number().min(0).max(400).optional(),
  diastolic_bp: z.number().min(0).max(300).optional(),
  spo2: z.number().min(0).max(100).optional(),
  temperature: z.number().min(25).max(45).optional(),
  respiratory_rate: z.number().min(0).max(80).optional(),
  gcs: z.number().int().min(3).max(15).optional(),
  pain_score: z.number().int().min(0).max(10).optional(),
  source: z.enum(["manual", "device", "hl7"]).default("manual"),
});

export type VitalSignInput = z.infer<typeof VitalSignSchema>;
