"use client";

/**
 * NursingDiagnosisList — Pflegediagnosen (NANDA-I basiert).
 */
import { useNursingDiagnoses } from "@/hooks/use-nursing-diagnoses";
import { Spinner } from "@/components/ui";
import type { NursingDiagnosisStatus, NursingDiagnosisPriority } from "@pdms/shared-types";

interface Props {
    patientId: string;
    statusFilter?: NursingDiagnosisStatus;
}

function statusBadge(s: NursingDiagnosisStatus): { color: string; label: string } {
    switch (s) {
        case "active": return { color: "bg-emerald-100 text-emerald-800", label: "Aktiv" };
        case "resolved": return { color: "bg-blue-100 text-blue-800", label: "Behoben" };
        case "inactive": return { color: "bg-slate-100 text-slate-600", label: "Inaktiv" };
    }
}

function priorityColor(p: NursingDiagnosisPriority): string {
    switch (p) {
        case "high": return "text-red-600";
        case "normal": return "text-amber-600";
        case "low": return "text-slate-500";
    }
}

export function NursingDiagnosisList({ patientId, statusFilter }: Props) {
    const { data, isLoading, isError } = useNursingDiagnoses(patientId, { status: statusFilter });

    if (isLoading) return <div className="flex justify-center py-8"><Spinner size="sm" /></div>;
    if (isError) return <p className="text-sm text-red-600 text-center py-4">Pflegediagnosen konnten nicht geladen werden.</p>;

    const items = data?.items ?? [];
    if (items.length === 0) {
        return <p className="text-sm text-slate-500 text-center py-4">Keine Pflegediagnosen vorhanden.</p>;
    }

    return (
        <div className="space-y-3">
            {items.map((d) => {
                const badge = statusBadge(d.status);
                return (
                    <div key={d.id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-lg ${priorityColor(d.priority)}`}>●</span>
                                    <h4 className="font-medium text-slate-900">{d.title}</h4>
                                    {d.nanda_code && (
                                        <span className="text-xs text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded">
                                            NANDA {d.nanda_code}
                                        </span>
                                    )}
                                </div>
                                {d.domain && <p className="text-xs text-slate-500 mt-0.5">Domäne: {d.domain}</p>}
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                                {badge.label}
                            </span>
                        </div>

                        {d.defining_characteristics && (
                            <div className="mt-2">
                                <span className="text-xs text-slate-500">Merkmale</span>
                                <p className="text-sm text-slate-700">{d.defining_characteristics}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                                <span className="text-xs text-slate-500">Ziele</span>
                                <p className="text-sm text-slate-700">{d.goals}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500">Massnahmen</span>
                                <p className="text-sm text-slate-700">{d.interventions}</p>
                            </div>
                        </div>

                        {d.evaluation && (
                            <div className="mt-2 bg-blue-50 rounded p-2">
                                <span className="text-xs font-medium text-blue-700">Evaluation</span>
                                <p className="text-sm text-blue-900">{d.evaluation}</p>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
