/**
 * Directive hooks — advance directives, patient wishes, palliative care,
 * death notifications.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    AdvanceDirective,
    DirectiveCreate,
    DirectiveUpdate,
    DirectiveMeta,
    PatientWishes,
    WishesUpsert,
    PalliativeCare,
    PalliativeUpsert,
    DeathNotification,
    DeathNotificationCreate,
    DeathNotificationUpdate,
} from "@pdms/shared-types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// ─── Query Keys ───────────────────────────────────────────────

const keys = {
    directives: ["directives"] as const,
    directiveList: (pid: string) => ["directives", "list", pid] as const,
    directiveDetail: (id: string) => ["directives", "detail", id] as const,
    directiveMeta: () => ["directives", "meta"] as const,
    wishes: (pid: string) => ["wishes", pid] as const,
    palliative: (pid: string) => ["palliative", pid] as const,
    deathNotifs: (pid: string) => ["death-notifications", pid] as const,
};

// ─── Advance Directives ──────────────────────────────────────

export function useDirectives(patientId: string) {
    return useQuery<AdvanceDirective[]>({
        queryKey: keys.directiveList(patientId),
        queryFn: () =>
            api.get<AdvanceDirective[]>(`/patients/${patientId}/directives`),
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useDirective(directiveId: string) {
    return useQuery<AdvanceDirective>({
        queryKey: keys.directiveDetail(directiveId),
        queryFn: () =>
            api.get<AdvanceDirective>(`/directives/${directiveId}`),
        enabled: !!directiveId,
    });
}

export function useDirectiveMeta() {
    return useQuery<DirectiveMeta>({
        queryKey: keys.directiveMeta(),
        queryFn: () => api.get<DirectiveMeta>("/directives/meta"),
        staleTime: Infinity,
    });
}

export function useCreateDirective() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: DirectiveCreate) =>
            api.post<AdvanceDirective>("/directives", data),
        onSuccess: (d) => {
            qc.invalidateQueries({ queryKey: keys.directiveList(d.patient_id) });
        },
    });
}

export function useUpdateDirective(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: DirectiveUpdate }) =>
            api.patch<AdvanceDirective>(`/directives/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.directiveList(patientId) });
        },
    });
}

export function useDeleteDirective(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/directives/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.directiveList(patientId) });
        },
    });
}

// ─── Patient Wishes (ZGB 378) ─────────────────────────────────

export function usePatientWishes(patientId: string) {
    return useQuery<PatientWishes | null>({
        queryKey: keys.wishes(patientId),
        queryFn: () =>
            api.get<PatientWishes | null>(`/patients/${patientId}/wishes`),
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useUpsertWishes(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: WishesUpsert) =>
            api.patch<PatientWishes>(`/patients/${patientId}/wishes`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.wishes(patientId) });
        },
    });
}

// ─── Palliative Care ──────────────────────────────────────────

export function usePalliativeCare(patientId: string) {
    return useQuery<PalliativeCare | null>({
        queryKey: keys.palliative(patientId),
        queryFn: () =>
            api.get<PalliativeCare | null>(`/patients/${patientId}/palliative`),
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useUpsertPalliative(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: PalliativeUpsert) =>
            api.patch<PalliativeCare>(`/patients/${patientId}/palliative`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.palliative(patientId) });
        },
    });
}

// ─── Death Notifications ──────────────────────────────────────

export function useDeathNotifications(patientId: string) {
    return useQuery<DeathNotification[]>({
        queryKey: keys.deathNotifs(patientId),
        queryFn: () =>
            api.get<DeathNotification[]>(
                `/patients/${patientId}/death-notifications`,
            ),
        enabled: !!patientId && UUID_RE.test(patientId),
    });
}

export function useCreateDeathNotification() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: DeathNotificationCreate) =>
            api.post<DeathNotification>("/death-notifications", data),
        onSuccess: (n) => {
            qc.invalidateQueries({ queryKey: keys.deathNotifs(n.patient_id) });
        },
    });
}

export function useUpdateDeathNotification(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: DeathNotificationUpdate }) =>
            api.patch<DeathNotification>(`/death-notifications/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.deathNotifs(patientId) });
        },
    });
}

export function useDeleteDeathNotification(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/death-notifications/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.deathNotifs(patientId) });
        },
    });
}

