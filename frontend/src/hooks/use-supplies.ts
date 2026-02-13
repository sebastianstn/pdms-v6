/**
 * Verbrauchsmaterial hooks — Supply Items + Usages.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  SupplyItem,
  SupplyItemCreate,
  SupplyItemUpdate,
  SupplyUsage,
  SupplyUsageCreate,
  PaginatedSupplyItems,
  PaginatedSupplyUsages,
} from "@pdms/shared-types";

// ─── Query Keys ────────────────────────────────────────────────

const itemKeys = {
  all: ["supplies"] as const,
  list: () => [...itemKeys.all, "list"] as const,
  lowStock: () => [...itemKeys.all, "low-stock"] as const,
  detail: (id: string) => [...itemKeys.all, "detail", id] as const,
};

const usageKeys = {
  all: ["supply-usages"] as const,
  list: (patientId: string) => [...usageKeys.all, "list", patientId] as const,
};

// ─── Item Read Hooks ───────────────────────────────────────────

export function useSupplyItems(opts?: { category?: string; page?: number; perPage?: number }) {
  const qs = new URLSearchParams();
  if (opts?.category) qs.set("category", opts.category);
  if (opts?.page) qs.set("skip", String((opts.page - 1) * (opts.perPage ?? 50)));
  if (opts?.perPage) qs.set("limit", String(opts.perPage));
  const suffix = qs.toString() ? `?${qs}` : "";

  return useQuery<PaginatedSupplyItems>({
    queryKey: [...itemKeys.list(), opts],
    queryFn: () => api.get<PaginatedSupplyItems>(`/supplies${suffix}`),
  });
}

export function useLowStockItems() {
  return useQuery<SupplyItem[]>({
    queryKey: itemKeys.lowStock(),
    queryFn: () => api.get<SupplyItem[]>("/supplies/low-stock"),
    refetchInterval: 300_000, // alle 5 Min
  });
}

export function useSupplyItem(id: string) {
  return useQuery<SupplyItem>({
    queryKey: itemKeys.detail(id),
    queryFn: () => api.get<SupplyItem>(`/supplies/${id}`),
    enabled: !!id,
  });
}

// ─── Item Mutations ────────────────────────────────────────────

export function useCreateSupplyItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplyItemCreate) =>
      api.post<SupplyItem>("/supplies", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: itemKeys.all });
    },
  });
}

export function useUpdateSupplyItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplyItemUpdate) =>
      api.patch<SupplyItem>(`/supplies/${id}`, data),
    onSuccess: (item) => {
      qc.invalidateQueries({ queryKey: itemKeys.all });
      qc.setQueryData(itemKeys.detail(id), item);
    },
  });
}

// ─── Usage Read Hooks ──────────────────────────────────────────

export function useSupplyUsages(
  patientId: string,
  opts?: { page?: number; perPage?: number },
) {
  const qs = new URLSearchParams();
  if (opts?.page) qs.set("skip", String((opts.page - 1) * (opts.perPage ?? 50)));
  if (opts?.perPage) qs.set("limit", String(opts.perPage));
  const suffix = qs.toString() ? `?${qs}` : "";

  return useQuery<PaginatedSupplyUsages>({
    queryKey: [...usageKeys.list(patientId), opts],
    queryFn: () =>
      api.get<PaginatedSupplyUsages>(`/patients/${patientId}/supply-usages${suffix}`),
    enabled: !!patientId,
  });
}

// ─── Usage Mutations ───────────────────────────────────────────

export function useCreateSupplyUsage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplyUsageCreate) =>
      api.post<SupplyUsage>("/supply-usages", data),
    onSuccess: (u) => {
      qc.invalidateQueries({ queryKey: usageKeys.list(u.patient_id) });
      qc.invalidateQueries({ queryKey: itemKeys.all }); // Stock ändert sich
    },
  });
}
