/**
 * Remote-device hooks — CRUD, reading ingestion, offline marking.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    RemoteDevice,
    RemoteDeviceCreate,
    RemoteDeviceUpdate,
    RemoteDeviceMeta,
} from "@pdms/shared-types";

const keys = {
    all: ["remote-devices"] as const,
    list: (patientId: string) => [...keys.all, "list", patientId] as const,
    detail: (id: string) => [...keys.all, "detail", id] as const,
    meta: () => [...keys.all, "meta"] as const,
};

export function useRemoteDevices(patientId: string) {
    return useQuery<RemoteDevice[]>({
        queryKey: keys.list(patientId),
        queryFn: () =>
            api.get<RemoteDevice[]>(`/patients/${patientId}/remote-devices`),
        enabled: !!patientId,
        refetchInterval: 60_000, // Refresh every 60s for device statuses
    });
}

export function useRemoteDeviceMeta() {
    return useQuery<RemoteDeviceMeta>({
        queryKey: keys.meta(),
        queryFn: () => api.get<RemoteDeviceMeta>("/remote-devices/meta"),
        staleTime: Infinity,
    });
}

export function useCreateRemoteDevice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: RemoteDeviceCreate) =>
            api.post<RemoteDevice>("/remote-devices", data),
        onSuccess: (device) => {
            qc.invalidateQueries({ queryKey: keys.list(device.patient_id) });
        },
    });
}

export function useUpdateRemoteDevice(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: RemoteDeviceUpdate }) =>
            api.patch<RemoteDevice>(`/remote-devices/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useReportReading(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            deviceId,
            value,
            unit,
        }: {
            deviceId: string;
            value: string;
            unit: string;
        }) =>
            api.post<RemoteDevice>(`/remote-devices/${deviceId}/reading`, {
                value,
                unit,
            }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useMarkDeviceOffline(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (deviceId: string) =>
            api.post<RemoteDevice>(`/remote-devices/${deviceId}/offline`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useDeleteRemoteDevice(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/remote-devices/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}
