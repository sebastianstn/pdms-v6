/**
 * Medication hooks — prescriptions + administration tracking.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Types ────────────────────────────────────────────────────

export interface Medication {
    id: string;
    patient_id: string;
    encounter_id?: string;
    name: string;
    generic_name?: string;
    atc_code?: string;
    dose: string;
    dose_unit: string;
    route: string;
    frequency: string;
    start_date: string;
    end_date?: string;
    status: "active" | "paused" | "discontinued" | "completed";
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
    route?: string;
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
    frequency?: string;
    end_date?: string;
    status?: string;
    reason?: string;
    notes?: string;
    is_prn?: boolean;
}

export interface Administration {
    id: string;
    medication_id: string;
    patient_id: string;
    administered_at: string;
    administered_by?: string;
    dose_given: string;
    dose_unit: string;
    route: string;
    status: "completed" | "refused" | "held" | "not-given";
    reason_not_given?: string;
    notes?: string;
}

export interface AdministrationCreate {
    medication_id: string;
    patient_id: string;
    dose_given: string;
    dose_unit: string;
    route?: string;
    status?: string;
    reason_not_given?: string;
    notes?: string;
}

interface PaginatedMedications {
    items: Medication[];
    total: number;
    page: number;
    per_page: number;
}

// ─── Medication Hooks ─────────────────────────────────────────

/**
 * Medikamente eines Patienten abfragen.
 */
export function useMedications(patientId: string, status?: string) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);

    return useQuery<PaginatedMedications>({
        queryKey: ["medications", patientId, status],
        queryFn: () => api.get(`/patients/${patientId}/medications?${params.toString()}`),
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

/**
 * Einzelnes Medikament abrufen.
 */
export function useMedication(medicationId: string) {
    return useQuery<Medication>({
        queryKey: ["medication", medicationId],
        queryFn: () => api.get(`/medications/${medicationId}`),
        enabled: !!medicationId,
    });
}

/**
 * Neues Medikament verordnen.
 */
export function useCreateMedication() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: MedicationCreate) => api.post<Medication>("/medications", data),
        onSuccess: (_, variables) => {
            qc.invalidateQueries({ queryKey: ["medications", variables.patient_id] });
        },
    });
}

/**
 * Medikament aktualisieren.
 */
export function useUpdateMedication(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: MedicationUpdate }) =>
            api.patch<Medication>(`/medications/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["medications", patientId] });
        },
    });
}

/**
 * Medikament absetzen (discontinue).
 */
export function useDiscontinueMedication(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            api.patch<Medication>(`/medications/${id}/discontinue${reason ? `?reason=${encodeURIComponent(reason)}` : ""}`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["medications", patientId] });
        },
    });
}

// ─── Administration Hooks ─────────────────────────────────────

/**
 * Verabreichung dokumentieren.
 */
export function useRecordAdministration(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: AdministrationCreate) =>
            api.post<Administration>(`/medications/${data.medication_id}/administrations`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["medications", patientId] });
            qc.invalidateQueries({ queryKey: ["administrations"] });
        },
    });
}

/**
 * Verabreichungshistorie eines Medikaments abrufen.
 */
export function useAdministrations(medicationId: string) {
    return useQuery<Administration[]>({
        queryKey: ["administrations", medicationId],
        queryFn: () => api.get(`/medications/${medicationId}/administrations`),
        enabled: !!medicationId,
    });
}