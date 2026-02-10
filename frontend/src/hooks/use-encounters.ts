/**
 * Encounter hooks — admission, discharge, transfer, CRUD.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────

export type EncounterType = "hospitalization" | "home-care" | "ambulatory";
export type EncounterStatus = "planned" | "active" | "finished" | "cancelled";

export interface Encounter {
    id: string;
    patient_id: string;
    status: EncounterStatus;
    encounter_type: EncounterType;
    ward?: string;
    bed?: string;
    admitted_at: string;
    discharged_at?: string;
    reason?: string;
    attending_physician_id?: string;
}

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

interface PaginatedEncounters {
    items: Encounter[];
    total: number;
    page: number;
    per_page: number;
}

interface EncounterMeta {
    encounter_types: Record<string, string>;
    encounter_statuses: Record<string, string>;
}

// ─── Labels (offline fallback) ────────────────────────────────

export const ENCOUNTER_TYPE_LABELS: Record<EncounterType, string> = {
    hospitalization: "Stationär",
    "home-care": "Home-Care / Spitex",
    ambulatory: "Ambulant",
};

export const ENCOUNTER_STATUS_LABELS: Record<EncounterStatus, string> = {
    planned: "Geplant",
    active: "Aktiv",
    finished: "Abgeschlossen",
    cancelled: "Abgebrochen",
};

// ─── Query Keys ───────────────────────────────────────────────

const keys = {
    all: ["encounters"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    detail: (encounterId: string) => [...keys.all, "detail", encounterId] as const,
    active: (patientId: string) => [...keys.all, "active", patientId] as const,
    meta: () => [...keys.all, "meta"] as const,
};

// ─── Read Hooks ───────────────────────────────────────────────

export function useEncounters(
    patientId: string,
    params?: { status?: EncounterStatus; page?: number; per_page?: number },
) {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.page) search.set("page", String(params.page));
    if (params?.per_page) search.set("per_page", String(params.per_page));
    const qs = search.toString();

    return useQuery<PaginatedEncounters>({
        queryKey: [...keys.list(patientId), params],
        queryFn: () =>
            api.get<PaginatedEncounters>(
                `/patients/${patientId}/encounters${qs ? `?${qs}` : ""}`,
            ),
        enabled: !!patientId,
    });
}

export function useEncounter(encounterId: string) {
    return useQuery<Encounter>({
        queryKey: keys.detail(encounterId),
        queryFn: () => api.get<Encounter>(`/encounters/${encounterId}`),
        enabled: !!encounterId,
    });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useActiveEncounter(patientId: string) {
    const isValidId = !!patientId && UUID_RE.test(patientId);
    return useQuery<Encounter | null>({
        queryKey: keys.active(patientId),
        queryFn: () => api.get<Encounter | null>(`/patients/${patientId}/encounters/active`),
        enabled: isValidId,
    });
}

export function useEncounterMeta() {
    return useQuery<EncounterMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<EncounterMeta>("/encounters/meta"),
        staleTime: Infinity,
    });
}

// ─── Mutation Hooks ───────────────────────────────────────────

export function useAdmitPatient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: EncounterCreate) =>
            api.post<Encounter>("/encounters/admit", data),
        onSuccess: (enc) => {
            qc.invalidateQueries({ queryKey: keys.list(enc.patient_id) });
            qc.invalidateQueries({ queryKey: keys.active(enc.patient_id) });
        },
    });
}

export function useUpdateEncounter(encounterId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: EncounterUpdate) =>
            api.patch<Encounter>(`/encounters/${encounterId}`, data),
        onSuccess: (enc) => {
            qc.invalidateQueries({ queryKey: keys.list(enc.patient_id) });
            qc.invalidateQueries({ queryKey: keys.active(enc.patient_id) });
            qc.setQueryData(keys.detail(encounterId), enc);
        },
    });
}

export function useDischargePatient(encounterId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body?: { discharge_reason?: string }) =>
            api.post<Encounter>(`/encounters/${encounterId}/discharge`, body ?? {}),
        onSuccess: (enc) => {
            qc.invalidateQueries({ queryKey: keys.list(enc.patient_id) });
            qc.invalidateQueries({ queryKey: keys.active(enc.patient_id) });
            qc.setQueryData(keys.detail(encounterId), enc);
        },
    });
}

export function useTransferPatient(encounterId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (body: { ward: string; bed?: string }) =>
            api.post<Encounter>(`/encounters/${encounterId}/transfer`, body),
        onSuccess: (enc) => {
            qc.invalidateQueries({ queryKey: keys.list(enc.patient_id) });
            qc.invalidateQueries({ queryKey: keys.active(enc.patient_id) });
            qc.setQueryData(keys.detail(encounterId), enc);
        },
    });
}

export function useCancelEncounter(encounterId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () =>
            api.post<Encounter>(`/encounters/${encounterId}/cancel`, {}),
        onSuccess: (enc) => {
            qc.invalidateQueries({ queryKey: keys.list(enc.patient_id) });
            qc.invalidateQueries({ queryKey: keys.active(enc.patient_id) });
            qc.setQueryData(keys.detail(encounterId), enc);
        },
    });
}
