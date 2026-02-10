/**
 * Fluid balance hooks — list, summary, CRUD, meta.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    FluidEntry,
    FluidEntryCreate,
    FluidEntryUpdate,
    FluidBalanceSummary,
    FluidBalanceMeta,
} from "@pdms/shared-types";

// ─── Query Keys ────────────────────────────────────────────────

const keys = {
    all: ["fluid-balance"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    summary: (patientId: string, hours?: number) =>
        [...keys.all, "summary", patientId, hours] as const,
    detail: (id: string) => [...keys.all, "detail", id] as const,
    meta: () => [...keys.all, "meta"] as const,
};

// ─── Paginated response ────────────────────────────────────────

interface PaginatedFluidEntries {
    items: FluidEntry[];
    total: number;
    page: number;
    per_page: number;
}

// ─── Read hooks ────────────────────────────────────────────────

export function useFluidEntries(
    patientId: string,
    opts?: { direction?: string; category?: string; page?: number; perPage?: number }
) {
    const qs = new URLSearchParams();
    if (opts?.direction) qs.set("direction", opts.direction);
    if (opts?.category) qs.set("category", opts.category);
    if (opts?.page) qs.set("page", String(opts.page));
    if (opts?.perPage) qs.set("per_page", String(opts.perPage));
    const suffix = qs.toString() ? `?${qs}` : "";

    return useQuery<PaginatedFluidEntries>({
        queryKey: [...keys.list(patientId), opts],
        queryFn: () =>
            api.get<PaginatedFluidEntries>(`/patients/${patientId}/fluid-balance${suffix}`),
        enabled: !!patientId,
    });
}

export function useFluidBalanceSummary(patientId: string, hours = 24) {
    return useQuery<FluidBalanceSummary>({
        queryKey: keys.summary(patientId, hours),
        queryFn: () =>
            api.get<FluidBalanceSummary>(
                `/patients/${patientId}/fluid-balance/summary?hours=${hours}`
            ),
        enabled: !!patientId,
        refetchInterval: 60_000, // Refresh every 60s
    });
}

export function useFluidEntry(entryId: string) {
    return useQuery<FluidEntry>({
        queryKey: keys.detail(entryId),
        queryFn: () => api.get<FluidEntry>(`/fluid-balance/${entryId}`),
        enabled: !!entryId,
    });
}

export function useFluidBalanceMeta() {
    return useQuery<FluidBalanceMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<FluidBalanceMeta>("/fluid-balance/meta"),
        staleTime: Infinity,
    });
}

// ─── Mutation hooks ────────────────────────────────────────────

export function useCreateFluidEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: FluidEntryCreate) =>
            api.post<FluidEntry>("/fluid-balance", data),
        onSuccess: (entry) => {
            qc.invalidateQueries({ queryKey: keys.list(entry.patient_id) });
            qc.invalidateQueries({ queryKey: keys.summary(entry.patient_id) });
        },
    });
}

export function useUpdateFluidEntry(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: FluidEntryUpdate }) =>
            api.patch<FluidEntry>(`/fluid-balance/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
            qc.invalidateQueries({ queryKey: keys.summary(patientId) });
        },
    });
}

export function useDeleteFluidEntry(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/fluid-balance/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
            qc.invalidateQueries({ queryKey: keys.summary(patientId) });
        },
    });
}
