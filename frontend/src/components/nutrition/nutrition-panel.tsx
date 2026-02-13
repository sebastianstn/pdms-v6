"use client";

/**
 * NutritionPanel — Ernährungsverordnungen + Screenings.
 */
import { useNutritionOrders, useNutritionScreenings } from "@/hooks/use-nutrition";
import { Card, CardHeader, CardContent, CardTitle, Spinner } from "@/components/ui";
import { DIET_TYPE_LABELS, type DietType } from "@pdms/shared-types";
import { useState } from "react";

interface Props {
    patientId: string;
}

function statusBadge(s: string): { color: string; label: string } {
    switch (s) {
        case "active": return { color: "bg-emerald-100 text-emerald-800", label: "Aktiv" };
        case "completed": return { color: "bg-blue-100 text-blue-800", label: "Beendet" };
        case "cancelled": return { color: "bg-red-100 text-red-800", label: "Abgebrochen" };
        default: return { color: "bg-slate-100 text-slate-600", label: s };
    }
}

function riskColor(level: string): string {
    switch (level) {
        case "high": return "text-red-600 bg-red-50";
        case "medium": return "text-amber-600 bg-amber-50";
        case "low": return "text-emerald-600 bg-emerald-50";
        default: return "text-slate-600 bg-slate-50";
    }
}

export function NutritionPanel({ patientId }: Props) {
    const [tab, setTab] = useState<"orders" | "screenings">("orders");
    const { data: ordersData, isLoading: ordersLoading } = useNutritionOrders(patientId);
    const { data: screeningsData, isLoading: screeningsLoading } = useNutritionScreenings(patientId);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ernährung</CardTitle>
                <div className="flex gap-1 mt-2">
                    {(["orders", "screenings"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${tab === t ? "bg-blue-100 text-blue-700" : "text-slate-500 hover:bg-slate-100"
                                }`}
                        >
                            {t === "orders" ? "Verordnungen" : "Screening"}
                        </button>
                    ))}
                </div>
            </CardHeader>
            <CardContent>
                {tab === "orders" && (
                    <>
                        {ordersLoading ? (
                            <div className="flex justify-center py-6"><Spinner size="sm" /></div>
                        ) : (ordersData?.items ?? []).length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">Keine Ernährungsverordnungen.</p>
                        ) : (
                            <div className="space-y-3">
                                {(ordersData?.items ?? []).map((o) => {
                                    const badge = statusBadge(o.status);
                                    return (
                                        <div key={o.id} className="border border-slate-200 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-slate-900">
                                                    {DIET_TYPE_LABELS[o.diet_type as DietType] ?? o.diet_type}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-2 text-sm">
                                                {o.caloric_target && (
                                                    <div>
                                                        <span className="text-xs text-slate-400">Kalorien</span>
                                                        <p className="font-medium">{o.caloric_target} kcal</p>
                                                    </div>
                                                )}
                                                {o.protein_target && (
                                                    <div>
                                                        <span className="text-xs text-slate-400">Protein</span>
                                                        <p className="font-medium">{o.protein_target} g</p>
                                                    </div>
                                                )}
                                                {o.fluid_target && (
                                                    <div>
                                                        <span className="text-xs text-slate-400">Flüssigkeit</span>
                                                        <p className="font-medium">{o.fluid_target} ml</p>
                                                    </div>
                                                )}
                                            </div>
                                            {o.restrictions && (
                                                <p className="text-xs text-amber-600 mt-2">{o.restrictions}</p>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                {tab === "screenings" && (
                    <>
                        {screeningsLoading ? (
                            <div className="flex justify-center py-6"><Spinner size="sm" /></div>
                        ) : (screeningsData?.items ?? []).length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">Keine Screenings durchgeführt.</p>
                        ) : (
                            <div className="space-y-3">
                                {(screeningsData?.items ?? []).map((s) => (
                                    <div key={s.id} className="border border-slate-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-900 uppercase text-sm">
                                                {s.screening_type}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${riskColor(s.risk_level)}`}>
                                                Risiko: {s.risk_level}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center gap-4">
                                            <div>
                                                <span className="text-xs text-slate-400">Score</span>
                                                <p className="text-lg font-bold text-slate-900">{s.total_score}</p>
                                            </div>
                                            <p className="text-xs text-slate-400">
                                                {new Date(s.created_at).toLocaleDateString("de-CH")}
                                            </p>
                                        </div>
                                        {s.notes && <p className="text-xs text-slate-500 mt-1">{s.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
