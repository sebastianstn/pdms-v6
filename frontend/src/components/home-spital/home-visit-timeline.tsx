"use client";

import { useTodayHomeVisits } from "@/hooks/use-home-visits";
import { Card, CardHeader, CardContent, CardTitle, Badge, Spinner } from "@/components/ui";
import { HOME_VISIT_STATUS_LABELS } from "@pdms/shared-types";
import type { HomeVisit, HomeVisitStatus } from "@pdms/shared-types";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    planned: "default",
    en_route: "info",
    arrived: "warning",
    in_progress: "warning",
    completed: "success",
    cancelled: "danger",
};

const STATUS_ICON: Record<string, string> = {
    planned: "•",
    en_route: "→",
    arrived: "⌂",
    in_progress: "…",
    completed: "✓",
    cancelled: "✗",
};

function fmtTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

interface HomeVisitTimelineProps {
    /** If undefined, shows all today's visits (dashboard mode) */
    patientId?: string;
}

export function HomeVisitTimeline({ patientId }: HomeVisitTimelineProps) {
    const { data: visits, isLoading } = useTodayHomeVisits();

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <div className="flex justify-center py-8"><Spinner size="md" /></div>
                </CardContent>
            </Card>
        );
    }

    const filtered = patientId
        ? (visits ?? []).filter((v) => v.patient_id === patientId)
        : (visits ?? []);

    const pending = filtered.filter((v) => !["completed", "cancelled"].includes(v.status)).length;
    const completed = filtered.filter((v) => v.status === "completed").length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Hausbesuche heute</CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant="default">{filtered.length} gesamt</Badge>
                        {pending > 0 && <Badge variant="warning">{pending} ausstehend</Badge>}
                        {completed > 0 && <Badge variant="success">{completed} erledigt</Badge>}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {filtered.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">Keine Hausbesuche geplant.</p>
                ) : (
                    <div className="space-y-2">
                        {filtered.map((visit) => (
                            <HomeVisitRow key={visit.id} visit={visit} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function HomeVisitRow({ visit }: { visit: HomeVisit }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
            <span className="text-lg">{STATUS_ICON[visit.status] ?? "•"}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-900 truncate">
                        {visit.assigned_nurse_name ?? "Nicht zugewiesen"}
                    </span>
                    <Badge variant={STATUS_VARIANT[visit.status] ?? "default"}>
                        {HOME_VISIT_STATUS_LABELS[visit.status as HomeVisitStatus] ?? visit.status}
                    </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                    {fmtTime(visit.planned_start)}
                    {visit.planned_end && ` – ${fmtTime(visit.planned_end)}`}
                    {visit.actual_arrival && ` • Ankunft: ${fmtTime(visit.actual_arrival)}`}
                </p>
            </div>
            {visit.patient_condition && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${visit.patient_condition === "critical"
                    ? "bg-red-50 text-red-700"
                    : visit.patient_condition === "deteriorated"
                        ? "bg-amber-50 text-amber-700"
                        : visit.patient_condition === "improved"
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-50 text-slate-600"
                    }`}>
                    {visit.patient_condition}
                </span>
            )}
        </div>
    );
}
