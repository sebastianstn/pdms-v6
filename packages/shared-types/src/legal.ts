/** Legal & compliance types shared between frontend and backend. */

// ─── Consent Types ────────────────────────────────────────────

export type ConsentType =
    | "home_spital"
    | "iv_antibiotics"
    | "telemedizin"
    | "ndsg"
    | "epdg"
    | "thromboprophylaxe";

export type ConsentStatus = "pending" | "granted" | "refused" | "revoked";

export const CONSENT_TYPE_LABELS: Record<ConsentType, string> = {
    home_spital: "Home-Spital Behandlung",
    iv_antibiotics: "IV-Antibiose zu Hause",
    telemedizin: "Telemedizin-Konsultation",
    ndsg: "Datenschutz (nDSG)",
    epdg: "Elektronisches Patientendossier (EPDG)",
    thromboprophylaxe: "Thromboseprophylaxe",
};

export const CONSENT_STATUS_LABELS: Record<ConsentStatus, string> = {
    pending: "Ausstehend",
    granted: "Erteilt",
    refused: "Verweigert",
    revoked: "Widerrufen",
};

export interface Consent {
    id: string;
    patient_id: string;
    consent_type: ConsentType;
    status: ConsentStatus;
    granted_at?: string;
    granted_by?: string;
    valid_from?: string;
    valid_until?: string;
    revoked_at?: string;
    revoked_reason?: string;
    witness_name?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface ConsentCreate {
    patient_id: string;
    consent_type: ConsentType;
    status?: ConsentStatus;
    granted_by?: string;
    valid_from?: string;
    valid_until?: string;
    witness_name?: string;
    notes?: string;
}

export interface ConsentUpdate {
    status?: ConsentStatus;
    granted_by?: string;
    valid_from?: string;
    valid_until?: string;
    witness_name?: string;
    notes?: string;
}

export interface ConsentMeta {
    consent_types: Record<string, string>;
    consent_statuses: Record<string, string>;
}

// ─── Advance Directive Types ──────────────────────────────────

export type DirectiveType = "patientenverfuegung" | "vorsorgeauftrag";
export type ReaStatus = "FULL" | "DNR";

export const DIRECTIVE_TYPE_LABELS: Record<DirectiveType, string> = {
    patientenverfuegung: "Patientenverfügung",
    vorsorgeauftrag: "Vorsorgeauftrag",
};

export interface AdvanceDirective {
    id: string;
    patient_id: string;
    directive_type: DirectiveType;
    rea_status: ReaStatus;
    intensive_care: boolean;
    mechanical_ventilation: boolean;
    dialysis: boolean;
    artificial_nutrition: boolean;
    trusted_person_name?: string;
    trusted_person_phone?: string;
    trusted_person_relation?: string;
    trusted_person_contact_id?: string;
    document_date?: string;
    storage_location?: string;
    is_valid: boolean;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface DirectiveCreate {
    patient_id: string;
    directive_type: DirectiveType;
    rea_status: ReaStatus;
    intensive_care?: boolean;
    mechanical_ventilation?: boolean;
    dialysis?: boolean;
    artificial_nutrition?: boolean;
    trusted_person_name?: string;
    trusted_person_phone?: string;
    trusted_person_relation?: string;
    trusted_person_contact_id?: string;
    document_date?: string;
    storage_location?: string;
    notes?: string;
}

export interface DirectiveUpdate {
    directive_type?: DirectiveType;
    rea_status?: ReaStatus;
    intensive_care?: boolean;
    mechanical_ventilation?: boolean;
    dialysis?: boolean;
    artificial_nutrition?: boolean;
    trusted_person_name?: string;
    trusted_person_phone?: string;
    trusted_person_relation?: string;
    trusted_person_contact_id?: string;
    document_date?: string;
    storage_location?: string;
    is_valid?: boolean;
    notes?: string;
}

export interface DirectiveMeta {
    directive_types: Record<string, string>;
    rea_statuses: Record<string, string>;
}

// ─── Patient Wishes Types (ZGB 378) ──────────────────────────

export interface PatientWishes {
    id: string;
    patient_id: string;
    quality_of_life?: string;
    autonomy_preferences?: string;
    pain_management?: string;
    decision_maker?: string;
    decision_maker_contact_id?: string;
    sleep_preferences?: string;
    nutrition_preferences?: string;
    family_wishes?: string;
    pet_info?: string;
    spiritual_needs?: string;
    other_wishes?: string;
    recorded_by?: string;
    recorded_at: string;
    updated_at: string;
}

export interface WishesUpsert {
    quality_of_life?: string;
    autonomy_preferences?: string;
    pain_management?: string;
    decision_maker?: string;
    decision_maker_contact_id?: string;
    sleep_preferences?: string;
    nutrition_preferences?: string;
    family_wishes?: string;
    pet_info?: string;
    spiritual_needs?: string;
    other_wishes?: string;
}

// ─── Palliative Care Types ────────────────────────────────────

export interface PalliativeCare {
    id: string;
    patient_id: string;
    is_active: boolean;
    activated_at?: string;
    activated_by?: string;
    reserve_morphin?: string;
    reserve_midazolam?: string;
    reserve_haloperidol?: string;
    reserve_scopolamin?: string;
    reserve_other?: string;
    palliative_service_name?: string;
    palliative_service_phone?: string;
    palliative_service_email?: string;
    goals_of_care?: string;
    notes?: string;
    updated_at: string;
}

export interface PalliativeUpsert {
    is_active?: boolean;
    reserve_morphin?: string;
    reserve_midazolam?: string;
    reserve_haloperidol?: string;
    reserve_scopolamin?: string;
    reserve_other?: string;
    palliative_service_name?: string;
    palliative_service_phone?: string;
    palliative_service_email?: string;
    goals_of_care?: string;
    notes?: string;
}

// ─── Death Notification Types ─────────────────────────────────

export interface DeathNotification {
    id: string;
    patient_id: string;
    contact_name: string;
    contact_phone?: string;
    contact_email?: string;
    contact_role?: string;
    emergency_contact_id?: string;
    priority: number;
    instructions?: string;
    created_at: string;
}

export interface DeathNotificationCreate {
    patient_id: string;
    contact_name: string;
    contact_phone?: string;
    contact_email?: string;
    contact_role?: string;
    emergency_contact_id?: string;
    priority?: number;
    instructions?: string;
}

export interface DeathNotificationUpdate {
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    contact_role?: string;
    priority?: number;
    instructions?: string;
}
