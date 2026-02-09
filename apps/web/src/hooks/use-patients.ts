/**
 * Patient data hooks — TanStack Query integration.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  status: string;
  ahv_number?: string;
}

interface PaginatedPatients {
  items: Patient[];
  total: number;
  page: number;
  per_page: number;
}

export function usePatients(page = 1, search?: string) {
  const params = new URLSearchParams({ page: String(page) });
  if (search) params.set("search", search);

  return useQuery<PaginatedPatients>({
    queryKey: ["patients", page, search],
    queryFn: () => api.get(`/patients?${params}`),
  });
}

export function usePatient(id: string) {
  return useQuery<Patient>({
    queryKey: ["patients", id],
    queryFn: () => api.get(`/patients/${id}`),
    enabled: !!id,
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
