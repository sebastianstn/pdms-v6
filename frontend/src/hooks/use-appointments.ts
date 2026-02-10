/**
 * Appointment hooks — CRUD, week view, cancel, complete, discharge criteria.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    Appointment,
    AppointmentCreate,
    AppointmentUpdate,
    AppointmentMeta,
    DischargeCriteria,
    DischargeCriteriaUpdate,
} from "@pdms/shared-types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Query Keys ───────────────────────────────────────────────

const keys = {
    all: ["appointments"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    week: (patientId: string, weekStart: string) =>
        [...keys.all, "week", patientId, weekStart] as const,
    detail: (id: string) => [...keys.all, "detail", id] as const,
    meta: () => [...keys.all, "meta"] as const,
    discharge: (patientId: string) => ["discharge-criteria", patientId] as const,
};

// ─── Read Hooks ───────────────────────────────────────────────

export function useAppointments(
    patientId: string,
    params?: {
        from_date?: string;
        to_date?: string;
        appointment_type?: string;
        status?: string;
    },
) {
    return useQuery<Appointment[]>({
        queryKey: [...keys.list(patientId), params],
        queryFn: () => {
            const sp = new URLSearchParams();
            if (params?.from_date) sp.set("from_date", params.from_date);
            if (params?.to_date) sp.set("to_date", params.to_date);
            if (params?.appointment_type) sp.set("appointment_type", params.appointment_type);
            if (params?.status) sp.set("status", params.status);
            const qs = sp.toString();
            return api.get<Appointment[]>(
                `/patients/${patientId}/appointments${qs ? `?${qs}` : ""}`,
            );
        },
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useWeekAppointments(patientId: string, weekStart: string) {
    return useQuery<Record<string, Appointment[]>>({
        queryKey: keys.week(patientId, weekStart),
        queryFn: () =>
            api.get<Record<string, Appointment[]>>(
                `/patients/${patientId}/appointments/week?week_start=${weekStart}`,
            ),
        enabled: !!patientId && UUID_RE.test(patientId) && !!weekStart,
    });
}

export function useAppointmentMeta() {
    return useQuery<AppointmentMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<AppointmentMeta>("/appointments/meta"),
        staleTime: Infinity,
    });
}

// ─── Mutation Hooks ───────────────────────────────────────────

export function useCreateAppointment() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: AppointmentCreate) =>
            api.post<Appointment>("/appointments", data),
        onSuccess: (appt) => {
            qc.invalidateQueries({ queryKey: keys.list(appt.patient_id) });
        },
    });
}

export function useUpdateAppointment(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: AppointmentUpdate }) =>
            api.patch<Appointment>(`/appointments/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useCancelAppointment(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.post<Appointment>(`/appointments/${id}/cancel`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useCompleteAppointment(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) =>
            api.post<Appointment>(`/appointments/${id}/complete`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useDeleteAppointment(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/appointments/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

// ─── Discharge Criteria Hooks ─────────────────────────────────

export function useDischargeCriteria(patientId: string) {
    return useQuery<DischargeCriteria>({
        queryKey: keys.discharge(patientId),
        queryFn: () =>
            api.get<DischargeCriteria>(`/patients/${patientId}/discharge-criteria`),
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useUpdateDischargeCriteria(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: DischargeCriteriaUpdate) =>
            api.patch<DischargeCriteria>(
                `/patients/${patientId}/discharge-criteria`,
                data,
            ),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.discharge(patientId) });
        },
    });
}

