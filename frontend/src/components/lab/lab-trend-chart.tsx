"use client";

/**
 * LabTrendChart — Trend chart for a single analyte with reference range shading.
 *
 * Uses Recharts LineChart. Shows value line + reference band.
 * Dots are coloured by interpretation (red/amber/green).
 * Used primarily in the Arzt-Tab for CRP trend.
 */

import { useMemo, useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ReferenceArea,
    ResponsiveContainer,
} from "recharts";
import { useLabTrend } from "@/hooks/use-lab-results";
import { Card, CardHeader, CardContent, CardTitle, Spinner } from "@/components/ui";
import { LAB_ANALYTE_LABELS } from "@pdms/shared-types";

interface Props {
    patientId: string;
    analyte: string;
    height?: number;
    limit?: number;
}

const DOT_COLOURS: Record<string, string> = {
    critical: "#dc2626",
    pathological: "#dc2626",
    borderline: "#d97706",
    normal: "#059669",
};

function formatDateShort(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" });
}

function formatDateFull(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString("de-CH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function LabTrendChart({ patientId, analyte, height = 250, limit = 20 }: Props) {
    const { data, isLoading, isError } = useLabTrend(patientId, analyte, limit);

    const chartData = useMemo(() => {
        if (!data?.points) return [];
        return data.points.map((pt) => ({
            date: formatDateShort(pt.resulted_at),
            dateFull: formatDateFull(pt.resulted_at),
            value: pt.value,
            interpretation: pt.interpretation,
            flag: pt.flag,
        }));
    }, [data]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center" style={{ height }}>
                <Spinner size="sm" />
            </div>
        );
    }

    if (isError) {
        return <p className="text-sm text-red-600 py-4 text-center">Trend konnte nicht geladen werden.</p>;
    }

    if (chartData.length === 0) {
        return <p className="text-sm text-slate-500 py-4 text-center">Keine Trend-Daten vorhanden.</p>;
    }

    const refMin = data?.ref_min ?? undefined;
    const refMax = data?.ref_max ?? undefined;

    // Calculate Y-axis domain
    const values = chartData.map((d) => d.value);
    const yMin = Math.min(...values, refMin ?? Infinity) * 0.85;
    const yMax = Math.max(...values, refMax ?? -Infinity) * 1.15;

    return (
        <ResponsiveContainer width="100%" height={height}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis
                    domain={[Math.floor(yMin), Math.ceil(yMax)]}
                    tick={{ fontSize: 11 }}
                    label={{
                        value: data?.unit ?? "",
                        angle: -90,
                        position: "insideLeft",
                        style: { fontSize: 11, fill: "#94a3b8" },
                    }}
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload;
                        return (
                            <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-2 text-xs">
                                <p className="font-medium">{d.dateFull}</p>
                                <p className="mt-1">
                                    <span className="font-bold">{d.value}</span> {data?.unit}
                                    {d.flag && <span className="ml-1 text-red-600">({d.flag})</span>}
                                </p>
                            </div>
                        );
                    }}
                />

                {/* Reference range shading */}
                {refMin != null && refMax != null && (
                    <ReferenceArea
                        y1={refMin}
                        y2={refMax}
                        fill="#059669"
                        fillOpacity={0.08}
                        strokeOpacity={0}
                    />
                )}
                {refMax != null && (
                    <ReferenceLine
                        y={refMax}
                        stroke="#059669"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                    />
                )}
                {refMin != null && (
                    <ReferenceLine
                        y={refMin}
                        stroke="#059669"
                        strokeDasharray="4 4"
                        strokeOpacity={0.5}
                    />
                )}

                <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={(props: Record<string, unknown>) => {
                        const interp = (props.payload as Record<string, unknown>)?.interpretation as string | undefined;
                        const fill = DOT_COLOURS[interp ?? ""] ?? "#3b82f6";
                        return (
                            <circle
                                key={props.key as string}
                                cx={props.cx as number}
                                cy={props.cy as number}
                                r={4}
                                fill={fill}
                                stroke="white"
                                strokeWidth={2}
                            />
                        );
                    }}
                    activeDot={{ r: 6 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

// ─── Analyte selector + chart card ─────────────────────────────

const DEFAULT_ANALYTES = ["crp", "leukocytes", "creatinine", "lactate", "hemoglobin", "potassium"];

export function LabTrendChartCard({ patientId }: { patientId: string }) {
    const [selected, setSelected] = useState("crp");

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Labor-Trend</CardTitle>
                    <div className="flex items-center gap-1 flex-wrap">
                        {DEFAULT_ANALYTES.map((a) => (
                            <button
                                key={a}
                                onClick={() => setSelected(a)}
                                className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${selected === a
                                        ? "bg-blue-600 text-white border-blue-600"
                                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                                    }`}
                            >
                                {LAB_ANALYTE_LABELS[a] ?? a}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <LabTrendChart patientId={patientId} analyte={selected} height={280} />
            </CardContent>
        </Card>
    );
}
