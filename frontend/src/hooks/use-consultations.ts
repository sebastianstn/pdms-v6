/**
 * Konsil hooks — CRUD, Respond, Cancel.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Consultation,
  ConsultationCreate,
  ConsultationUpdate,
  PaginatedConsultations,
  ConsultationStatus,
} from "@pdms/shared-types";

// ─── Query Keys ────────────────────────────────────────────────

const keys = {
  all: ["consultations"] as const,
  list: (patientId: string) => [...keys.all, "list", patientId] as const,
  detail: (id: string) => [...keys.all, "detail", id] as const,
};

// ─── Read Hooks ────────────────────────────────────────────────

export function useConsultations(
  patientId: string,
  opts?: { status?: ConsultationStatus; specialty?: string; page?: number; perPage?: number },
) {
  const qs = new URLSearchParams();
  if (opts?.status) qs.set("status", opts.status);
  if (opts?.specialty) qs.set("specialty", opts.specialty);
  if (opts?.page) qs.set("skip", String((opts.page - 1) * (opts.perPage ?? 50)));
  if (opts?.perPage) qs.set("limit", String(opts.perPage));
  const suffix = qs.toString() ? `?${qs}` : "";

  return useQuery<PaginatedConsultations>({
    queryKey: [...keys.list(patientId), opts],
    queryFn: () =>
      api.get<PaginatedConsultations>(`/patients/${patientId}/consultations${suffix}`),
    enabled: !!patientId,
  });
}

export function useConsultation(id: string) {
  return useQuery<Consultation>({
    queryKey: keys.detail(id),
    queryFn: () => api.get<Consultation>(`/consultations/${id}`),
    enabled: !!id,
  });
}

// ─── Mutation Hooks ────────────────────────────────────────────

export function useCreateConsultation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ConsultationCreate) =>
      api.post<Consultation>("/consultations", data),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: keys.list(c.patient_id) });
    },
  });
}

export function useUpdateConsultation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ConsultationUpdate) =>
      api.patch<Consultation>(`/consultations/${id}`, data),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: keys.list(c.patient_id) });
      qc.setQueryData(keys.detail(id), c);
    },
  });
}

export function useCancelConsultation(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<Consultation>(`/consultations/${id}/cancel`, {}),
    onSuccess: (c) => {
      qc.invalidateQueries({ queryKey: keys.list(c.patient_id) });
      qc.setQueryData(keys.detail(id), c);
    },
  });
}
