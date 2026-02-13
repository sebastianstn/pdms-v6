/** Documentation types — Klinische Notizen, Pflege-Einträge, Assessments. */

// ─── Clinical Note Types ──────────────────────────────────────

export type NoteType =
    | "progress_note"
    | "admission_note"
    | "discharge_summary"
    | "consultation"
    | "procedure_note"
    | "handoff";

export type NoteStatus = "draft" | "final" | "amended" | "entered_in_error";

export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
    progress_note: "Verlaufsnotiz",
    admission_note: "Aufnahmebericht",
    discharge_summary: "Entlassbericht",
    consultation: "Konsilbericht",
    procedure_note: "Interventionsbericht",
    handoff: "Dienstübergabe",
};

export const NOTE_STATUS_LABELS: Record<NoteStatus, string> = {
    draft: "Entwurf",
    final: "Finalisiert",
    amended: "Nachtrag",
    entered_in_error: "Fehleingabe",
};

export interface ClinicalNote {
    id: string;
    patient_id: string;
    encounter_id?: string;
    note_type: NoteType;
    title: string;
    content: string;
    summary?: string;
    author_id?: string;
    co_signed_by?: string;
    co_signed_at?: string;
    status: NoteStatus;
    is_confidential: boolean;
    tags?: string[];
    created_at: string;
    updated_at: string;
}

export interface ClinicalNoteCreate {
    patient_id: string;
    encounter_id?: string;
    note_type: NoteType;
    title: string;
    content: string;
    summary?: string;
    is_confidential?: boolean;
    tags?: string[];
}

export interface ClinicalNoteUpdate {
    title?: string;
    content?: string;
    summary?: string;
    note_type?: NoteType;
    status?: NoteStatus;
    is_confidential?: boolean;
    tags?: string[];
}

// ─── Nursing Entry Types ──────────────────────────────────────

export type NursingCategory =
    | "pflege"
    | "beobachtung"
    | "intervention"
    | "beratung"
    | "wundversorgung"
    | "medikation"
    | "mobilisation"
    | "ernaehrung"
    | "ausscheidung"
    | "schmerz"
    | "sonstiges";

export interface NursingEntry {
    id: string;
    patient_id: string;
    encounter_id?: string;
    category: NursingCategory;
    title: string;
    content: string;
    priority: string;
    recorded_at: string;
    recorded_by?: string;
    is_handover: boolean;
    created_at: string;
    updated_at: string;
}

// ─── Assessment Types ─────────────────────────────────────────

export type AssessmentType = "barthel" | "norton" | "braden" | "morse";

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
    barthel: "Barthel-Index (ADL)",
    norton: "Norton-Skala (Dekubitus)",
    braden: "Braden-Skala (Dekubitus)",
    morse: "Morse Fall Scale (Sturzrisiko)",
};

export interface NursingAssessment {
    id: string;
    patient_id: string;
    encounter_id?: string;
    assessment_type: AssessmentType;
    total_score: number;
    max_score?: number;
    risk_level?: string;
    items: Record<string, number>;
    notes?: string;
    assessed_at: string;
    assessed_by?: string;
    created_at: string;
}
