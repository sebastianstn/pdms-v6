/**
 * Self-medication hooks — CRUD, confirm/miss/skip (Patient-App concept).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    SelfMedicationLog,
    SelfMedicationLogCreate,
    SelfMedicationMeta,
} from "@pdms/shared-types";

const keys = {
    all: ["self-medication"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    meta: () => [...keys.all, "meta"] as const,
};

export function useSelfMedicationLogs(patientId: string, status?: string) {
    return useQuery<SelfMedicationLog[]>({
        queryKey: [...keys.list(patientId), status],
        queryFn: () => {
            const qs = status ? `?status=${status}` : "";
            return api.get<SelfMedicationLog[]>(
                `/patients/${patientId}/self-medication${qs}`,
            );
        },
        enabled: !!patientId,
    });
}

export function useSelfMedicationMeta() {
    return useQuery<SelfMedicationMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<SelfMedicationMeta>("/self-medication/meta"),
        staleTime: Infinity,
    });
}

export function useCreateSelfMedicationLog() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: SelfMedicationLogCreate) =>
            api.post<SelfMedicationLog>("/self-medication", data),
        onSuccess: (log) => {
            qc.invalidateQueries({ queryKey: keys.list(log.patient_id) });
        },
    });
}

export function useConfirmMedication(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (logId: string) =>
            api.post<SelfMedicationLog>(`/self-medication/${logId}/confirm`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useMissMedication(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (logId: string) =>
            api.post<SelfMedicationLog>(`/self-medication/${logId}/miss`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useSkipMedication(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (logId: string) =>
            api.post<SelfMedicationLog>(`/self-medication/${logId}/skip`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}
