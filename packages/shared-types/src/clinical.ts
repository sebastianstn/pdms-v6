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
  status: "active" | "finished" | "cancelled";
  encounter_type: "hospitalization" | "home-care" | "ambulatory";
  ward?: string;
  bed?: string;
  admitted_at: string;
  discharged_at?: string;
  reason?: string;
}

export interface Alarm {
  id: string;
  patient_id: string;
  parameter: string;
  value: number;
  severity: "info" | "warning" | "critical";
  status: "active" | "acknowledged" | "resolved";
  triggered_at: string;
  acknowledged_at?: string;
}
