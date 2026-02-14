/**
 * Diagnose hooks — CRUD für medizinische Diagnosen (ICD-10).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    Diagnosis,
    DiagnosisCreate,
    DiagnosisUpdate,
    PaginatedDiagnoses,
    DiagnosisStatus,
    DiagnosisType,
} from "@pdms/shared-types";

// ─── Query Keys ────────────────────────────────────────────────

const keys = {
    all: ["diagnoses"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    detail: (id: string) => [...keys.all, "detail", id] as const,
};

// ─── Read Hooks ────────────────────────────────────────────────

export function useDiagnoses(
    patientId: string,
    opts?: { status?: DiagnosisStatus; diagnosisType?: DiagnosisType; page?: number; perPage?: number },
) {
    const qs = new URLSearchParams();
    if (opts?.status) qs.set("status", opts.status);
    if (opts?.diagnosisType) qs.set("diagnosis_type", opts.diagnosisType);
    if (opts?.page) qs.set("page", String(opts.page));
    if (opts?.perPage) qs.set("per_page", String(opts.perPage));
    const suffix = qs.toString() ? `?${qs}` : "";

    return useQuery<PaginatedDiagnoses>({
        queryKey: [...keys.list(patientId), opts],
        queryFn: () =>
            api.get<PaginatedDiagnoses>(`/patients/${patientId}/diagnoses${suffix}`),
        enabled: !!patientId,
    });
}

export function useDiagnosis(diagnosisId: string) {
    return useQuery<Diagnosis>({
        queryKey: keys.detail(diagnosisId),
        queryFn: () => api.get<Diagnosis>(`/diagnoses/${diagnosisId}`),
        enabled: !!diagnosisId,
    });
}

// ─── Mutation Hooks ────────────────────────────────────────────

export function useCreateDiagnosis() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: DiagnosisCreate) =>
            api.post<Diagnosis>("/diagnoses", data),
        onSuccess: (diagnosis) => {
            qc.invalidateQueries({ queryKey: keys.list(diagnosis.patient_id) });
        },
    });
}

export function useUpdateDiagnosis(diagnosisId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: DiagnosisUpdate) =>
            api.patch<Diagnosis>(`/diagnoses/${diagnosisId}`, data),
        onSuccess: (diagnosis) => {
            qc.invalidateQueries({ queryKey: keys.list(diagnosis.patient_id) });
            qc.setQueryData(keys.detail(diagnosisId), diagnosis);
        },
    });
}

export function useDeleteDiagnosis() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (diagnosisId: string) =>
            api.delete(`/diagnoses/${diagnosisId}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.all });
        },
    });
}
