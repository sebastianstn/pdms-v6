/**
 * Insurance hooks — CRUD for patient insurance records.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    Insurance,
    InsuranceCreate,
    InsuranceUpdate,
    InsuranceMeta,
} from "@pdms/shared-types";

const keys = {
    all: ["insurances"] as const,
    list: (pid: string) => [...keys.all, "list", pid] as const,
    meta: () => [...keys.all, "meta"] as const,
};

export function useInsurances(patientId: string) {
    return useQuery<Insurance[]>({
        queryKey: keys.list(patientId),
        queryFn: () =>
            api.get<Insurance[]>(`/patients/${patientId}/insurances`),
        enabled: !!patientId,
    });
}

export function useInsuranceMeta() {
    return useQuery<InsuranceMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<InsuranceMeta>("/insurance/meta"),
        staleTime: Infinity,
    });
}

export function useCreateInsurance() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: InsuranceCreate) =>
            api.post<Insurance>("/insurances", data),
        onSuccess: (ins) => {
            qc.invalidateQueries({ queryKey: keys.list(ins.patient_id) });
        },
    });
}

export function useUpdateInsurance(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: InsuranceUpdate }) =>
            api.patch<Insurance>(`/insurances/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useDeleteInsurance(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/insurances/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}
