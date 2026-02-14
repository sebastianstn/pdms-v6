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
    InsuranceProviderOption,
    InsuranceCompanyCreate,
    InsuranceCompanyUpdate,
} from "@pdms/shared-types";

const keys = {
    all: ["insurances"] as const,
    list: (pid: string) => [...keys.all, "list", pid] as const,
    meta: () => [...keys.all, "meta"] as const,
    providers: (coverage?: "basic" | "semi_private" | "private") => [...keys.all, "providers", coverage ?? "all"] as const,
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

export function useInsuranceProviders(coverage?: "basic" | "semi_private" | "private") {
    const params = coverage ? `?coverage=${coverage}` : "";
    return useQuery<InsuranceProviderOption[]>({
        queryKey: keys.providers(coverage),
        queryFn: () => api.get<InsuranceProviderOption[]>(`/insurance/providers${params}`),
        staleTime: 5 * 60_000,
    });
}

export function useInsuranceCatalog() {
    return useQuery<InsuranceProviderOption[]>({
        queryKey: [...keys.all, "catalog"],
        queryFn: () => api.get<InsuranceProviderOption[]>("/insurance/catalog"),
    });
}

export function useCreateInsuranceCompany() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: InsuranceCompanyCreate) => api.post<InsuranceProviderOption>("/insurance/catalog", data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...keys.all, "catalog"] });
            qc.invalidateQueries({ queryKey: keys.providers() });
        },
    });
}

export function useUpdateInsuranceCompany() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: InsuranceCompanyUpdate }) =>
            api.patch<InsuranceProviderOption>(`/insurance/catalog/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...keys.all, "catalog"] });
            qc.invalidateQueries({ queryKey: keys.providers() });
        },
    });
}

export function useDeleteInsuranceCompany() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/insurance/catalog/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [...keys.all, "catalog"] });
            qc.invalidateQueries({ queryKey: keys.providers() });
        },
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
