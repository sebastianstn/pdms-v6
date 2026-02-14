/**
 * Patient Zod schemas — mirrors backend Pydantic schemas.
 */
import { z } from "zod";

export const PatientCreateSchema = z.object({
  ahv_number: z.string().regex(/^756\.\d{4}\.\d{4}\.\d{2}$/, "Format: 756.XXXX.XXXX.XX").optional(),
  first_name: z.string().min(1, "Pflichtfeld").max(100),
  last_name: z.string().min(1, "Pflichtfeld").max(100),
  date_of_birth: z.string().min(1, "Pflichtfeld"),
  gender: z.enum(["male", "female", "other", "unknown"]),
  blood_type: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  address_street: z.string().optional(),
  address_zip: z.string().optional(),
  address_city: z.string().optional(),
  address_canton: z.string().max(2).optional(),
  language: z.string().default("de"),
});

export const PatientUpdateSchema = PatientCreateSchema.partial();

export type PatientCreateInput = z.infer<typeof PatientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof PatientUpdateSchema>;
