/**
 * Therapieplan hooks — CRUD, Items, Complete.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  TreatmentPlan,
  TreatmentPlanCreate,
  TreatmentPlanUpdate,
  PaginatedTreatmentPlans,
  TreatmentPlanStatus,
} from "@pdms/shared-types";

// ─── Query Keys ────────────────────────────────────────────────

const keys = {
  all: ["treatment-plans"] as const,
  list: (patientId: string) => [...keys.all, "list", patientId] as const,
  detail: (id: string) => [...keys.all, "detail", id] as const,
};

// ─── Read Hooks ────────────────────────────────────────────────

export function useTreatmentPlans(
  patientId: string,
  opts?: { status?: TreatmentPlanStatus; page?: number; perPage?: number },
) {
  const qs = new URLSearchParams();
  if (opts?.status) qs.set("status", opts.status);
  if (opts?.page) qs.set("skip", String((opts.page - 1) * (opts.perPage ?? 50)));
  if (opts?.perPage) qs.set("limit", String(opts.perPage));
  const suffix = qs.toString() ? `?${qs}` : "";

  return useQuery<PaginatedTreatmentPlans>({
    queryKey: [...keys.list(patientId), opts],
    queryFn: () =>
      api.get<PaginatedTreatmentPlans>(`/patients/${patientId}/treatment-plans${suffix}`),
    enabled: !!patientId,
  });
}

export function useTreatmentPlan(planId: string) {
  return useQuery<TreatmentPlan>({
    queryKey: keys.detail(planId),
    queryFn: () => api.get<TreatmentPlan>(`/treatment-plans/${planId}`),
    enabled: !!planId,
  });
}

// ─── Mutation Hooks ────────────────────────────────────────────

export function useCreateTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TreatmentPlanCreate) =>
      api.post<TreatmentPlan>("/treatment-plans", data),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: keys.list(plan.patient_id) });
    },
  });
}

export function useUpdateTreatmentPlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TreatmentPlanUpdate) =>
      api.patch<TreatmentPlan>(`/treatment-plans/${planId}`, data),
    onSuccess: (plan) => {
      qc.invalidateQueries({ queryKey: keys.list(plan.patient_id) });
      qc.setQueryData(keys.detail(planId), plan);
    },
  });
}

export function useCompletePlanItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.post<unknown>(`/treatment-plan-items/${itemId}/complete`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.all });
    },
  });
}

export function useDeleteTreatmentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { planId: string; patientId: string }) =>
      api.delete(`/treatment-plans/${params.planId}`),
    onSuccess: (_res, params) => {
      qc.invalidateQueries({ queryKey: keys.list(params.patientId) });
    },
  });
}
