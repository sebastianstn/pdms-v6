"use client";

import { useMedications } from "@/hooks/use-medications";

interface MedicationTimelineProps {
    patientId: string | null;
}

const ROUTE_COLORS: Record<string, string> = {
    iv: "bg-red-100",
    oral: "bg-cyan-100",
    sc: "bg-amber-100",
    im: "bg-violet-100",
    topisch: "bg-emerald-100",
    inhalativ: "bg-blue-100",
    rektal: "bg-slate-100",
    sublingual: "bg-pink-100",
};

const ROUTE_LABELS: Record<string, string> = {
    iv: "i.v.",
    oral: "oral",
    sc: "s.c.",
    im: "i.m.",
    topisch: "topisch",
    inhalativ: "inhal.",
    rektal: "rektal",
    sublingual: "sublingual",
};

export function MedicationTimeline({ patientId }: MedicationTimelineProps) {
    const { data, isLoading } = useMedications(patientId ?? "", "active");
    const medications = data?.items ?? [];

    if (!patientId) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex-1">
                <h3 className="text-[13px] font-bold text-slate-900 mb-3">
                    Medikamentenplan (Zuhause)
                </h3>
                <p className="text-[11px] text-slate-500 text-center py-6">
                    Patient auswählen
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-bold text-slate-900">
                    Medikamentenplan (Zuhause)
                </h3>
                <span className="text-[10px] font-semibold text-slate-500">
                    {isLoading ? "…" : `${medications.length} aktiv`}
                </span>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : medications.length === 0 ? (
                <p className="text-[11px] text-slate-500 text-center py-6">
                    Keine aktiven Medikamente
                </p>
            ) : (
                <div className="space-y-1">
                    {medications.slice(0, 8).map((med) => (
                        <div
                            key={med.id}
                            className="flex items-center px-3 py-2.5 border-b border-slate-50 last:border-0"
                        >
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div
                                    className={`w-2.5 h-2.5 rounded mt-0.5 shrink-0 ${
                                        ROUTE_COLORS[med.route] ?? "bg-slate-100"
                                    }`}
                                />
                                <div className="min-w-0">
                                    <p className="text-[11px] font-semibold text-slate-900 leading-tight truncate">
                                        {med.name}
                                    </p>
                                    <p className="text-[9px] text-slate-500">
                                        {med.dose} {med.dose_unit} ·{" "}
                                        {ROUTE_LABELS[med.route] ?? med.route} · {med.frequency}
                                    </p>
                                </div>
                            </div>
                            <div className="shrink-0 ml-2">
                                {med.is_prn ? (
                                    <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-200">
                                        Reserve
                                    </span>
                                ) : (
                                    <span className="text-[8px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200">
                                        Aktiv
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
                {(["iv", "oral", "sc", "im"] as const).map((route) => (
                    <div key={route} className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded ${ROUTE_COLORS[route]}`} />
                        <span className="text-[8px] text-slate-500">
                            {ROUTE_LABELS[route]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
