"use client";

import {
    useDischargeCriteria,
    useUpdateDischargeCriteria,
} from "@/hooks/use-appointments";
import { Card, CardHeader, CardContent, CardTitle, Spinner, Badge } from "@/components/ui";

// ─── Criteria labels ──────────────────────────────────────────

const CRITERIA = [
    { key: "crp_declining", label: "CRP rückläufig" },
    { key: "crp_below_50", label: "CRP < 50 mg/L" },
    { key: "afebrile_48h", label: "Afebril ≥ 48h" },
    { key: "oral_stable_48h", label: "p.o. stabil ≥ 48h" },
    { key: "clinical_improvement", label: "Klinische Besserung" },
    { key: "aftercare_organized", label: "Nachsorge organisiert" },
] as const;

interface DischargeTrackerProps {
    patientId: string;
}

export function DischargeTracker({ patientId }: DischargeTrackerProps) {
    const { data, isLoading } = useDischargeCriteria(patientId);
    const updateMut = useUpdateDischargeCriteria(patientId);

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Spinner size="md" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const criteria = data;
    const met = criteria?.criteria_met ?? 0;
    const percent = criteria?.progress_percent ?? 0;

    const toggle = (key: string, current: boolean) => {
        updateMut.mutate({ [key]: !current });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Entlass-Kriterien</CardTitle>
                    <div className="flex items-center gap-2">
                        <Badge variant={percent === 100 ? "success" : percent >= 50 ? "warning" : "default"}>
                            {met}/6 erfüllt ({Math.round(percent)}%)
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Progress bar */}
                <div className="h-2 bg-slate-100 rounded-full mb-4">
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${percent === 100
                            ? "bg-green-500"
                            : percent >= 50
                                ? "bg-amber-400"
                                : "bg-slate-300"
                            }`}
                        style={{ width: `${percent}%` }}
                    />
                </div>

                {/* Criteria checkboxes */}
                <div className="space-y-2">
                    {CRITERIA.map(({ key, label }) => {
                        const checked = criteria ? (criteria as unknown as Record<string, unknown>)[key] === true : false;
                        return (
                            <label
                                key={key}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(key, checked)}
                                    disabled={updateMut.isPending}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span
                                    className={`text-sm ${checked ? "text-green-700 font-medium" : "text-slate-600"
                                        }`}
                                >
                                    {checked ? "✓ " : ""}
                                    {label}
                                </span>
                            </label>
                        );
                    })}
                </div>

                {/* Dates + Followup */}
                {criteria && (
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    Geplantes Entlassdatum
                                </label>
                                <input
                                    type="date"
                                    value={criteria.planned_discharge_date ?? ""}
                                    onChange={(e) =>
                                        updateMut.mutate({
                                            planned_discharge_date: e.target.value || undefined,
                                        })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">
                                    Hausarzt-Kontrolle
                                </label>
                                <input
                                    type="text"
                                    value={criteria.followup_gp ?? ""}
                                    onChange={(e) =>
                                        updateMut.mutate({ followup_gp: e.target.value || undefined })
                                    }
                                    placeholder="Hausarzt Name"
                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
