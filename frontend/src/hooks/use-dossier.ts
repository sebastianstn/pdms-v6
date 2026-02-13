/**
 * Dossier hook — Aggregierte Patientenübersicht.
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { DossierOverview } from "@pdms/shared-types";

const keys = {
  all: ["dossier"] as const,
  patient: (patientId: string) => [...keys.all, patientId] as const,
};

export function useDossier(patientId: string) {
  return useQuery<DossierOverview>({
    queryKey: keys.patient(patientId),
    queryFn: () => api.get<DossierOverview>(`/patients/${patientId}/dossier`),
    enabled: !!patientId,
    refetchInterval: 60_000, // Minütlich aktualisieren
  });
}
