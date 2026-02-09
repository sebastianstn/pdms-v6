/**
 * Alarm data hooks — active alarms query.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface Alarm {
    id: string;
    patient_id: string;
    vital_sign_id?: string;
    parameter: string;
    value: number;
    threshold_low?: number;
    threshold_high?: number;
    severity: "warning" | "critical";
    acknowledged: boolean;
    acknowledged_by?: string;
    triggered_at: string;
}

interface PaginatedAlarms {
    items: Alarm[];
    total: number;
}

export function useAlarms(acknowledged = false) {
    return useQuery<PaginatedAlarms>({
        queryKey: ["alarms", acknowledged],
        queryFn: () => api.get(`/alarms?acknowledged=${acknowledged}`),
        refetchInterval: 15_000, // Refresh every 15s
    });
}

export function useAcknowledgeAlarm() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (alarmId: string) => api.patch<Alarm>(`/alarms/${alarmId}/acknowledge`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["alarms"] });
        },
    });
}
