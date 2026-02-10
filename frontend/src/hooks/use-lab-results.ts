/**
 * Lab result hooks — list, summary, trend, CRUD, batch, meta.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    LabResult,
    LabResultCreate,
    LabResultBatchCreate,
    LabResultUpdate,
    LabTrendResponse,
    LabSummaryItem,
    LabMeta,
} from "@pdms/shared-types";

// ─── Query Keys ────────────────────────────────────────────────

const keys = {
    all: ["lab-results"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    summary: (patientId: string) => [...keys.all, "summary", patientId] as const,
    trend: (patientId: string, analyte: string) =>
        [...keys.all, "trend", patientId, analyte] as const,
    detail: (id: string) => [...keys.all, "detail", id] as const,
    meta: () => [...keys.all, "meta"] as const,
};

// ─── Paginated response ────────────────────────────────────────

interface PaginatedLabResults {
    items: LabResult[];
    total: number;
    page: number;
    per_page: number;
}

// ─── Read hooks ────────────────────────────────────────────────

export function useLabResults(
    patientId: string,
    opts?: { analyte?: string; category?: string; page?: number; perPage?: number }
) {
    const qs = new URLSearchParams();
    if (opts?.analyte) qs.set("analyte", opts.analyte);
    if (opts?.category) qs.set("category", opts.category);
    if (opts?.page) qs.set("page", String(opts.page));
    if (opts?.perPage) qs.set("per_page", String(opts.perPage));
    const suffix = qs.toString() ? `?${qs}` : "";

    return useQuery<PaginatedLabResults>({
        queryKey: [...keys.list(patientId), opts],
        queryFn: () =>
            api.get<PaginatedLabResults>(`/patients/${patientId}/lab-results${suffix}`),
        enabled: !!patientId,
    });
}

export function useLabSummary(patientId: string) {
    return useQuery<{ items: LabSummaryItem[] }>({
        queryKey: keys.summary(patientId),
        queryFn: () =>
            api.get<{ items: LabSummaryItem[] }>(`/patients/${patientId}/lab-results/summary`),
        enabled: !!patientId,
        refetchInterval: 120_000, // Refresh every 2 min
    });
}

export function useLabTrend(patientId: string, analyte: string, limit = 20) {
    return useQuery<LabTrendResponse>({
        queryKey: keys.trend(patientId, analyte),
        queryFn: () =>
            api.get<LabTrendResponse>(
                `/patients/${patientId}/lab-results/trend/${analyte}?limit=${limit}`
            ),
        enabled: !!patientId && !!analyte,
    });
}

export function useLabResult(resultId: string) {
    return useQuery<LabResult>({
        queryKey: keys.detail(resultId),
        queryFn: () => api.get<LabResult>(`/lab-results/${resultId}`),
        enabled: !!resultId,
    });
}

export function useLabMeta() {
    return useQuery<LabMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<LabMeta>("/lab-results/meta"),
        staleTime: Infinity,
    });
}

// ─── Mutation hooks ────────────────────────────────────────────

export function useCreateLabResult() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: LabResultCreate) =>
            api.post<LabResult>("/lab-results", data),
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: keys.list(result.patient_id) });
            qc.invalidateQueries({ queryKey: keys.summary(result.patient_id) });
            qc.invalidateQueries({
                queryKey: keys.trend(result.patient_id, result.analyte),
            });
        },
    });
}

export function useCreateLabResultBatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: LabResultBatchCreate) =>
            api.post<LabResult[]>("/lab-results/batch", data),
        onSuccess: (_results, variables) => {
            qc.invalidateQueries({ queryKey: keys.list(variables.patient_id) });
            qc.invalidateQueries({ queryKey: keys.summary(variables.patient_id) });
            // Invalidate trend for each unique analyte in the batch
            const analytes = new Set(variables.results.map((r) => r.analyte));
            analytes.forEach((a) =>
                qc.invalidateQueries({ queryKey: keys.trend(variables.patient_id, a) })
            );
        },
    });
}

export function useUpdateLabResult(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: LabResultUpdate }) =>
            api.patch<LabResult>(`/lab-results/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
            qc.invalidateQueries({ queryKey: keys.summary(patientId) });
        },
    });
}

export function useDeleteLabResult(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/lab-results/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
            qc.invalidateQueries({ queryKey: keys.summary(patientId) });
        },
    });
}
