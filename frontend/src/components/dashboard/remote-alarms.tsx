"use client";

import { useAlarms, useAcknowledgeAlarm } from "@/hooks/use-alarms";
import { VITAL_LABELS } from "@/lib/constants";

function timeAgo(isoDate: string): string {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "gerade eben";
    if (mins < 60) return `vor ${mins} Min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `vor ${hours}h`;
    return `vor ${Math.floor(hours / 24)}d`;
}

export function RemoteAlarms() {
    const { data, isLoading } = useAlarms("active");
    const acknowledge = useAcknowledgeAlarm();

    const alarms = data?.items ?? [];
    const totalCount = data?.total ?? alarms.length;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-slate-900">Remote-Alarme</h3>
                <span className="text-[9px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                    {isLoading ? "…" : `${totalCount} aktiv`}
                </span>
            </div>
            {isLoading ? (
                <div className="flex items-center justify-center py-4">
                    <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : alarms.length === 0 ? (
                <div className="flex items-center justify-center py-4">
                    <p className="text-[11px] text-emerald-600 font-medium">Keine aktiven Alarme</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {alarms.slice(0, 5).map((alarm) => {
                        const label = VITAL_LABELS[alarm.parameter]?.label ?? alarm.parameter;
                        const unit = VITAL_LABELS[alarm.parameter]?.unit ?? "";
                        const message = `${label} ${alarm.value}${unit ? " " + unit : ""}`;

                        return (
                            <div
                                key={alarm.id}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${
                                    alarm.severity === "critical"
                                        ? "bg-red-50 border-red-200"
                                        : "bg-amber-50 border-amber-200"
                                }`}
                            >
                                <div
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                        alarm.severity === "critical" ? "bg-red-500" : "bg-amber-500"
                                    }`}
                                >
                                    {alarm.severity === "critical" && (
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={`text-[11px] font-semibold ${
                                            alarm.severity === "critical" ? "text-red-700" : "text-amber-800"
                                        }`}
                                    >
                                        {message}
                                    </p>
                                </div>
                                <span className="text-[9px] text-slate-500 shrink-0">
                                    {timeAgo(alarm.triggered_at)}
                                </span>
                                <button
                                    onClick={() => acknowledge.mutate(alarm.id)}
                                    disabled={acknowledge.isPending}
                                    className={`text-[9px] font-semibold text-white px-3 py-1 rounded-md shrink-0 disabled:opacity-50 ${
                                        alarm.severity === "critical"
                                            ? "bg-gradient-to-r from-red-500 to-red-600"
                                            : "bg-gradient-to-r from-amber-500 to-amber-600"
                                    }`}
                                >
                                    Bestätigen
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
