/**
 * Schichtübergabe hooks — CRUD, Acknowledge (SBAR).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  ShiftHandover,
  ShiftHandoverCreate,
  PaginatedShiftHandovers,
  ShiftType,
} from "@pdms/shared-types";

// ─── Query Keys ────────────────────────────────────────────────

const keys = {
  all: ["shift-handovers"] as const,
  list: (patientId: string) => [...keys.all, "list", patientId] as const,
  detail: (id: string) => [...keys.all, "detail", id] as const,
};

// ─── Read Hooks ────────────────────────────────────────────────

export function useShiftHandovers(
  patientId: string,
  opts?: { shift_type?: ShiftType; handover_date?: string; page?: number; perPage?: number },
) {
  const qs = new URLSearchParams();
  if (opts?.shift_type) qs.set("shift_type", opts.shift_type);
  if (opts?.handover_date) qs.set("handover_date", opts.handover_date);
  if (opts?.page) qs.set("skip", String((opts.page - 1) * (opts.perPage ?? 50)));
  if (opts?.perPage) qs.set("limit", String(opts.perPage));
  const suffix = qs.toString() ? `?${qs}` : "";

  return useQuery<PaginatedShiftHandovers>({
    queryKey: [...keys.list(patientId), opts],
    queryFn: () =>
      api.get<PaginatedShiftHandovers>(
        `/patients/${patientId}/shift-handovers${suffix}`,
      ),
    enabled: !!patientId,
  });
}

export function useShiftHandover(id: string) {
  return useQuery<ShiftHandover>({
    queryKey: keys.detail(id),
    queryFn: () => api.get<ShiftHandover>(`/shift-handovers/${id}`),
    enabled: !!id,
  });
}

// ─── Mutation Hooks ────────────────────────────────────────────

export function useCreateShiftHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ShiftHandoverCreate) =>
      api.post<ShiftHandover>("/shift-handovers", data),
    onSuccess: (h) => {
      qc.invalidateQueries({ queryKey: keys.list(h.patient_id) });
    },
  });
}

export function useAcknowledgeShiftHandover(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<ShiftHandover>(`/shift-handovers/${id}/acknowledge`, {}),
    onSuccess: (h) => {
      qc.invalidateQueries({ queryKey: keys.list(h.patient_id) });
      qc.setQueryData(keys.detail(id), h);
    },
  });
}

export function useDeleteShiftHandover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { handoverId: string; patientId: string }) =>
      api.delete(`/shift-handovers/${params.handoverId}`),
    onSuccess: (_res, params) => {
      qc.invalidateQueries({ queryKey: keys.list(params.patientId) });
    },
  });
}
