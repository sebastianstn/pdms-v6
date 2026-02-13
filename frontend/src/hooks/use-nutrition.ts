/**
 * Ernährungs hooks — Nutrition Orders + Screenings.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  NutritionOrder,
  NutritionOrderCreate,
  NutritionOrderUpdate,
  NutritionScreening,
  NutritionScreeningCreate,
  PaginatedNutritionOrders,
  PaginatedNutritionScreenings,
} from "@pdms/shared-types";

// ─── Query Keys ────────────────────────────────────────────────

const orderKeys = {
  all: ["nutrition-orders"] as const,
  list: (patientId: string) => [...orderKeys.all, "list", patientId] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
};

const screeningKeys = {
  all: ["nutrition-screenings"] as const,
  list: (patientId: string) => [...screeningKeys.all, "list", patientId] as const,
};

// ─── Order Read Hooks ──────────────────────────────────────────

export function useNutritionOrders(
  patientId: string,
  opts?: { status?: string; page?: number; perPage?: number },
) {
  const qs = new URLSearchParams();
  if (opts?.status) qs.set("status", opts.status);
  if (opts?.page) qs.set("skip", String((opts.page - 1) * (opts.perPage ?? 50)));
  if (opts?.perPage) qs.set("limit", String(opts.perPage));
  const suffix = qs.toString() ? `?${qs}` : "";

  return useQuery<PaginatedNutritionOrders>({
    queryKey: [...orderKeys.list(patientId), opts],
    queryFn: () =>
      api.get<PaginatedNutritionOrders>(`/patients/${patientId}/nutrition-orders${suffix}`),
    enabled: !!patientId,
  });
}

export function useNutritionOrder(id: string) {
  return useQuery<NutritionOrder>({
    queryKey: orderKeys.detail(id),
    queryFn: () => api.get<NutritionOrder>(`/nutrition-orders/${id}`),
    enabled: !!id,
  });
}

// ─── Order Mutations ───────────────────────────────────────────

export function useCreateNutritionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NutritionOrderCreate) =>
      api.post<NutritionOrder>("/nutrition-orders", data),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: orderKeys.list(o.patient_id) });
    },
  });
}

export function useUpdateNutritionOrder(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NutritionOrderUpdate) =>
      api.patch<NutritionOrder>(`/nutrition-orders/${id}`, data),
    onSuccess: (o) => {
      qc.invalidateQueries({ queryKey: orderKeys.list(o.patient_id) });
      qc.setQueryData(orderKeys.detail(id), o);
    },
  });
}

export function useDeleteNutritionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { orderId: string; patientId: string }) =>
      api.delete(`/nutrition-orders/${params.orderId}`),
    onSuccess: (_res, params) => {
      qc.invalidateQueries({ queryKey: orderKeys.list(params.patientId) });
    },
  });
}

// ─── Screening Read Hooks ──────────────────────────────────────

export function useNutritionScreenings(
  patientId: string,
  opts?: { page?: number; perPage?: number },
) {
  const qs = new URLSearchParams();
  if (opts?.page) qs.set("skip", String((opts.page - 1) * (opts.perPage ?? 50)));
  if (opts?.perPage) qs.set("limit", String(opts.perPage));
  const suffix = qs.toString() ? `?${qs}` : "";

  return useQuery<PaginatedNutritionScreenings>({
    queryKey: [...screeningKeys.list(patientId), opts],
    queryFn: () =>
      api.get<PaginatedNutritionScreenings>(
        `/patients/${patientId}/nutrition-screenings${suffix}`,
      ),
    enabled: !!patientId,
  });
}

// ─── Screening Mutations ──────────────────────────────────────

export function useCreateNutritionScreening() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NutritionScreeningCreate) =>
      api.post<NutritionScreening>("/nutrition-screenings", data),
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: screeningKeys.list(s.patient_id) });
    },
  });
}
