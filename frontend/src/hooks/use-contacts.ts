/**
 * Contact hooks — CRUD for emergency contacts / key persons.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    EmergencyContact,
    ContactCreate,
    ContactUpdate,
} from "@pdms/shared-types";

const keys = {
    all: ["contacts"] as const,
    list: (pid: string) => [...keys.all, "list", pid] as const,
};

export function useContacts(patientId: string) {
    return useQuery<EmergencyContact[]>({
        queryKey: keys.list(patientId),
        queryFn: () =>
            api.get<EmergencyContact[]>(`/patients/${patientId}/contacts`),
        enabled: !!patientId,
    });
}

export function useCreateContact() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: ContactCreate) =>
            api.post<EmergencyContact>("/contacts", data),
        onSuccess: (c) => {
            qc.invalidateQueries({ queryKey: keys.list(c.patient_id) });
        },
    });
}

export function useUpdateContact(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ContactUpdate }) =>
            api.patch<EmergencyContact>(`/contacts/${id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}

export function useDeleteContact(patientId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/contacts/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: keys.list(patientId) });
        },
    });
}
