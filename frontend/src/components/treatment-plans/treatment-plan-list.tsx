"use client";

/**
 * TreatmentPlanList — Zeigt aktive und vergangene Therapiepläne.
 */

import { useTreatmentPlans, useCompletePlanItem } from "@/hooks/use-treatment-plans";
import { Card, CardHeader, CardContent, CardTitle, Spinner } from "@/components/ui";
import {
    TREATMENT_PLAN_STATUS_LABELS,
    TREATMENT_PLAN_PRIORITY_LABELS,
    type TreatmentPlanStatus,
    type TreatmentPlanPriority,
} from "@pdms/shared-types";

interface Props {
    patientId: string;
    statusFilter?: TreatmentPlanStatus;
    onEdit?: (planId: string) => void;
}

function statusColor(status: TreatmentPlanStatus): string {
    switch (status) {
        case "active": return "bg-emerald-100 text-emerald-800";
        case "completed": return "bg-blue-100 text-blue-800";
        case "suspended": return "bg-amber-100 text-amber-800";
        case "cancelled": return "bg-red-100 text-red-800";
    }
}

function priorityBadge(p: TreatmentPlanPriority): string {
    switch (p) {
        case "urgent": return "bg-red-100 text-red-700";
        case "high": return "bg-amber-100 text-amber-700";
        case "normal": return "bg-slate-100 text-slate-700";
        case "low": return "bg-slate-50 text-slate-500";
    }
}

export function TreatmentPlanList({ patientId, statusFilter, onEdit }: Props) {
    const { data, isLoading, isError } = useTreatmentPlans(patientId, { status: statusFilter });
    const completeMutation = useCompletePlanItem();

    if (isLoading) return <div className="flex justify-center py-8"><Spinner size="sm" /></div>;
    if (isError) return <p className="text-sm text-red-600 text-center py-4">Therapiepläne konnten nicht geladen werden.</p>;

    const plans = data?.items ?? [];
    if (plans.length === 0) {
        return <p className="text-sm text-slate-500 text-center py-4">Keine Therapiepläne vorhanden.</p>;
    }

    return (
        <div className="space-y-4">
            {plans.map((plan) => (
                <div key={plan.id} className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                        <div>
                            <h4 className="font-medium text-slate-900">{plan.title}</h4>
                            <p className="text-sm text-slate-500">{plan.diagnosis} {plan.icd_code && <span className="text-xs text-slate-500">({plan.icd_code})</span>}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityBadge(plan.priority)}`}>
                                {TREATMENT_PLAN_PRIORITY_LABELS[plan.priority]}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(plan.status)}`}>
                                {TREATMENT_PLAN_STATUS_LABELS[plan.status]}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                        <div>
                            <span className="text-xs text-slate-500">Ziele</span>
                            <p className="text-slate-700">{plan.goals}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500">Massnahmen</span>
                            <p className="text-slate-700">{plan.interventions}</p>
                        </div>
                    </div>

                    {/* Items / Checkliste */}
                    {plan.items && plan.items.length > 0 && (
                        <div className="mt-3 border-t border-slate-100 pt-3">
                            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Behandlungsschritte</span>
                            <ul className="mt-2 space-y-1.5">
                                {plan.items.map((item) => (
                                    <li key={item.id} className="flex items-center gap-2 text-sm">
                                        <button
                                            onClick={() => !item.is_completed && completeMutation.mutate(item.id)}
                                            disabled={item.is_completed || completeMutation.isPending}
                                            className={`w-5 h-5 rounded border flex items-center justify-center text-xs transition-colors ${item.is_completed
                                                    ? "bg-emerald-100 border-emerald-300 text-emerald-600"
                                                    : "border-slate-300 hover:border-blue-400 text-transparent hover:text-blue-400"
                                                }`}
                                        >
                                            ✓
                                        </button>
                                        <span className={item.is_completed ? "line-through text-slate-500" : "text-slate-700"}>
                                            {item.description}
                                        </span>
                                        {item.frequency && (
                                            <span className="text-xs text-slate-500 ml-auto">{item.frequency}</span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Aktionen */}
                    {onEdit && plan.status === "active" && (
                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={() => onEdit(plan.id)}
                                className="text-xs text-blue-600 hover:text-blue-800"
                            >
                                Bearbeiten
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export function TreatmentPlanCard({ patientId }: { patientId: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Therapiepläne</CardTitle>
            </CardHeader>
            <CardContent>
                <TreatmentPlanList patientId={patientId} statusFilter="active" />
            </CardContent>
        </Card>
    );
}
