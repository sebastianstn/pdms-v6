/**
 * Consent hooks — CRUD + revoke for informed consents.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    Consent,
    ConsentCreate,
    ConsentUpdate,
    ConsentMeta,
} from "@pdms/shared-types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Query Keys ───────────────────────────────────────────────

const keys = {
    all: ["consents"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    detail: (id: string) => [...keys.all, "detail", id] as const,
    meta: () => [...keys.all, "meta"] as const,
};

// ─── Read Hooks ───────────────────────────────────────────────

export function useConsents(patientId: string) {
    return useQuery<Consent[]>({
        queryKey: keys.list(patientId),
        queryFn: async () => {
            const res = await api.get<{ items: Consent[] }>(
                `/patients/${patientId}/consents`,
            );
            return Array.isArray(res) ? res : res.items ?? [];
        },
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useConsent(consentId: string) {
    return useQuery<Consent>({
        queryKey: keys.detail(consentId),
        queryFn: () => api.get<Consent>(`/consents/${consentId}`),
        enabled: !!consentId,
    });
}

export function useConsentMeta() {
    return useQuery<ConsentMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<ConsentMeta>("/consents/meta"),
        staleTime: Infinity,
    });
}

// ─── Mutation Hooks ───────────────────────────────────────────

export function useCreateConsent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: ConsentCreate) =>
            api.post<Consent>("/consents", data),
        onSuccess: (c) => {
            qc.invalidateQueries({ queryKey: keys.list(c.patient_id) });
        },
    });
}

export function useUpdateConsent(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ConsentUpdate }) =>
            api.patch<Consent>(`/consents/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useRevokeConsent(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            api.post<Consent>(`/consents/${id}/revoke`, { reason }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useDeleteConsent(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/consents/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

