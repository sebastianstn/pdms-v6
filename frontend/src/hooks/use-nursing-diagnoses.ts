/**
 * Pflegediagnosen hooks — CRUD.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  NursingDiagnosis,
  NursingDiagnosisCreate,
  NursingDiagnosisUpdate,
  PaginatedNursingDiagnoses,
  NursingDiagnosisStatus,
} from "@pdms/shared-types";

// ─── Query Keys ────────────────────────────────────────────────

const keys = {
  all: ["nursing-diagnoses"] as const,
  list: (patientId: string) => [...keys.all, "list", patientId] as const,
  detail: (id: string) => [...keys.all, "detail", id] as const,
};

// ─── Read Hooks ────────────────────────────────────────────────

export function useNursingDiagnoses(
  patientId: string,
  opts?: { status?: NursingDiagnosisStatus; page?: number; perPage?: number },
) {
  const qs = new URLSearchParams();
  if (opts?.status) qs.set("status", opts.status);
  if (opts?.page) qs.set("skip", String((opts.page - 1) * (opts.perPage ?? 50)));
  if (opts?.perPage) qs.set("limit", String(opts.perPage));
  const suffix = qs.toString() ? `?${qs}` : "";

  return useQuery<PaginatedNursingDiagnoses>({
    queryKey: [...keys.list(patientId), opts],
    queryFn: () =>
      api.get<PaginatedNursingDiagnoses>(
        `/patients/${patientId}/nursing-diagnoses${suffix}`,
      ),
    enabled: !!patientId,
  });
}

export function useNursingDiagnosis(id: string) {
  return useQuery<NursingDiagnosis>({
    queryKey: keys.detail(id),
    queryFn: () => api.get<NursingDiagnosis>(`/nursing-diagnoses/${id}`),
    enabled: !!id,
  });
}

// ─── Mutation Hooks ────────────────────────────────────────────

export function useCreateNursingDiagnosis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NursingDiagnosisCreate) =>
      api.post<NursingDiagnosis>("/nursing-diagnoses", data),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: keys.list(d.patient_id) });
    },
  });
}

export function useUpdateNursingDiagnosis(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: NursingDiagnosisUpdate) =>
      api.patch<NursingDiagnosis>(`/nursing-diagnoses/${id}`, data),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: keys.list(d.patient_id) });
      qc.setQueryData(keys.detail(id), d);
    },
  });
}

export function useDeleteNursingDiagnosis() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { diagnosisId: string; patientId: string }) =>
      api.delete(`/nursing-diagnoses/${params.diagnosisId}`),
    onSuccess: (_res, params) => {
      qc.invalidateQueries({ queryKey: keys.list(params.patientId) });
    },
  });
}
