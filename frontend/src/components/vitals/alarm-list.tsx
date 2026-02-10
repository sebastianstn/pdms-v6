"use client";

import { useAlarms, useAcknowledgeAlarm, useResolveAlarm, type Alarm } from "@/hooks/use-alarms";
import { Card, CardHeader, CardContent, CardTitle, Badge, Spinner } from "@/components/ui";
import { AlarmBadge } from "@/components/vitals/alarm-badge";
import { VITAL_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

interface AlarmListProps {
    /** Optionaler Patient-Filter */
    patientId?: string;
    /** Maximale Anzahl Alarme */
    limit?: number;
    /** Kompakte Ansicht (ohne Actions) */
    compact?: boolean;
}

export function AlarmList({ patientId, limit, compact = false }: AlarmListProps) {
    const { data: alarms, isLoading, error } = useAlarms("active", patientId);
    const acknowledgeMutation = useAcknowledgeAlarm();
    const resolveMutation = useResolveAlarm();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return (
            <p className="text-sm text-red-500 py-4 text-center">
                Fehler beim Laden der Alarme
            </p>
        );
    }

    const items = limit ? alarms?.items?.slice(0, limit) : alarms?.items;

    if (!items?.length) {
        return (
            <p className="text-sm text-slate-400 py-8 text-center">
                Keine aktiven Alarme 🎉
            </p>
        );
    }

    return (
        <div className="space-y-2">
            {items.map((alarm) => (
                <AlarmRow
                    key={alarm.id}
                    alarm={alarm}
                    compact={compact}
                    onAcknowledge={() => acknowledgeMutation.mutate(alarm.id)}
                    onResolve={() => resolveMutation.mutate(alarm.id)}
                    isAcknowledging={acknowledgeMutation.isPending}
                    isResolving={resolveMutation.isPending}
                />
            ))}
        </div>
    );
}

interface AlarmRowProps {
    alarm: Alarm;
    compact: boolean;
    onAcknowledge: () => void;
    onResolve: () => void;
    isAcknowledging: boolean;
    isResolving: boolean;
}

function AlarmRow({ alarm, compact, onAcknowledge, onResolve, isAcknowledging, isResolving }: AlarmRowProps) {
    const label = VITAL_LABELS[alarm.parameter]?.label ?? alarm.parameter;
    const unit = VITAL_LABELS[alarm.parameter]?.unit ?? "";

    return (
        <div
            className={`flex items-center gap-3 p-3 rounded-lg border ${alarm.severity === "critical"
                    ? "border-red-200 bg-red-50/50"
                    : "border-amber-200 bg-amber-50/50"
                }`}
        >
            <AlarmBadge
                severity={alarm.severity}
                label={alarm.severity === "critical" ? "Kritisch" : "Warnung"}
            />

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                    {label}: {alarm.value} {unit}
                </p>
                <p className="text-xs text-slate-500">
                    {formatDateTime(alarm.triggered_at)}
                    {alarm.threshold_min != null && alarm.threshold_max != null && (
                        <span className="ml-2">
                            (Grenze: {alarm.threshold_min}–{alarm.threshold_max} {unit})
                        </span>
                    )}
                </p>
            </div>

            {!compact && (
                <div className="flex gap-1.5 shrink-0">
                    <button
                        onClick={onAcknowledge}
                        disabled={isAcknowledging}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors disabled:opacity-50"
                        title="Alarm quittieren"
                    >
                        Quittieren
                    </button>
                    <button
                        onClick={onResolve}
                        disabled={isResolving}
                        className="px-2.5 py-1 text-xs font-medium rounded-md bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
                        title="Alarm als gelöst markieren"
                    >
                        Lösen
                    </button>
                </div>
            )}
        </div>
    );
}
