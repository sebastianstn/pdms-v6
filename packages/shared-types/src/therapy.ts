/**
 * Shared types für Phase 3c — Therapieplan, Konsilien, Arztbriefe,
 * Pflegediagnosen, Schichtübergabe, Ernährung, Verbrauchsmaterial, Dossier.
 */

// ─── Therapieplan ─────────────────────────────────────────────

export type TreatmentPlanStatus = "active" | "completed" | "suspended" | "cancelled";
export type TreatmentPlanPriority = "low" | "normal" | "high" | "urgent";
export type TreatmentPlanItemType = "medication" | "lab" | "procedure" | "monitoring" | "therapy" | "other";

export interface TreatmentPlanItem {
  id: string;
  treatment_plan_id: string;
  item_type: TreatmentPlanItemType;
  description: string;
  frequency?: string;
  target_value?: string;
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  sort_order: number;
}

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  encounter_id?: string;
  title: string;
  diagnosis: string;
  icd_code?: string;
  goals: string;
  interventions: string;
  start_date: string;
  target_end_date?: string;
  status: TreatmentPlanStatus;
  priority: TreatmentPlanPriority;
  items: TreatmentPlanItem[];
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface TreatmentPlanCreate {
  patient_id: string;
  encounter_id?: string;
  title: string;
  diagnosis: string;
  icd_code?: string;
  goals: string;
  interventions: string;
  start_date: string;
  target_end_date?: string;
  priority?: TreatmentPlanPriority;
  items?: { item_type: TreatmentPlanItemType; description: string; frequency?: string; target_value?: string }[];
}

export interface TreatmentPlanUpdate {
  title?: string;
  diagnosis?: string;
  icd_code?: string;
  goals?: string;
  interventions?: string;
  status?: TreatmentPlanStatus;
  priority?: TreatmentPlanPriority;
  target_end_date?: string;
}

export interface PaginatedTreatmentPlans {
  items: TreatmentPlan[];
  total: number;
  page: number;
  per_page: number;
}

// ─── Konsilien ────────────────────────────────────────────────

export type ConsultationSpecialty =
  | "kardiologie" | "pneumologie" | "neurologie" | "gastroenterologie"
  | "nephrologie" | "endokrinologie" | "diabetologie" | "infektiologie"
  | "haematologie" | "onkologie" | "rheumatologie" | "dermatologie"
  | "radiologie" | "chirurgie" | "urologie" | "gynaekologie"
  | "psychiatrie" | "palliativmedizin" | "other";

export type ConsultationStatus = "requested" | "scheduled" | "completed" | "cancelled";
export type ConsultationUrgency = "routine" | "urgent" | "emergency";

