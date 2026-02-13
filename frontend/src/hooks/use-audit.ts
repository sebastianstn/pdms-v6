/**
 * Audit-Trail hooks — Paginierte Audit-Log-Abfragen (nur Admin).
 */
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

// ─── Types ────────────────────────────────────────────────────

export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_role: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface PaginatedAuditLogs {
  items: AuditLogEntry[];
  total: number;
  page: number;
  per_page: number;
}

export interface AuditFilters {
  page?: number;
  per_page?: number;
  user_id?: string;
  action?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
  patient_id?: string;
}

// ─── Query Keys ───────────────────────────────────────────────

const keys = {
  all: ["audit"] as const,
  list: (filters: AuditFilters) => [...keys.all, "list", filters] as const,
  detail: (id: string) => [...keys.all, "detail", id] as const,
  patient: (patientId: string, filters: AuditFilters) =>
    [...keys.all, "patient", patientId, filters] as const,
};

// ─── Read Hooks ───────────────────────────────────────────────

/** Paginierte Audit-Logs mit optionalen Filtern (nur für Admin). */
export function useAuditLogs(filters: AuditFilters = {}) {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.per_page) params.set("per_page", String(filters.per_page));
  if (filters.user_id) params.set("user_id", filters.user_id);
  if (filters.action) params.set("action", filters.action);
  if (filters.resource_type) params.set("resource_type", filters.resource_type);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);

  const qs = params.toString();
  const path = `/audit${qs ? `?${qs}` : ""}`;

  return useQuery<PaginatedAuditLogs>({
    queryKey: keys.list(filters),
    queryFn: () => api.get<PaginatedAuditLogs>(path),
  });
}

/** Einzelner Audit-Eintrag. */
export function useAuditEntry(logId: string) {
  return useQuery<AuditLogEntry>({
    queryKey: keys.detail(logId),
    queryFn: () => api.get<AuditLogEntry>(`/audit/${logId}`),
    enabled: !!logId,
  });
}

/** Patientenbezogene Zugriffe — filtert nach resource_type mit Patient-ID. */
export function usePatientAuditLogs(
  patientId: string,
  filters: AuditFilters = {},
) {
  const params = new URLSearchParams();
  params.set("resource_type", `patients/${patientId}`);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.per_page) params.set("per_page", String(filters.per_page));
  if (filters.action) params.set("action", filters.action);
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);

  const qs = params.toString();

  return useQuery<PaginatedAuditLogs>({
    queryKey: keys.patient(patientId, filters),
    queryFn: () => api.get<PaginatedAuditLogs>(`/audit?${qs}`),
    enabled: !!patientId,
  });
}
