"use client";

import { HOME_VISIT_STATUS_LABELS, type HomeVisit, type HomeVisitStatus } from "@pdms/shared-types";
import { Check, ArrowRight, X } from "lucide-react";

interface PatientInfo {
    id: string;
    first_name: string;
    last_name: string;
    address_city?: string;
}

interface HomeVisitPanelProps {
    visits: HomeVisit[];
    patients?: PatientInfo[];
}

function getStatusStyle(status: HomeVisitStatus) {
    switch (status) {
        case "completed":
            return { bg: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500 text-white", icon: "check" };
        case "en_route":
            return { bg: "bg-cyan-50 border-cyan-300 shadow-sm", dot: "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white", icon: "arrow" };
        case "arrived":
        case "in_progress":
            return { bg: "bg-cyan-50 border-cyan-300 shadow-sm", dot: "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white", icon: "dot" };
        case "cancelled":
            return { bg: "bg-slate-50 border-slate-200 opacity-50", dot: "bg-slate-300 text-white", icon: "x" };
        default:
            return { bg: "bg-slate-50 border-slate-200", dot: "bg-slate-100 text-slate-400", icon: "" };
    }
}

function formatTime(dateStr: string): string {
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr?.slice(0, 5) ?? "--:--";
        return d.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
    } catch {
        return dateStr?.slice(0, 5) ?? "--:--";
    }
}

function getTaskSummary(v: HomeVisit): string {
    if (v.status === "en_route") return HOME_VISIT_STATUS_LABELS.en_route;
    if (v.status === "arrived" || v.status === "in_progress") return HOME_VISIT_STATUS_LABELS[v.status];
    const tasks: string[] = [];
    if (v.iv_therapy_performed) tasks.push("i.v. Therapie");
    if (v.medication_administered) tasks.push("Medikation");
    if (v.vital_signs_recorded) tasks.push("Vitals");
    if (v.wound_care_performed) tasks.push("Wundversorgung");
    if (v.blood_drawn) tasks.push("Blutentnahme");
    return tasks.length > 0 ? tasks.join(" + ") : "Hausbesuch";
}

export function HomeVisitPanel({ visits, patients }: HomeVisitPanelProps) {
    const patientMap = new Map(patients?.map((p) => [p.id, p]) ?? []);
    const sorted = [...visits].sort((a, b) => a.planned_start.localeCompare(b.planned_start));
    const displayVisits = sorted.slice(0, 6);
    const completedCount = visits.filter((v) => v.status === "completed").length;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-slate-900">Hausbesuche heute</h3>
                <span className="text-[9px] font-semibold text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md">
                    {completedCount}/{visits.length} erledigt
                </span>
            </div>
            {displayVisits.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-6">
                    <p className="text-[11px] text-slate-400">Keine Hausbesuche heute</p>
                </div>
            ) : (
                <div className="space-y-2 flex-1">
                    {displayVisits.map((visit) => {
                        const style = getStatusStyle(visit.status);
                        const patient = patientMap.get(visit.patient_id);
                        const patientLabel = patient
                            ? `${patient.first_name.charAt(0)}. ${patient.last_name}`
                            : visit.assigned_nurse_name ?? "Patient";
                        const city = patient?.address_city;

                        return (
                            <div
                                key={visit.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${style.bg}`}
                            >
                                <div
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${style.dot}`}
                                >
                                    {style.icon === "check" ? <Check className="w-3 h-3" /> :
                                     style.icon === "arrow" ? <ArrowRight className="w-3 h-3" /> :
                                     style.icon === "x" ? <X className="w-3 h-3" /> :
                                     style.icon === "dot" ? <span className="w-1.5 h-1.5 rounded-full bg-current" /> :
                                     formatTime(visit.planned_start).slice(0, 2) + "h"}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p
                                        className={`text-[10px] font-semibold ${
                                            ["planned", "cancelled"].includes(visit.status)
                                                ? "text-slate-500"
                                                : "text-slate-900"
                                        }`}
                                    >
                                        {formatTime(visit.planned_start)} — {patientLabel}
                                    </p>
                                    <p
                                        className={`text-[9px] ${
                                            ["en_route", "arrived", "in_progress"].includes(visit.status)
                                                ? "text-cyan-600 font-medium"
                                                : "text-slate-400"
                                        }`}
                                    >
                                        {city ? `${city} · ` : ""}
                                        {getTaskSummary(visit)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
