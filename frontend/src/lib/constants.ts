/** App-wide constants */

export const ROLES = {
  ARZT: "arzt",
  PFLEGE: "pflege",
  ADMIN: "admin",
} as const;

export const PATIENT_STATUS = {
  ACTIVE: "active",
  DISCHARGED: "discharged",
  DECEASED: "deceased",
} as const;

export const VITAL_LABELS: Record<string, { label: string; unit: string; color: string }> = {
  heart_rate: { label: "Herzfrequenz", unit: "bpm", color: "#ef4444" },
  systolic_bp: { label: "Systolisch", unit: "mmHg", color: "#f97316" },
  diastolic_bp: { label: "Diastolisch", unit: "mmHg", color: "#eab308" },
  spo2: { label: "SpO₂", unit: "%", color: "#3b82f6" },
  temperature: { label: "Temperatur", unit: "°C", color: "#8b5cf6" },
  respiratory_rate: { label: "Atemfrequenz", unit: "/min", color: "#06b6d4" },
  gcs: { label: "Glasgow Coma Scale", unit: "Pkt", color: "#10b981" },
  pain_score: { label: "Schmerzskala", unit: "/10", color: "#f43f5e" },
};
