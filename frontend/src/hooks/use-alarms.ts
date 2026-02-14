/**
 * Alarm data hooks — active alarms query, acknowledge/resolve mutations, WebSocket real-time.
 */
import { useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { wsManager } from "@/lib/websocket";
import { useAuth } from "@/providers/auth-provider";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface Alarm {
    id: string;
    patient_id: string;
    vital_sign_id?: string;
    parameter: string;
    value: number;
    threshold_min?: number;
    threshold_max?: number;
    severity: "info" | "warning" | "critical";
    status: "active" | "acknowledged" | "resolved";
    acknowledged_at?: string;
    acknowledged_by?: string;
    triggered_at: string;
}

interface PaginatedAlarms {
    items: Alarm[];
    total: number;
    page: number;
    per_page: number;
}

interface AlarmCounts {
    warning: number;
    critical: number;
    total: number;
}

interface QueryOptions {
    enabled?: boolean;
}

/**
 * Alle Alarme abfragen mit optionalem Status-Filter.
 */
export function useAlarms(status: "active" | "acknowledged" | "resolved" = "active", patientId?: string) {
    const params = new URLSearchParams({ status });
    const validPatient = patientId && UUID_RE.test(patientId);
    const enabled = !patientId || Boolean(validPatient);
    if (validPatient) params.set("patient_id", patientId);

    return useQuery<PaginatedAlarms>({
        queryKey: ["alarms", status, patientId],
        queryFn: () => api.get(`/alarms?${params.toString()}`),
        enabled,
        refetchInterval: 15_000,
    });
}

/**
 * Schnelle Alarm-Zählung für Dashboard-Badges.
 */
export function useAlarmCounts(options?: QueryOptions) {
    return useQuery<AlarmCounts>({
        queryKey: ["alarms", "counts"],
        queryFn: () => api.get("/alarms/counts"),
        enabled: options?.enabled,
        refetchInterval: 10_000,
    });
}

/**
 * Alarm quittieren (acknowledge).
 */
export function useAcknowledgeAlarm() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (alarmId: string) => api.patch<Alarm>(`/alarms/${alarmId}/acknowledge`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["alarms"] });
        },
    });
}

/**
 * Alarm als gelöst markieren.
 */
export function useResolveAlarm() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (alarmId: string) => api.patch<Alarm>(`/alarms/${alarmId}/resolve`, {}),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["alarms"] });
        },
    });
}

/**
 * WebSocket-Hook: Echtzeit-Alarme empfangen.
 * Invalidiert automatisch die Alarm-Queries bei neuen Alarmen.
 */
export function useAlarmWebSocket(onNewAlarm?: (alarm: Alarm) => void) {
    const qc = useQueryClient();
    const { user } = useAuth();
    // Stable ref für den Callback — verhindert reconnect bei jedem Render
    const callbackRef = useRef(onNewAlarm);
    callbackRef.current = onNewAlarm;

    useEffect(() => {
        // Nur verbinden wenn User authentifiziert ist
        if (!user) return;

        const cleanup = wsManager.connect("/alarms", (data) => {
            // Alarm-Queries invalidieren damit die Liste refreshed
            qc.invalidateQueries({ queryKey: ["alarms"] });

            // Callback aufrufen (z.B. für Toast-Notification)
            if (callbackRef.current && data && typeof data === "object") {
                callbackRef.current(data as Alarm);
            }
        });

        return cleanup;
    }, [qc, user]);
}
