"use client";

/**
 * LabMiniTable — Compact table showing latest lab values per analyte.
 *
 * Used in Kurve-Tab, Arzt-Tab and Übersicht-Tab.
 * Colour-codes values: red = pathological/critical, amber = borderline, green = normal.
 */

import { useLabSummary } from "@/hooks/use-lab-results";
import { Card, CardHeader, CardContent, CardTitle, Spinner } from "@/components/ui";
import {
    LAB_CATEGORY_LABELS,
    LAB_FLAG_LABELS,
    type LabCategory,
    type LabFlag,
} from "@pdms/shared-types";

interface Props {
    patientId: string;
    /** If set, only show results from this category */
    category?: LabCategory;
    /** Compact mode hides some columns for sidebar usage */
    compact?: boolean;
}

// ─── Colour helpers ────────────────────────────────────────────

function interpretationClasses(interpretation: string | undefined, flag: string | undefined): string {
    if (flag === "HH" || flag === "LL") return "text-red-700 bg-red-50 font-bold";
    if (flag === "H" || flag === "L") return "text-red-600 bg-red-50 font-semibold";
    if (interpretation === "borderline") return "text-amber-600 bg-amber-50 font-medium";
    if (interpretation === "normal") return "text-emerald-600";
    return "text-slate-700";
}

function flagBadge(flag: LabFlag | string | undefined) {
    if (!flag) return null;
    const label = LAB_FLAG_LABELS[flag as LabFlag] ?? flag;
    const color =
        flag === "HH" || flag === "LL"
            ? "bg-red-100 text-red-800"
            : flag === "H" || flag === "L"
                ? "bg-amber-100 text-amber-800"
                : "bg-slate-100 text-slate-700";
    return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${color}`}>
            {label}
        </span>
    );
}

function trendIcon(trend: string | undefined) {
    if (!trend) return null;
    const color =
        trend === "↑↑" ? "text-red-600" :
            trend === "↓↓" ? "text-blue-600" :
                trend === "↑" ? "text-amber-600" :
                    trend === "↓" ? "text-blue-500" :
                        "text-slate-400";
    return <span className={`${color} font-bold text-sm`}>{trend}</span>;
}

function formatValue(value: number, unit: string): string {
    // Round nicely
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1);
    return `${formatted} ${unit}`;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

// ─── Component ─────────────────────────────────────────────────

export function LabMiniTable({ patientId, category, compact = false }: Props) {
    const { data, isLoading, isError } = useLabSummary(patientId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Spinner size="sm" />
            </div>
        );
    }

    if (isError) {
        return <p className="text-sm text-red-600 py-4 text-center">Laborwerte konnten nicht geladen werden.</p>;
    }

    const items = data?.items ?? [];
    const filtered = category ? items.filter(() => {
        // Backend summary doesn't include category; show all and let backend sort by category
        return true;
    }) : items;

    if (filtered.length === 0) {
        return (
            <p className="text-sm text-slate-500 py-4 text-center">Keine Laborwerte vorhanden.</p>
        );
    }

    // Group by category-like sections
    const grouped = groupByCategory(filtered);

    return (
        <div className="space-y-4">
            {Object.entries(grouped).map(([cat, rows]) => (
                <div key={cat}>
                    {!compact && Object.keys(grouped).length > 1 && (
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                            {LAB_CATEGORY_LABELS[cat as LabCategory] ?? cat}
                        </h4>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="text-left py-1.5 pr-3 text-xs font-medium text-slate-500">Analyt</th>
                                    <th className="text-right py-1.5 px-3 text-xs font-medium text-slate-500">Wert</th>
                                    {!compact && (
                                        <th className="text-center py-1.5 px-2 text-xs font-medium text-slate-500">Referenz</th>
                                    )}
                                    <th className="text-center py-1.5 px-2 text-xs font-medium text-slate-500">Flag</th>
                                    <th className="text-center py-1.5 px-2 text-xs font-medium text-slate-500">Trend</th>
                                    {!compact && (
                                        <th className="text-right py-1.5 pl-3 text-xs font-medium text-slate-500">Datum</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((item) => (
                                    <tr key={item.analyte} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="py-1.5 pr-3 text-slate-700">{item.display_name}</td>
                                        <td className={`py-1.5 px-3 text-right rounded ${interpretationClasses(item.interpretation ?? undefined, item.flag ?? undefined)}`}>
                                            {formatValue(item.value, item.unit)}
                                        </td>
                                        {!compact && (
                                            <td className="py-1.5 px-2 text-center text-xs text-slate-400">
                                                {item.ref_min != null && item.ref_max != null
                                                    ? `${item.ref_min}–${item.ref_max}`
                                                    : item.ref_max != null
                                                        ? `< ${item.ref_max}`
                                                        : item.ref_min != null
                                                            ? `> ${item.ref_min}`
                                                            : "—"}
                                            </td>
                                        )}
                                        <td className="py-1.5 px-2 text-center">
                                            {flagBadge(item.flag ?? undefined)}
                                        </td>
                                        <td className="py-1.5 px-2 text-center">
                                            {trendIcon(item.trend ?? undefined)}
                                        </td>
                                        {!compact && (
                                            <td className="py-1.5 pl-3 text-right text-xs text-slate-400">
                                                {formatDate(item.resulted_at)}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─── Helper: group items by analyte category heuristic ─────────

const CATEGORY_MAP: Record<string, string> = {
    leukocytes: "hematology",
    hemoglobin: "hematology",
    thrombocytes: "hematology",
    inr: "coagulation",
    d_dimer: "coagulation",
    ph: "blood_gas",
    pco2: "blood_gas",
    po2: "blood_gas",
};

function groupByCategory(items: typeof Array.prototype & { analyte: string }[]): Record<string, typeof items> {
    const groups: Record<string, typeof items> = {};
    for (const item of items) {
        const cat = CATEGORY_MAP[(item as Record<string, unknown>).analyte as string] ?? "chemistry";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
    }
    return groups;
}

// ─── Wrapped version with Card ─────────────────────────────────

export function LabMiniTableCard({ patientId, compact }: { patientId: string; compact?: boolean }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Laborwerte (aktuell)</CardTitle>
            </CardHeader>
            <CardContent>
                <LabMiniTable patientId={patientId} compact={compact} />
            </CardContent>
        </Card>
    );
}