export interface Consultation {
  id: string;
  patient_id: string;
  encounter_id?: string;
  specialty: ConsultationSpecialty;
  urgency: ConsultationUrgency;
  status: ConsultationStatus;
  question: string;
  clinical_context?: string;
  response?: string;
  responded_by?: string;
  responded_at?: string;
  requested_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface ConsultationCreate {
  patient_id: string;
  encounter_id?: string;
  specialty: ConsultationSpecialty;
  urgency?: ConsultationUrgency;
  question: string;
  clinical_context?: string;
}

export interface ConsultationUpdate {
  urgency?: ConsultationUrgency;
  question?: string;
  clinical_context?: string;
}

export interface PaginatedConsultations {
  items: Consultation[];
  total: number;
  page: number;
  per_page: number;
}

// ─── Arztbriefe ───────────────────────────────────────────────

export type MedicalLetterType = "discharge" | "referral" | "progress" | "transfer";
export type MedicalLetterStatus = "draft" | "final" | "sent";

export interface MedicalLetter {
  id: string;
  patient_id: string;
  encounter_id?: string;
  letter_type: MedicalLetterType;
  title: string;
  diagnosis?: string;
  anamnesis?: string;
  findings?: string;
  therapy?: string;
  recommendations?: string;
  status: MedicalLetterStatus;
  author_id?: string;
  co_signed_by?: string;
  co_signed_at?: string;
  sent_at?: string;
  sent_to?: string;
  created_at: string;
  updated_at?: string;
}

export interface MedicalLetterCreate {
  patient_id: string;
  encounter_id?: string;
  letter_type: MedicalLetterType;
  title: string;
  diagnosis?: string;
  anamnesis?: string;
  findings?: string;
  therapy?: string;
  recommendations?: string;
}

export interface MedicalLetterUpdate {
  title?: string;
  diagnosis?: string;
  anamnesis?: string;
  findings?: string;
  therapy?: string;
  recommendations?: string;
}

export interface PaginatedMedicalLetters {
  items: MedicalLetter[];
  total: number;
  page: number;
  per_page: number;
}

// ─── Pflegediagnosen ─────────────────────────────────────────

export type NursingDiagnosisStatus = "active" | "resolved" | "inactive";
export type NursingDiagnosisPriority = "low" | "normal" | "high";

export interface NursingDiagnosis {
  id: string;
  patient_id: string;
  encounter_id?: string;
  nanda_code?: string;
  title: string;
  domain?: string;
  defining_characteristics?: string;
  related_factors?: string;
  goals: string;
  interventions: string;
  evaluation?: string;
  status: NursingDiagnosisStatus;
  priority: NursingDiagnosisPriority;
  resolved_at?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface NursingDiagnosisCreate {
  patient_id: string;
  encounter_id?: string;
  nanda_code?: string;
  title: string;
  domain?: string;
  defining_characteristics?: string;
  related_factors?: string;
  goals: string;
  interventions: string;
  priority?: NursingDiagnosisPriority;
}

export interface NursingDiagnosisUpdate {
  title?: string;
  goals?: string;
  interventions?: string;
  evaluation?: string;
  status?: NursingDiagnosisStatus;
  priority?: NursingDiagnosisPriority;
}

export interface PaginatedNursingDiagnoses {
  items: NursingDiagnosis[];
  total: number;
  page: number;
  per_page: number;
}

// ─── Schichtübergabe ────────────────────────────────────────

export type ShiftType = "early" | "late" | "night";

export interface ShiftHandover {
  id: string;
  patient_id: string;
  encounter_id?: string;
  shift_type: ShiftType;
  handover_date: string;
  situation: string;
  background?: string;
  assessment?: string;
  recommendation?: string;
  open_tasks?: Record<string, unknown>[];
  handed_over_by?: string;
  received_by?: string;
  acknowledged_at?: string;
  created_at: string;
  updated_at?: string;
}

export interface ShiftHandoverCreate {
  patient_id: string;
  encounter_id?: string;
  shift_type: ShiftType;
  handover_date: string;
  situation: string;
  background?: string;
  assessment?: string;
  recommendation?: string;
  open_tasks?: Record<string, unknown>[];
}

export interface PaginatedShiftHandovers {
  items: ShiftHandover[];
  total: number;
  page: number;
  per_page: number;
}

// ─── Ernährung ──────────────────────────────────────────────

export type DietType = "normal" | "light" | "diabetic" | "renal" | "parenteral" | "enteral" | "npo";
export type ScreeningType = "nrs2002" | "must" | "mna" | "sga";

export interface NutritionOrder {
  id: string;
  patient_id: string;
  encounter_id?: string;
  diet_type: DietType;
  texture?: string;
  caloric_target?: number;
  protein_target?: number;
  fluid_target?: number;
  restrictions?: string;
  supplements?: string;
  start_date: string;
  end_date?: string;
  status: "active" | "completed" | "cancelled";
  ordered_by?: string;
  created_at: string;
  updated_at?: string;
}

export interface NutritionOrderCreate {
  patient_id: string;
  encounter_id?: string;
  diet_type: DietType;
  texture?: string;
  caloric_target?: number;
  protein_target?: number;
  fluid_target?: number;
  restrictions?: string;
  supplements?: string;
  start_date: string;
  end_date?: string;
}

export interface NutritionOrderUpdate {
  diet_type?: DietType;
  texture?: string;
  caloric_target?: number;
  protein_target?: number;
  fluid_target?: number;
  restrictions?: string;
  supplements?: string;
  status?: "active" | "completed" | "cancelled";
  end_date?: string;
}

export interface NutritionScreening {
  id: string;
  patient_id: string;
  encounter_id?: string;
  screening_type: ScreeningType;
  total_score: number;
  risk_level: string;
  items?: Record<string, unknown>;
  notes?: string;
  screened_by?: string;
  created_at: string;
}

export interface NutritionScreeningCreate {
  patient_id: string;
  encounter_id?: string;
  screening_type: ScreeningType;
  total_score: number;
  risk_level: string;
  items?: Record<string, unknown>;
  notes?: string;
}

export interface PaginatedNutritionOrders {
  items: NutritionOrder[];
  total: number;
  page: number;
  per_page: number;
}

export interface PaginatedNutritionScreenings {
  items: NutritionScreening[];
  total: number;
  page: number;
  per_page: number;
}

// ─── Verbrauchsmaterial ──────────────────────────────────────

export type SupplyCategory = "wound_care" | "infusion" | "catheter" | "respiratory" | "other";

export interface SupplyItem {
  id: string;
  name: string;
  article_number?: string;
  category: SupplyCategory;
  unit: string;
  stock_quantity: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface SupplyItemCreate {
  name: string;
  article_number?: string;
  category: SupplyCategory;
  unit: string;
  stock_quantity?: number;
  min_stock?: number;
}

export interface SupplyItemUpdate {
  name?: string;
  article_number?: string;
  category?: SupplyCategory;
  unit?: string;
  stock_quantity?: number;
  min_stock?: number;
  is_active?: boolean;
}

export interface SupplyUsage {
  id: string;
  patient_id: string;
  supply_item_id: string;
  encounter_id?: string;
  quantity: number;
  reason?: string;
  used_by?: string;
  created_at: string;
}

export interface SupplyUsageCreate {
  patient_id: string;
  supply_item_id: string;
  encounter_id?: string;
  quantity: number;
  reason?: string;
}

export interface PaginatedSupplyItems {
  items: SupplyItem[];
  total: number;
  page: number;
  per_page: number;
}

export interface PaginatedSupplyUsages {
  items: SupplyUsage[];
  total: number;
  page: number;
  per_page: number;
}

// ─── Dossier ────────────────────────────────────────────────

export interface DossierSummary {
  active_alarms: number;
  active_medications: number;
  active_treatment_plans: number;
  active_nursing_diagnoses: number;
  open_consultations: number;
  draft_letters: number;
}

export interface DossierOverview {
  patient_id: string;
  encounter?: Record<string, unknown>;
  summary: DossierSummary;
  latest_vitals?: Record<string, unknown>;
  latest_handover?: Record<string, unknown>;
  active_nutrition?: Record<string, unknown>;
  recent_notes: Record<string, unknown>[];
  recent_nursing: Record<string, unknown>[];
}

// ─── Labels ─────────────────────────────────────────────────

export const TREATMENT_PLAN_STATUS_LABELS: Record<TreatmentPlanStatus, string> = {
  active: "Aktiv",
  completed: "Abgeschlossen",
  suspended: "Pausiert",
  cancelled: "Abgebrochen",
};

export const TREATMENT_PLAN_PRIORITY_LABELS: Record<TreatmentPlanPriority, string> = {
  low: "Niedrig",
  normal: "Normal",
  high: "Hoch",
  urgent: "Dringend",
};

export const CONSULTATION_SPECIALTY_LABELS: Record<ConsultationSpecialty, string> = {
  kardiologie: "Kardiologie",
  pneumologie: "Pneumologie",
  neurologie: "Neurologie",
  gastroenterologie: "Gastroenterologie",
  nephrologie: "Nephrologie",
  endokrinologie: "Endokrinologie",
  diabetologie: "Diabetologie",
  infektiologie: "Infektiologie",
  haematologie: "Hämatologie",
  onkologie: "Onkologie",
  rheumatologie: "Rheumatologie",
  dermatologie: "Dermatologie",
  radiologie: "Radiologie",
  chirurgie: "Chirurgie",
  urologie: "Urologie",
  gynaekologie: "Gynäkologie",
  psychiatrie: "Psychiatrie",
  palliativmedizin: "Palliativmedizin",
  other: "Andere",
};

export const CONSULTATION_STATUS_LABELS: Record<ConsultationStatus, string> = {
  requested: "Angefragt",
  scheduled: "Geplant",
  completed: "Erledigt",
  cancelled: "Abgesagt",
};

export const LETTER_TYPE_LABELS: Record<MedicalLetterType, string> = {
  discharge: "Austrittsbericht",
  referral: "Überweisungsbericht",
  progress: "Zwischenbericht",
  transfer: "Verlegungsbericht",
};

export const LETTER_STATUS_LABELS: Record<MedicalLetterStatus, string> = {
  draft: "Entwurf",
  final: "Finalisiert",
  sent: "Gesendet",
};

export const DIET_TYPE_LABELS: Record<DietType, string> = {
  normal: "Normalkost",
  light: "Leichte Kost",
  diabetic: "Diabetiker-Diät",
  renal: "Nierendiät",
  parenteral: "Parenteral",
  enteral: "Enteral",
  npo: "Nüchtern (NPO)",
};

export const SHIFT_TYPE_LABELS: Record<ShiftType, string> = {
  early: "Frühschicht",
  late: "Spätschicht",
  night: "Nachtschicht",
};

export const SUPPLY_CATEGORY_LABELS: Record<SupplyCategory, string> = {
  wound_care: "Wundversorgung",
  infusion: "Infusion",
  catheter: "Katheter",
  respiratory: "Atemwege",
  other: "Andere",
};


// ─── Medizinische Diagnosen (ICD-10) ──────────────────────────

export type DiagnosisType = "haupt" | "neben" | "verdacht";
export type DiagnosisStatus = "active" | "resolved" | "ruled_out" | "recurrence";
export type DiagnosisSeverity = "leicht" | "mittel" | "schwer";
export type DiagnosisLaterality = "links" | "rechts" | "beidseits";

export interface Diagnosis {
  id: string;
  patient_id: string;
  encounter_id?: string;
  icd_code?: string;
  title: string;
  description?: string;
  diagnosis_type: DiagnosisType;
  severity?: DiagnosisSeverity;
  body_site?: string;
  laterality?: DiagnosisLaterality;
  status: DiagnosisStatus;
  onset_date?: string;
  resolved_date?: string;
  diagnosed_by?: string;
  diagnosed_at: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

export interface DiagnosisCreate {
  patient_id: string;
  encounter_id?: string;
  icd_code?: string;
  title: string;
  description?: string;
  diagnosis_type?: DiagnosisType;
  severity?: DiagnosisSeverity;
  body_site?: string;
  laterality?: DiagnosisLaterality;
  onset_date?: string;
  notes?: string;
}

export interface DiagnosisUpdate {
  icd_code?: string;
  title?: string;
  description?: string;
  diagnosis_type?: DiagnosisType;
  severity?: DiagnosisSeverity;
  body_site?: string;
  laterality?: DiagnosisLaterality;
  status?: DiagnosisStatus;
  onset_date?: string;
  resolved_date?: string;
  notes?: string;
}

export interface PaginatedDiagnoses {
  items: Diagnosis[];
  total: number;
  page: number;
  per_page: number;
}

export const DIAGNOSIS_TYPE_LABELS: Record<DiagnosisType, string> = {
  haupt: "Hauptdiagnose",
  neben: "Nebendiagnose",
  verdacht: "Verdachtsdiagnose",
};

export const DIAGNOSIS_STATUS_LABELS: Record<DiagnosisStatus, string> = {
  active: "Aktiv",
  resolved: "Behoben",
  ruled_out: "Ausgeschlossen",
  recurrence: "Rezidiv",
};

export const DIAGNOSIS_SEVERITY_LABELS: Record<DiagnosisSeverity, string> = {
  leicht: "Leicht",
  mittel: "Mittel",
  schwer: "Schwer",
};
