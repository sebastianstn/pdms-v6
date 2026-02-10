/**
 * Medical provider hooks — CRUD for treating physicians, pharmacies, Spitex etc.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    MedicalProvider,
    ProviderCreate,
    ProviderUpdate,
    ProviderMeta,
} from "@pdms/shared-types";

const keys = {
    all: ["providers"] as const,
    list: (pid: string) => [...keys.all, "list", pid] as const,
    meta: () => [...keys.all, "meta"] as const,
};

export function useProviders(patientId: string) {
    return useQuery<MedicalProvider[]>({
        queryKey: keys.list(patientId),
        queryFn: () =>
            api.get<MedicalProvider[]>(`/patients/${patientId}/providers`),
        enabled: !!patientId,
    });
}

export function useProviderMeta() {
    return useQuery<ProviderMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<ProviderMeta>("/providers/meta"),
        staleTime: Infinity,
    });
}

export function useCreateProvider() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: ProviderCreate) =>
            api.post<MedicalProvider>("/providers", data),
        onSuccess: (p) => {
            qc.invalidateQueries({ queryKey: keys.list(p.patient_id) });
        },
    });
}

export function useUpdateProvider(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ProviderUpdate }) =>
            api.patch<MedicalProvider>(`/providers/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useDeleteProvider(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/providers/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}
