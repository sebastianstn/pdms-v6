/** Laboratory data types. */

// ─── Analyte Types ─────────────────────────────────────────────

export type LabAnalyte =
  | "crp" | "leukocytes" | "hemoglobin" | "thrombocytes"
  | "creatinine" | "egfr" | "urea"
  | "sodium" | "potassium" | "glucose" | "lactate"
  | "procalcitonin" | "bilirubin" | "alt" | "ast" | "albumin"
  | "inr" | "d_dimer"
  | "ph" | "pco2" | "po2"
  | "hba1c";

export type LabCategory = "chemistry" | "hematology" | "coagulation" | "blood_gas" | "urinalysis";

export type LabFlag = "H" | "L" | "HH" | "LL";
export type LabInterpretation = "normal" | "borderline" | "pathological" | "critical";
export type LabTrend = "↑" | "↓" | "→" | "↑↑" | "↓↓";

// ─── Labels ────────────────────────────────────────────────────

export const LAB_ANALYTE_LABELS: Record<string, string> = {
  crp: "CRP",
  leukocytes: "Leukozyten",
  hemoglobin: "Hämoglobin",
  thrombocytes: "Thrombozyten",
  creatinine: "Kreatinin",
  egfr: "eGFR",
  urea: "Harnstoff",
  sodium: "Natrium",
  potassium: "Kalium",
  glucose: "Glukose",
  lactate: "Laktat",
  procalcitonin: "Prokalzitonin",
  bilirubin: "Bilirubin (total)",
  alt: "ALT (GPT)",
  ast: "AST (GOT)",
  albumin: "Albumin",
  inr: "INR",
  d_dimer: "D-Dimer",
  ph: "pH (arteriell)",
  pco2: "pCO₂",
  po2: "pO₂",
  hba1c: "HbA1c",
};

export const LAB_CATEGORY_LABELS: Record<LabCategory, string> = {
  chemistry: "Klinische Chemie",
  hematology: "Hämatologie",
  coagulation: "Gerinnung",
  blood_gas: "Blutgasanalyse",
  urinalysis: "Urinanalyse",
};

export const LAB_FLAG_LABELS: Record<LabFlag, string> = {
  H: "Hoch",
  L: "Tief",
  HH: "Kritisch hoch",
  LL: "Kritisch tief",
};

export const LAB_INTERPRETATION_LABELS: Record<LabInterpretation, string> = {
  normal: "Normal",
  borderline: "Grenzwertig",
  pathological: "Pathologisch",
  critical: "Kritisch",
};

// ─── Interfaces ────────────────────────────────────────────────

export interface LabResult {
  id: string;
  patient_id: string;
  encounter_id?: string;
  analyte: string;
  loinc_code?: string;
  display_name: string;
  value: number;
  unit: string;
  ref_min?: number;
  ref_max?: number;
  flag?: LabFlag;
  interpretation?: LabInterpretation;
  trend?: string;
  previous_value?: number;
  category: LabCategory;
  sample_type?: string;
  collected_at?: string;
  resulted_at: string;
  ordered_by?: string;
  validated_by?: string;
  order_number?: string;
  notes?: string;
  created_at: string;
}

export interface LabResultCreate {
  patient_id: string;
  encounter_id?: string;
  analyte: string;
  loinc_code?: string;
  display_name?: string;
  value: number;
  unit?: string;
  ref_min?: number;
  ref_max?: number;
  flag?: LabFlag;
  category?: LabCategory;
  sample_type?: string;
  collected_at?: string;
  order_number?: string;
  notes?: string;
}

export interface LabResultBatchCreate {
  patient_id: string;
  encounter_id?: string;
  order_number?: string;
  collected_at?: string;
  sample_type?: string;
  results: LabResultCreate[];
}

export interface LabResultUpdate {
  value?: number;
  flag?: LabFlag;
  notes?: string;
  validated_by?: string;
}

export interface LabTrendPoint {
  value: number;
  resulted_at: string;
  flag?: LabFlag;
  interpretation?: LabInterpretation;
}

export interface LabTrendResponse {
  analyte: string;
  display_name: string;
  unit: string;
  ref_min?: number;
  ref_max?: number;
  points: LabTrendPoint[];
}

export interface LabSummaryItem {
  analyte: string;
  display_name: string;
  value: number;
  unit: string;
  ref_min?: number;
  ref_max?: number;
  flag?: LabFlag;
  interpretation?: LabInterpretation;
  trend?: string;
  resulted_at: string;
}

export interface LabMeta {
  analytes: Record<string, {
    display: string;
    loinc: string;
    unit: string;
    ref_min: number | null;
    ref_max: number | null;
    category: LabCategory;
  }>;
  analyte_labels: Record<string, string>;
  category_labels: Record<string, string>;
  flag_labels: Record<string, string>;
  interpretation_labels: Record<string, string>;
}
