/** Home-Spital-specific types — Phase 3b. */

// ═══════════════════════════════════════════════════════════════
// HomeVisit
// ═══════════════════════════════════════════════════════════════

export type HomeVisitStatus =
    | "planned"
    | "en_route"
    | "arrived"
    | "in_progress"
    | "completed"
    | "cancelled";

export type PatientCondition = "stable" | "improved" | "deteriorated" | "critical";

export const HOME_VISIT_STATUS_LABELS: Record<HomeVisitStatus, string> = {
    planned: "Geplant",
    en_route: "Unterwegs",
    arrived: "Vor Ort",
    in_progress: "Laufend",
    completed: "Durchgeführt",
    cancelled: "Abgesagt",
};

export const PATIENT_CONDITION_LABELS: Record<PatientCondition, string> = {
    stable: "Stabil",
    improved: "Verbessert",
    deteriorated: "Verschlechtert",
    critical: "Kritisch",
};

export interface HomeVisit {
    id: string;
    patient_id: string;
    appointment_id?: string;
    encounter_id?: string;
    assigned_nurse_id?: string;
    assigned_nurse_name?: string;
    status: HomeVisitStatus;
    planned_date: string;
    planned_start: string;
    planned_end?: string;
    actual_arrival?: string;
    actual_departure?: string;
    travel_time_minutes?: number;
    visit_duration_minutes?: number;
    vital_signs_recorded: boolean;
    medication_administered: boolean;
    wound_care_performed: boolean;
    iv_therapy_performed: boolean;
    blood_drawn: boolean;
    patient_condition?: PatientCondition;
    documentation?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface HomeVisitCreate {
    patient_id: string;
    appointment_id?: string;
    encounter_id?: string;
    assigned_nurse_id?: string;
    assigned_nurse_name?: string;
    planned_date: string;
    planned_start: string;
    planned_end?: string;
    notes?: string;
}

export interface HomeVisitUpdate {
    assigned_nurse_id?: string;
    assigned_nurse_name?: string;
    status?: HomeVisitStatus;
    planned_start?: string;
    planned_end?: string;
    actual_arrival?: string;
    actual_departure?: string;
    travel_time_minutes?: number;
    visit_duration_minutes?: number;
    vital_signs_recorded?: boolean;
    medication_administered?: boolean;
    wound_care_performed?: boolean;
    iv_therapy_performed?: boolean;
    blood_drawn?: boolean;
    patient_condition?: PatientCondition;
    documentation?: string;
    notes?: string;
}

export interface HomeVisitMeta {
    statuses: Record<string, string>;
    patient_conditions: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// Teleconsult
// ═══════════════════════════════════════════════════════════════

export type TeleconsultStatus =
    | "scheduled"
    | "waiting"
    | "active"
    | "completed"
    | "no_show"
    | "technical_issue";

export type TeleconsultPlatform = "zoom" | "teams" | "hin_talk" | "other";
export type TechnicalQuality = "good" | "fair" | "poor";

export const TELECONSULT_STATUS_LABELS: Record<TeleconsultStatus, string> = {
    scheduled: "Geplant",
    waiting: "Wartezimmer",
    active: "Aktiv",
    completed: "Abgeschlossen",
    no_show: "Nicht erschienen",
    technical_issue: "Technisches Problem",
};

export const TELECONSULT_PLATFORM_LABELS: Record<TeleconsultPlatform, string> = {
    zoom: "Zoom",
    teams: "Microsoft Teams",
    hin_talk: "HIN Talk",
    other: "Andere",
};

export interface Teleconsult {
    id: string;
    patient_id: string;
    appointment_id?: string;
    encounter_id?: string;
    physician_id?: string;
    physician_name?: string;
    status: TeleconsultStatus;
    meeting_link?: string;
    meeting_platform?: TeleconsultPlatform;
    scheduled_start: string;
    scheduled_end?: string;
    actual_start?: string;
    actual_end?: string;
    duration_minutes?: number;
    soap_subjective?: string;
    soap_objective?: string;
    soap_assessment?: string;
    soap_plan?: string;
    technical_quality?: TechnicalQuality;
    followup_required: boolean;
    followup_notes?: string;
    clinical_note_id?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface TeleconsultCreate {
    patient_id: string;
    appointment_id?: string;
    encounter_id?: string;
    physician_id?: string;
    physician_name?: string;
    meeting_link?: string;
    meeting_platform?: TeleconsultPlatform;
    scheduled_start: string;
    scheduled_end?: string;
    notes?: string;
}

export interface TeleconsultUpdate {
    physician_id?: string;
    physician_name?: string;
    status?: TeleconsultStatus;
    meeting_link?: string;
    meeting_platform?: TeleconsultPlatform;
    scheduled_start?: string;
    scheduled_end?: string;
    actual_start?: string;
    actual_end?: string;
    duration_minutes?: number;
    soap_subjective?: string;
    soap_objective?: string;
    soap_assessment?: string;
    soap_plan?: string;
    technical_quality?: TechnicalQuality;
    followup_required?: boolean;
    followup_notes?: string;
    clinical_note_id?: string;
    notes?: string;
}

export interface TeleconsultMeta {
    statuses: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// RemoteDevice
// ═══════════════════════════════════════════════════════════════

export type DeviceType =
    | "pulsoximeter"
    | "blood_pressure"
    | "scale"
    | "thermometer"
    | "glucometer";

export const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
    pulsoximeter: "Pulsoximeter",
    blood_pressure: "Blutdruckmessgerät",
    scale: "Waage",
    thermometer: "Thermometer",
    glucometer: "Glukometer",
};

export interface RemoteDevice {
    id: string;
    patient_id: string;
    device_type: DeviceType;
    device_name: string;
    serial_number?: string;
    manufacturer?: string;
    is_online: boolean;
    last_seen_at?: string;
    battery_level?: number;
    last_reading_value?: string;
    last_reading_unit?: string;
    last_reading_at?: string;
    alert_threshold_low?: string;
    alert_threshold_high?: string;
    installed_at?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface RemoteDeviceCreate {
    patient_id: string;
    device_type: DeviceType;
    device_name: string;
    serial_number?: string;
    manufacturer?: string;
    alert_threshold_low?: string;
    alert_threshold_high?: string;
    installed_at?: string;
    notes?: string;
}

export interface RemoteDeviceUpdate {
    device_name?: string;
    serial_number?: string;
    manufacturer?: string;
    is_online?: boolean;
    last_seen_at?: string;
    battery_level?: number;
    last_reading_value?: string;
    last_reading_unit?: string;
    last_reading_at?: string;
    alert_threshold_low?: string;
    alert_threshold_high?: string;
    notes?: string;
}

export interface RemoteDeviceMeta {
    device_types: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// Self-Medication (Patient-App Concept)
// ═══════════════════════════════════════════════════════════════

export type SelfMedStatus = "pending" | "confirmed" | "missed" | "skipped";

export const SELF_MED_STATUS_LABELS: Record<SelfMedStatus, string> = {
    pending: "Ausstehend",
    confirmed: "Bestätigt",
    missed: "Verpasst",
    skipped: "Übersprungen",
};

export interface SelfMedicationLog {
    id: string;
    patient_id: string;
    medication_id: string;
    scheduled_time: string;
    confirmed_at?: string;
    status: SelfMedStatus;
    notes?: string;
    created_at: string;
}

export interface SelfMedicationLogCreate {
    patient_id: string;
    medication_id: string;
    scheduled_time: string;
    notes?: string;
}

export interface SelfMedicationMeta {
    statuses: Record<string, string>;
}

// ═══════════════════════════════════════════════════════════════
// Transport (extends Appointment — fields already exist)
// ═══════════════════════════════════════════════════════════════

export type TransportType = "selbst" | "taxi" | "ambulanz" | "angehoerige";

export const TRANSPORT_TYPE_LABELS: Record<TransportType, string> = {
    selbst: "Selbständig",
    taxi: "Taxi",
    ambulanz: "Ambulanz",
    angehoerige: "Angehörige",
};
