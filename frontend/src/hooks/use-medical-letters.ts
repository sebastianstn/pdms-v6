/**
 * Arztbrief hooks — CRUD, Finalize, Co-Sign, Send.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  MedicalLetter,
  MedicalLetterCreate,
  MedicalLetterUpdate,
  PaginatedMedicalLetters,
  MedicalLetterStatus,
} from "@pdms/shared-types";

// ─── Query Keys ────────────────────────────────────────────────

const keys = {
  all: ["medical-letters"] as const,
  list: (patientId: string) => [...keys.all, "list", patientId] as const,
  detail: (id: string) => [...keys.all, "detail", id] as const,
};

// ─── Read Hooks ────────────────────────────────────────────────

export function useMedicalLetters(
  patientId: string,
  opts?: { status?: MedicalLetterStatus; letter_type?: string; page?: number; perPage?: number },
) {
  const qs = new URLSearchParams();
  if (opts?.status) qs.set("status", opts.status);
  if (opts?.letter_type) qs.set("letter_type", opts.letter_type);
  if (opts?.page) qs.set("skip", String((opts.page - 1) * (opts.perPage ?? 50)));
  if (opts?.perPage) qs.set("limit", String(opts.perPage));
  const suffix = qs.toString() ? `?${qs}` : "";

  return useQuery<PaginatedMedicalLetters>({
    queryKey: [...keys.list(patientId), opts],
    queryFn: () =>
      api.get<PaginatedMedicalLetters>(`/patients/${patientId}/medical-letters${suffix}`),
    enabled: !!patientId,
  });
}

export function useMedicalLetter(id: string) {
  return useQuery<MedicalLetter>({
    queryKey: keys.detail(id),
    queryFn: () => api.get<MedicalLetter>(`/medical-letters/${id}`),
    enabled: !!id,
  });
}

// ─── Mutation Hooks ────────────────────────────────────────────

export function useCreateMedicalLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MedicalLetterCreate) =>
      api.post<MedicalLetter>("/medical-letters", data),
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: keys.list(l.patient_id) });
    },
  });
}

export function useUpdateMedicalLetter(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MedicalLetterUpdate) =>
      api.patch<MedicalLetter>(`/medical-letters/${id}`, data),
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: keys.list(l.patient_id) });
      qc.setQueryData(keys.detail(id), l);
    },
  });
}

export function useFinalizeMedicalLetter(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<MedicalLetter>(`/medical-letters/${id}/finalize`, {}),
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: keys.list(l.patient_id) });
      qc.setQueryData(keys.detail(id), l);
    },
  });
}

export function useCoSignMedicalLetter(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<MedicalLetter>(`/medical-letters/${id}/co-sign`, {}),
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: keys.list(l.patient_id) });
      qc.setQueryData(keys.detail(id), l);
    },
  });
}

export function useSendMedicalLetter(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { recipient: string }) =>
      api.post<MedicalLetter>(`/medical-letters/${id}/send`, body),
    onSuccess: (l) => {
      qc.invalidateQueries({ queryKey: keys.list(l.patient_id) });
      qc.setQueryData(keys.detail(id), l);
    },
  });
}

export function useDeleteMedicalLetter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { letterId: string; patientId: string }) =>
      api.delete(`/medical-letters/${params.letterId}`),
    onSuccess: (_res, params) => {
      qc.invalidateQueries({ queryKey: keys.list(params.patientId) });
    },
  });
}
