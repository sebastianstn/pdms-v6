/** Patient-related types shared between frontend and backend. */

export interface Patient {
  id: string;
  ahv_number?: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: "male" | "female" | "other" | "unknown";
  blood_type?: string;
  phone?: string;
  email?: string;
  address_street?: string;
  address_zip?: string;
  address_city?: string;
  address_canton?: string;
  photo_url?: string;
  language: string;
  status: "active" | "discharged" | "deceased";
  created_at: string;
  updated_at: string;
}

// ─── Insurance Types ──────────────────────────────────────────

export type InsuranceType = "grundversicherung" | "zusatz" | "unfall" | "iv";

export interface Insurance {
  id: string;
  patient_id: string;
  insurer_name: string;
  policy_number: string;
  insurance_type: InsuranceType;
  valid_from?: string;
  valid_until?: string;
  franchise?: number;
  kostengutsprache: boolean;
  kostengutsprache_bis?: string;
  garant?: string;
  bvg_number?: string;
  notes?: string;
}

export interface InsuranceCreate {
  patient_id: string;
  insurer_name: string;
  policy_number: string;
  insurance_type: InsuranceType;
  valid_from?: string;
  valid_until?: string;
  franchise?: number;
  kostengutsprache?: boolean;
  kostengutsprache_bis?: string;
  garant?: string;
  bvg_number?: string;
  notes?: string;
}

export interface InsuranceUpdate {
  insurer_name?: string;
  policy_number?: string;
  insurance_type?: InsuranceType;
  valid_from?: string;
  valid_until?: string;
  franchise?: number;
  kostengutsprache?: boolean;
  kostengutsprache_bis?: string;
  garant?: string;
  bvg_number?: string;
  notes?: string;
}

export interface InsuranceMeta {
  insurance_types: Record<string, string>;
  garant_options: Record<string, string>;
}

export interface InsuranceProviderOption {
  id: string;
  name: string;
  is_active: boolean;
  supports_basic: boolean;
  supports_semi_private: boolean;
  supports_private: boolean;
  logo_text: string;
  logo_color: string;
}

export interface InsuranceCompanyCreate {
  name: string;
  supports_basic?: boolean;
  supports_semi_private?: boolean;
  supports_private?: boolean;
}

export interface InsuranceCompanyUpdate {
  name?: string;
  is_active?: boolean;
  supports_basic?: boolean;
  supports_semi_private?: boolean;
  supports_private?: boolean;
}

// ─── Emergency Contact Types ──────────────────────────────────

export interface EmergencyContact {
  id: string;
  patient_id: string;
  name: string;
  relationship_type: string;
  phone: string;
  is_primary: boolean;
  email?: string;
  address?: string;
  priority: number;
  is_legal_representative: boolean;
  is_key_person: boolean;
  notes?: string;
}

export interface ContactCreate {
  patient_id: string;
  name: string;
  relationship_type: string;
  phone: string;
  is_primary?: boolean;
  email?: string;
  address?: string;
  priority?: number;
  is_legal_representative?: boolean;
  is_key_person?: boolean;
  notes?: string;
}

export interface ContactUpdate {
  name?: string;
  relationship_type?: string;
  phone?: string;
  is_primary?: boolean;
  email?: string;
  address?: string;
  priority?: number;
  is_legal_representative?: boolean;
  is_key_person?: boolean;
  notes?: string;
}

// ─── Medical Provider Types ───────────────────────────────────

export type ProviderType =
  | "hausarzt"
  | "zuweiser"
  | "apotheke"
  | "spitex"
  | "physiotherapie"
  | "spezialist";

export const PROVIDER_TYPE_LABELS: Record<ProviderType, string> = {
  hausarzt: "Hausarzt",
  zuweiser: "Zuweiser",
  apotheke: "Apotheke",
  spitex: "Spitex",
  physiotherapie: "Physiotherapie",
  spezialist: "Spezialist",
};

export interface MedicalProvider {
  id: string;
  patient_id: string;
  provider_type: ProviderType;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  hin_email?: string;
  gln_number?: string;
  address?: string;
  speciality?: string;
  notes?: string;
}

export interface ProviderCreate {
  patient_id: string;
  provider_type: ProviderType;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  hin_email?: string;
  gln_number?: string;
  address?: string;
  speciality?: string;
  notes?: string;
}

export interface ProviderUpdate {
  provider_type?: ProviderType;
  name?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  hin_email?: string;
  gln_number?: string;
  address?: string;
  speciality?: string;
  notes?: string;
}

export interface ProviderMeta {
  provider_types: Record<string, string>;
}

