/**
 * Appointment Zod-Validators — Validierung für Termine.
 */
import { z } from "zod";

export const APPOINTMENT_TYPES = [
    "hausbesuch",
    "teleconsult",
    "konsil",
    "ambulant",
    "labor",
    "entlassung",
    "spitex",
    "physiotherapie",
] as const;

export const APPOINTMENT_STATUSES = [
    "planned",
    "confirmed",
    "in_progress",
    "completed",
    "cancelled",
    "no_show",
] as const;

export const RECURRENCE_RULES = [
    "daily",
    "weekly",
    "biweekly",
    "monthly",
] as const;

export const appointmentCreateSchema = z.object({
    patient_id: z.string().uuid("Ungültige Patienten-ID"),
    encounter_id: z.string().uuid().optional().nullable(),
    appointment_type: z.enum(APPOINTMENT_TYPES, {
        errorMap: () => ({ message: "Ungültiger Termin-Typ" }),
    }),
    title: z
        .string()
        .min(1, "Titel ist erforderlich")
        .max(255, "Titel darf maximal 255 Zeichen lang sein"),
    description: z.string().max(2000).optional().nullable(),
    location: z.string().max(200).optional().nullable(),
    scheduled_date: z.string().date("Ungültiges Datum (YYYY-MM-DD)"),
    start_time: z.string().min(1, "Startzeit ist erforderlich"),
    end_time: z.string().optional().nullable(),
    duration_minutes: z
        .number()
        .int()
        .min(5, "Mindestdauer: 5 Minuten")
        .max(480, "Maximaldauer: 8 Stunden")
        .default(30),
    assigned_to: z.string().uuid().optional().nullable(),
    assigned_name: z.string().max(200).optional().nullable(),
    is_recurring: z.boolean().default(false),
    recurrence_rule: z.enum(RECURRENCE_RULES).optional().nullable(),
    recurrence_end: z.string().date().optional().nullable(),
    transport_required: z.boolean().default(false),
    transport_type: z.string().max(50).optional().nullable(),
    transport_notes: z.string().max(500).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
});

export const appointmentUpdateSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(2000).optional().nullable(),
    location: z.string().max(200).optional().nullable(),
    scheduled_date: z.string().date().optional(),
    start_time: z.string().optional(),
    end_time: z.string().optional().nullable(),
    duration_minutes: z.number().int().min(5).max(480).optional(),
    assigned_to: z.string().uuid().optional().nullable(),
    assigned_name: z.string().max(200).optional().nullable(),
    transport_required: z.boolean().optional(),
    transport_type: z.string().max(50).optional().nullable(),
    transport_notes: z.string().max(500).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
});

export type AppointmentCreateForm = z.infer<typeof appointmentCreateSchema>;
export type AppointmentUpdateForm = z.infer<typeof appointmentUpdateSchema>;
