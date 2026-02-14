/**
 * Patient data hooks — TanStack Query integration.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { Patient } from "@pdms/shared-types";

interface PaginatedPatients {
  items: Patient[];
  total: number;
  page: number;
  per_page: number;
}

interface QueryOptions {
  enabled?: boolean;
}

export function usePatients(page = 1, search?: string, options?: QueryOptions) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);

  return useQuery<PaginatedPatients>({
    queryKey: ["patients", page, search],
    queryFn: () => api.get(`/patients?${params}`),
    enabled: options?.enabled,
  });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function usePatient(id: string) {
  const isValidId = !!id && UUID_RE.test(id);
  return useQuery<Patient>({
    queryKey: ["patients", id],
    queryFn: () => api.get(`/patients/${id}`),
    enabled: isValidId,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Patient>) => api.post<Patient>("/patients", data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["patients"] }),
  });
}

export function useUpdatePatient(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Patient>) => api.patch<Patient>(`/patients/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patients", id] });
    },
  });
}

export function useUploadPatientPhoto(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post<Patient>(`/patients/${id}/photo`, formData);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["patients"] });
      qc.invalidateQueries({ queryKey: ["patients", id] });
    },
  });
}
