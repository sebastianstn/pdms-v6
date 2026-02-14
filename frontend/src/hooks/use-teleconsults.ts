/**
 * Teleconsult hooks — CRUD, start/end session.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    Teleconsult,
    TeleconsultCreate,
    TeleconsultUpdate,
    TeleconsultMeta,
} from "@pdms/shared-types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const keys = {
    all: ["teleconsults"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    detail: (id: string) => [...keys.all, "detail", id] as const,
    meta: () => [...keys.all, "meta"] as const,
    today: () => [...keys.all, "today"] as const,
};

interface QueryOptions {
    enabled?: boolean;
}

// ─── Read ─────────────────────────────────────────────────────

interface TodayTeleconsults {
    total: number;
    completed: number;
    active: number;
    scheduled: number;
    items: Teleconsult[];
}

export function useTodayTeleconsults(options?: QueryOptions) {
    return useQuery<TodayTeleconsults>({
        queryKey: keys.today(),
        queryFn: () => api.get<TodayTeleconsults>("/teleconsults/today"),
        enabled: options?.enabled,
        refetchInterval: 60_000,
    });
}

export function useTeleconsults(patientId: string, status?: string) {
    return useQuery<Teleconsult[]>({
        queryKey: [...keys.list(patientId), status],
        queryFn: async () => {
            const qs = status ? `?status=${status}` : "";
            const res = await api.get<{ items: Teleconsult[] }>(
                `/patients/${patientId}/teleconsults${qs}`,
            );
            return Array.isArray(res) ? res : res.items ?? [];
        },
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useTeleconsultMeta() {
    return useQuery<TeleconsultMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<TeleconsultMeta>("/teleconsults/meta"),
        staleTime: Infinity,
    });
}

// ─── Mutations ────────────────────────────────────────────────

export function useCreateTeleconsult() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: TeleconsultCreate) =>
            api.post<Teleconsult>("/teleconsults", data),
        onSuccess: (tc) => {
            qc.invalidateQueries({ queryKey: keys.list(tc.patient_id) });
        },
    });
}

export function useUpdateTeleconsult(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: TeleconsultUpdate }) =>
            api.patch<Teleconsult>(`/teleconsults/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useStartTeleconsult(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.post<Teleconsult>(`/teleconsults/${id}/start`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useEndTeleconsult(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.post<Teleconsult>(`/teleconsults/${id}/end`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useDeleteTeleconsult(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/teleconsults/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}
