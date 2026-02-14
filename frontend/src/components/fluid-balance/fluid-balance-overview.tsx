"use client";

/**
 * FluidBalanceOverview — 24h intake/output balance card.
 *
 * Shows:
 * - Total intake vs output with visual bar
 * - Balance (+/−) with colour coding
 * - Breakdown by category
 *
 * Used in Kurve-Tab and Pflege-Tab.
 */

import { useState } from "react";
import { useFluidBalanceSummary } from "@/hooks/use-fluid-balance";
import { useUserPermissions } from "@/hooks/use-rbac";
import { FluidEntryForm } from "@/components/fluid-balance/fluid-entry-form";
import { Card, CardHeader, CardContent, CardTitle, Spinner } from "@/components/ui";
import { FLUID_CATEGORY_LABELS } from "@pdms/shared-types";

interface Props {
    patientId: string;
    enableEntryModal?: boolean;
}

const HOURS_OPTIONS = [
    { label: "12h", value: 12 },
    { label: "24h", value: 24 },
    { label: "48h", value: 48 },
];

function formatMl(ml: number): string {
    return `${ml >= 0 ? "+" : ""}${Math.round(ml)} mL`;
}

function balanceColor(balance: number): string {
    const abs = Math.abs(balance);
    if (abs > 1500) return "text-red-600 bg-red-50";
    if (abs > 1000) return "text-amber-600 bg-amber-50";
    return "text-emerald-600 bg-emerald-50";
}

export function FluidBalanceOverview({ patientId, enableEntryModal = false }: Props) {
    const [hours, setHours] = useState(24);
    const [showEntryModal, setShowEntryModal] = useState(false);
    const { data, isLoading, isError } = useFluidBalanceSummary(patientId, hours);
    const { canWrite } = useUserPermissions();

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Spinner size="sm" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isError) {
        return (
            <Card>
                <CardContent>
                    <p className="text-sm text-red-600 py-4 text-center">I/O-Bilanz konnte nicht geladen werden.</p>
                </CardContent>
            </Card>
        );
    }

    const totalIntake = data?.total_intake_ml ?? 0;
    const totalOutput = data?.total_output_ml ?? 0;
    const balance = data?.balance_ml ?? 0;
    const maxVolume = Math.max(totalIntake, totalOutput, 1);
    const intakePercent = (totalIntake / maxVolume) * 100;
    const outputPercent = (totalOutput / maxVolume) * 100;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>I/O-Bilanz</CardTitle>
                    <div className="flex items-center gap-2">
                        {enableEntryModal && canWrite("I/O-Bilanz") && (
                            <button
                                onClick={() => setShowEntryModal(true)}
                                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                                + Bilanz-Eintrag
                            </button>
                        )}
                        {HOURS_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setHours(opt.value)}
                                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${hours === opt.value
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Balance Hero Number */}
                <div className="flex items-center justify-center mb-6">
                    <div className={`text-center px-6 py-3 rounded-xl ${balanceColor(balance)}`}>
                        <p className="text-xs font-medium uppercase tracking-wide opacity-70">Bilanz {hours}h</p>
                        <p className="text-3xl font-bold mt-1">{formatMl(balance)}</p>
                    </div>
                </div>

                {/* Intake / Output bars */}
                <div className="space-y-3">
                    {/* Intake */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-blue-600">Einfuhr</span>
                            <span className="text-sm font-bold text-blue-700">{Math.round(totalIntake)} mL</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                style={{ width: `${intakePercent}%` }}
                            />
                        </div>
                    </div>

                    {/* Output */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-amber-600">Ausfuhr</span>
                            <span className="text-sm font-bold text-amber-700">{Math.round(totalOutput)} mL</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                                style={{ width: `${outputPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Category Breakdown */}
                {data && (data.entry_count > 0) && (
                    <div className="mt-5 grid grid-cols-2 gap-4">
                        {/* Intake categories */}
                        {Object.keys(data.intake_by_category).length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Einfuhr</h4>
                                <div className="space-y-1">
                                    {Object.entries(data.intake_by_category).map(([cat, ml]) => (
                                        <div key={cat} className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600">{FLUID_CATEGORY_LABELS[cat] ?? cat}</span>
                                            <span className="font-medium text-blue-600">{Math.round(ml)} mL</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Output categories */}
                        {Object.keys(data.output_by_category).length > 0 && (
                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Ausfuhr</h4>
                                <div className="space-y-1">
                                    {Object.entries(data.output_by_category).map(([cat, ml]) => (
                                        <div key={cat} className="flex items-center justify-between text-xs">
                                            <span className="text-slate-600">{FLUID_CATEGORY_LABELS[cat] ?? cat}</span>
                                            <span className="font-medium text-amber-600">{Math.round(ml)} mL</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {data?.entry_count === 0 && (
                    <p className="text-sm text-slate-500 text-center mt-4">Keine Einträge in den letzten {hours}h.</p>
                )}
            </CardContent>

            {showEntryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40"
                        onClick={() => setShowEntryModal(false)}
                        aria-hidden="true"
                    />
                    <div className="relative z-10 w-full max-w-2xl">
                        <FluidEntryForm
                            patientId={patientId}
                            onSuccess={() => setShowEntryModal(false)}
                            onCancel={() => setShowEntryModal(false)}
                        />
                    </div>
                </div>
            )}
        </Card>
    );
}
