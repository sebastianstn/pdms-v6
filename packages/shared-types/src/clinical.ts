/** Clinical data types. */

export interface VitalSign {
  id: string;
  patient_id: string;
  encounter_id?: string;
  recorded_at: string;
  recorded_by?: string;
  source: "manual" | "device" | "hl7";
  heart_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  spo2?: number;
  temperature?: number;
  respiratory_rate?: number;
  gcs?: number;
  pain_score?: number;
}

export interface Encounter {
  id: string;
  patient_id: string;
  status: "planned" | "active" | "finished" | "cancelled";
  encounter_type: "hospitalization" | "home-care" | "ambulatory";
  ward?: string;
  bed?: string;
  admitted_at: string;
  discharged_at?: string;
  reason?: string;
  attending_physician_id?: string;
}

export type EncounterType = Encounter["encounter_type"];
export type EncounterStatus = Encounter["status"];

export interface EncounterCreate {
  patient_id: string;
  encounter_type: EncounterType;
  ward?: string;
  bed?: string;
  reason?: string;
  attending_physician_id?: string;
}

export interface EncounterUpdate {
  encounter_type?: EncounterType;
  ward?: string;
  bed?: string;
  reason?: string;
  attending_physician_id?: string;
}

export interface PaginatedEncounters {
  items: Encounter[];
  total: number;
  page: number;
  per_page: number;
}

export interface Alarm {
  id: string;
  patient_id: string;
  vital_sign_id?: string;
  parameter: string;
  value: number;
  threshold_min?: number;
  threshold_max?: number;
  severity: "info" | "warning" | "critical";
  status: "active" | "acknowledged" | "resolved";
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

export interface AlarmCounts {
  warning: number;
  critical: number;
  total: number;
}

// ─── Medication Types ─────────────────────────────────────────

export type MedicationStatus = "active" | "paused" | "discontinued" | "completed";

export type MedicationRoute =
  | "oral"
  | "iv"
  | "sc"
  | "im"
  | "topisch"
  | "inhalativ"
  | "rektal"
  | "sublingual";

export type AdministrationStatus = "completed" | "refused" | "held" | "not-given";

export interface Medication {
  id: string;
  patient_id: string;
  encounter_id?: string;
  name: string;
  generic_name?: string;
  atc_code?: string;
  dose: string;
  dose_unit: string;
  route: MedicationRoute;
  frequency: string;
  start_date: string;
  end_date?: string;
  status: MedicationStatus;
  reason?: string;
  notes?: string;
  prescribed_by?: string;
  is_prn: boolean;
  created_at: string;
  updated_at: string;
}

export interface MedicationCreate {
  patient_id: string;
  encounter_id?: string;
  name: string;
  generic_name?: string;
  atc_code?: string;
  dose: string;
  dose_unit: string;
  route?: MedicationRoute;
  frequency: string;
  start_date: string;
  end_date?: string;
  reason?: string;
  notes?: string;
  is_prn?: boolean;
}

export interface MedicationUpdate {
  dose?: string;
  dose_unit?: string;
  route?: MedicationRoute;
  frequency?: string;
  end_date?: string;
  status?: MedicationStatus;
  notes?: string;
}

export interface MedicationAdministration {
  id: string;
  medication_id: string;
  patient_id: string;
  administered_at: string;
  administered_by?: string;
  dose_given: string;
  dose_unit: string;
  route: string;
  status: AdministrationStatus;
  reason_not_given?: string;
  notes?: string;
  created_at: string;
}

export interface AdministrationCreate {
  medication_id: string;
  patient_id: string;
  dose_given: string;
  dose_unit: string;
  route: string;
  status: AdministrationStatus;
  reason_not_given?: string;
  notes?: string;
}

export interface PaginatedMedications {
  items: Medication[];
  total: number;
  page: number;
  per_page: number;
}

// ─── Nursing Types ────────────────────────────────────────────

export type EntryCategory =
  | "observation"
  | "intervention"
  | "assessment"
  | "handover"
  | "wound_care"
  | "mobility"
  | "nutrition"
  | "elimination"
  | "communication";

export type EntryPriority = "low" | "normal" | "high" | "urgent";

export type AssessmentType = "barthel" | "norton" | "braden" | "pain" | "fall_risk" | "nutrition";

export type RiskLevel = "low" | "medium" | "high" | "very_high";

export interface NursingEntry {
  id: string;
  patient_id: string;
  encounter_id?: string;
  category: EntryCategory;
  title: string;
  content: string;
  priority: EntryPriority;
  recorded_at: string;
  recorded_by?: string;
  is_handover: boolean;
  created_at: string;
  updated_at: string;
}

export interface NursingEntryCreate {
  patient_id: string;
  encounter_id?: string;
  category: EntryCategory;
  title: string;
  content: string;
  priority?: EntryPriority;
  is_handover?: boolean;
}

export interface NursingEntryUpdate {
  title?: string;
  content?: string;
  priority?: EntryPriority;
  category?: EntryCategory;
  is_handover?: boolean;
}

export interface NursingAssessment {
  id: string;
  patient_id: string;
  encounter_id?: string;
  assessment_type: AssessmentType;
  total_score: number;
  max_score?: number;
  risk_level?: RiskLevel;
  items: Record<string, number>;
  notes?: string;
  assessed_at: string;
  assessed_by?: string;
  created_at: string;
}

export interface AssessmentCreate {
  patient_id: string;
  encounter_id?: string;
  assessment_type: AssessmentType;
  total_score: number;
  max_score?: number;
  risk_level?: RiskLevel;
  items: Record<string, number>;
  notes?: string;
}

export interface PaginatedNursingEntries {
  items: NursingEntry[];
  total: number;
  page: number;
  per_page: number;
}

export interface PaginatedAssessments {
  items: NursingAssessment[];
  total: number;
  page: number;
  per_page: number;
}

// ─── Clinical Note Types ──────────────────────────────────────

export type NoteType =
  | "progress_note"
  | "admission_note"
  | "discharge_summary"
  | "consultation"
  | "procedure_note"
  | "handoff";

export type NoteStatus = "draft" | "final" | "amended" | "entered_in_error";

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

export interface PaginatedClinicalNotes {
  items: ClinicalNote[];
  total: number;
  page: number;
  per_page: number;
}
