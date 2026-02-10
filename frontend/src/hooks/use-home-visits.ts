/**
 * Home-visit hooks — CRUD, status transitions, today's overview.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    HomeVisit,
    HomeVisitCreate,
    HomeVisitUpdate,
    HomeVisitMeta,
} from "@pdms/shared-types";

const keys = {
    all: ["home-visits"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    today: () => [...keys.all, "today"] as const,
    detail: (id: string) => [...keys.all, "detail", id] as const,
    meta: () => [...keys.all, "meta"] as const,
};

// ─── Read ─────────────────────────────────────────────────────

export function useHomeVisits(
    patientId: string,
    params?: { from_date?: string; to_date?: string; status?: string },
) {
    return useQuery<HomeVisit[]>({
        queryKey: [...keys.list(patientId), params],
        queryFn: () => {
            const sp = new URLSearchParams();
            if (params?.from_date) sp.set("from_date", params.from_date);
            if (params?.to_date) sp.set("to_date", params.to_date);
            if (params?.status) sp.set("status", params.status);
            const qs = sp.toString();
            return api.get<HomeVisit[]>(
                `/patients/${patientId}/home-visits${qs ? `?${qs}` : ""}`,
            );
        },
        enabled: !!patientId,
    });
}

export function useTodayHomeVisits() {
    return useQuery<HomeVisit[]>({
        queryKey: keys.today(),
        queryFn: () => api.get<HomeVisit[]>("/home-visits/today"),
        refetchInterval: 30_000, // Refresh every 30s
    });
}

export function useHomeVisitMeta() {
    return useQuery<HomeVisitMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<HomeVisitMeta>("/home-visits/meta"),
        staleTime: Infinity,
    });
}

// ─── Mutations ────────────────────────────────────────────────

export function useCreateHomeVisit() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: HomeVisitCreate) =>
            api.post<HomeVisit>("/home-visits", data),
        onSuccess: (visit) => {
            qc.invalidateQueries({ queryKey: keys.list(visit.patient_id) });
            qc.invalidateQueries({ queryKey: keys.today() });
        },
    });
}

export function useUpdateHomeVisit(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: HomeVisitUpdate }) =>
            api.patch<HomeVisit>(`/home-visits/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
            qc.invalidateQueries({ queryKey: keys.today() });
        },
    });
}

export function useStartTravel(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.post<HomeVisit>(`/home-visits/${id}/start-travel`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
            qc.invalidateQueries({ queryKey: keys.today() });
        },
    });
}

export function useArriveVisit(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.post<HomeVisit>(`/home-visits/${id}/arrive`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
            qc.invalidateQueries({ queryKey: keys.today() });
        },
    });
}

export function useCompleteVisit(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: HomeVisitUpdate }) =>
            api.post<HomeVisit>(`/home-visits/${id}/complete`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
            qc.invalidateQueries({ queryKey: keys.today() });
        },
    });
}

export function useDeleteHomeVisit(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/home-visits/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
            qc.invalidateQueries({ queryKey: keys.today() });
        },
    });
}
