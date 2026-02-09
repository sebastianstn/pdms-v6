/**
 * Vitals data hooks — time series queries.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

interface VitalSign {
  id: string;
  patient_id: string;
  recorded_at: string;
  heart_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  spo2?: number;
  temperature?: number;
  respiratory_rate?: number;
  gcs?: number;
  pain_score?: number;
}

export function useVitals(patientId: string, hours = 24) {
  return useQuery<VitalSign[]>({
    queryKey: ["vitals", patientId, hours],
    queryFn: () => api.get(`/patients/${patientId}/vitals?hours=${hours}`),
    enabled: !!patientId,
    refetchInterval: 30_000, // Refresh every 30s
  });
}

export function useRecordVital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<VitalSign>) => api.post<VitalSign>("/vitals", data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["vitals", variables.patient_id] });
    },
  });
}
