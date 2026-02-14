"use client";

/**
 * ConsultationList — Zeigt angeforderte und erledigte Konsilien.
 */
import { useConsultations } from "@/hooks/use-consultations";
import { Spinner } from "@/components/ui";
import {
    CONSULTATION_SPECIALTY_LABELS,
    CONSULTATION_STATUS_LABELS,
    type ConsultationStatus,
    type ConsultationSpecialty,
} from "@pdms/shared-types";

interface Props {
    patientId: string;
    statusFilter?: ConsultationStatus;
}

function statusColor(s: ConsultationStatus): string {
    switch (s) {
        case "requested": return "bg-amber-100 text-amber-800";
        case "scheduled": return "bg-blue-100 text-blue-800";
        case "completed": return "bg-emerald-100 text-emerald-800";
        case "cancelled": return "bg-red-100 text-red-800";
    }
}

function urgencyIcon(u: string): string {
    switch (u) {
        case "emergency": return "●";
        case "urgent": return "○";
        default: return "○";
    }
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("de-CH", {
        day: "2-digit", month: "2-digit", year: "2-digit",
        hour: "2-digit", minute: "2-digit",
    });
}

export function ConsultationList({ patientId, statusFilter }: Props) {
    const { data, isLoading, isError } = useConsultations(patientId, { status: statusFilter });

    if (isLoading) return <div className="flex justify-center py-8"><Spinner size="sm" /></div>;
    if (isError) return <p className="text-sm text-red-600 text-center py-4">Konsilien konnten nicht geladen werden.</p>;

    const items = data?.items ?? [];
    if (items.length === 0) {
        return <p className="text-sm text-slate-500 text-center py-4">Keine Konsilien vorhanden.</p>;
    }

    return (
        <div className="space-y-3">
            {items.map((c) => (
                <div key={c.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                            <span>{urgencyIcon(c.urgency)}</span>
                            <span className="font-medium text-slate-900">
                                {CONSULTATION_SPECIALTY_LABELS[c.specialty as ConsultationSpecialty] ?? c.specialty}
                            </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(c.status)}`}>
                            {CONSULTATION_STATUS_LABELS[c.status]}
                        </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-2">{c.question}</p>
                    {c.clinical_context && (
                        <p className="text-xs text-slate-500 mt-1">Kontext: {c.clinical_context}</p>
                    )}
                    {c.response && (
                        <div className="mt-3 bg-emerald-50 rounded-lg p-3">
                            <span className="text-xs font-medium text-emerald-700">Antwort</span>
                            <p className="text-sm text-emerald-900 mt-1">{c.response}</p>
                            {c.responded_at && (
                                <p className="text-xs text-emerald-600 mt-1">{formatDate(c.responded_at)}</p>
                            )}
                        </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2">{formatDate(c.created_at)}</p>
                </div>
            ))}
        </div>
    );
}
