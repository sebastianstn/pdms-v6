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
  language: string;
  status: "active" | "discharged" | "deceased";
  created_at: string;
  updated_at: string;
}

export interface Insurance {
  id: string;
  patient_id: string;
  insurer_name: string;
  policy_number: string;
  insurance_type: "grundversicherung" | "zusatz" | "unfall" | "iv";
  valid_from?: string;
  valid_until?: string;
}

export interface EmergencyContact {
  id: string;
  patient_id: string;
  name: string;
  relationship_type: string;
  phone: string;
  is_primary: boolean;
}
