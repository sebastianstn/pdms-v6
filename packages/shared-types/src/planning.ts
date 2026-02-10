/** Planning & scheduling types shared between frontend and backend. */

// ─── Appointment Types ────────────────────────────────────────

export type AppointmentType =
    | "visit"
    | "iv_therapy"
    | "blood_draw"
    | "wound_care"
    | "telemedizin"
    | "physio"
    | "spitex"
    | "other";

export type AppointmentStatus =
    | "planned"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "no_show";

export type RecurrenceRule = "daily" | "weekly" | "biweekly" | "monthly";

export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
    visit: "Arztvisite",
    iv_therapy: "IV-Therapie",
    blood_draw: "Blutentnahme",
    wound_care: "Wundversorgung",
    telemedizin: "Telemedizin",
    physio: "Physiotherapie",
    spitex: "Spitex-Besuch",
    other: "Sonstiges",
};

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
    planned: "Geplant",
    confirmed: "Bestätigt",
    in_progress: "Laufend",
    completed: "Abgeschlossen",
    cancelled: "Abgesagt",
    no_show: "Nicht erschienen",
};

export interface Appointment {
    id: string;
    patient_id: string;
    encounter_id?: string;
    appointment_type: AppointmentType;
    title: string;
    description?: string;
    location?: string;
    scheduled_date: string;
    start_time: string;
    end_time?: string;
    duration_minutes: number;
    assigned_to?: string;
    assigned_name?: string;
    status: AppointmentStatus;
    is_recurring: boolean;
    recurrence_rule?: RecurrenceRule;
    recurrence_end?: string;
    parent_appointment_id?: string;
    transport_required: boolean;
    transport_type?: string;
    transport_notes?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface AppointmentCreate {
    patient_id: string;
    encounter_id?: string;
    appointment_type: AppointmentType;
    title: string;
    description?: string;
    location?: string;
    scheduled_date: string;
    start_time: string;
    end_time?: string;
    duration_minutes: number;
    assigned_to?: string;
    assigned_name?: string;
    is_recurring?: boolean;
    recurrence_rule?: RecurrenceRule;
    recurrence_end?: string;
    transport_required?: boolean;
    transport_type?: string;
    transport_notes?: string;
    notes?: string;
}

export interface AppointmentUpdate {
    appointment_type?: AppointmentType;
    title?: string;
    description?: string;
    location?: string;
    scheduled_date?: string;
    start_time?: string;
    end_time?: string;
    duration_minutes?: number;
    assigned_to?: string;
    assigned_name?: string;
    transport_required?: boolean;
    transport_type?: string;
    transport_notes?: string;
    notes?: string;
}

export interface AppointmentMeta {
    types: Record<string, string>;
    statuses: Record<string, string>;
}

// ─── Discharge Criteria Types ─────────────────────────────────

export interface DischargeCriteria {
    id: string;
    patient_id: string;
    encounter_id?: string;
    planned_discharge_date?: string;
    actual_discharge_date?: string;
    crp_declining: boolean;
    crp_below_50: boolean;
    afebrile_48h: boolean;
    oral_stable_48h: boolean;
    clinical_improvement: boolean;
    aftercare_organized: boolean;
    followup_gp?: string;
    followup_gp_date?: string;
    followup_spitex?: string;
    followup_spitex_date?: string;
    notes?: string;
    updated_at: string;
    criteria_met: number;
    progress_percent: number;
}

export interface DischargeCriteriaUpdate {
    planned_discharge_date?: string;
    actual_discharge_date?: string;
    crp_declining?: boolean;
    crp_below_50?: boolean;
    afebrile_48h?: boolean;
    oral_stable_48h?: boolean;
    clinical_improvement?: boolean;
    aftercare_organized?: boolean;
    followup_gp?: string;
    followup_gp_date?: string;
    followup_spitex?: string;
    followup_spitex_date?: string;
    notes?: string;
}
