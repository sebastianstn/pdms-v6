/**
 * Consent Zod-Validators — Validierung für Einwilligungen.
 */
import { z } from "zod";

export const CONSENT_TYPES = [
    "home_spital",
    "iv_antibiotics",
    "telemedizin",
    "ndsg",
    "epdg",
    "thromboprophylaxe",
] as const;

export const CONSENT_STATUSES = [
    "pending",
    "granted",
    "refused",
    "revoked",
] as const;

export const consentCreateSchema = z.object({
    patient_id: z.string().uuid("Ungültige Patienten-ID"),
    consent_type: z.enum(CONSENT_TYPES, {
        errorMap: () => ({ message: "Ungültiger Einwilligungstyp" }),
    }),
    status: z.enum(["pending", "granted", "refused"]).default("pending"),
    granted_by: z.string().max(200).optional().nullable(),
    valid_from: z.string().date("Ungültiges Datum (YYYY-MM-DD)").optional().nullable(),
    valid_until: z.string().date("Ungültiges Datum (YYYY-MM-DD)").optional().nullable(),
    witness_name: z.string().max(200).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
});

export const consentUpdateSchema = z.object({
    status: z.enum(CONSENT_STATUSES).optional(),
    granted_by: z.string().max(200).optional().nullable(),
    valid_from: z.string().date().optional().nullable(),
    valid_until: z.string().date().optional().nullable(),
    revoked_reason: z.string().max(500).optional().nullable(),
    witness_name: z.string().max(200).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
});

export type ConsentCreateForm = z.infer<typeof consentCreateSchema>;
export type ConsentUpdateForm = z.infer<typeof consentUpdateSchema>;
