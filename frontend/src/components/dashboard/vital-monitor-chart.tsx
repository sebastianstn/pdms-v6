"use client";

import { useState } from "react";
import { useVitals } from "@/hooks/use-vitals";
import { cn } from "@/lib/utils";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

interface VitalMonitorChartProps {
    patientId: string | null;
}

type TimeRange = "1h" | "6h" | "24h" | "7d";

const TIME_RANGES: { key: TimeRange; label: string; hours: number }[] = [
    { key: "1h", label: "1h", hours: 1 },
    { key: "6h", label: "6h", hours: 6 },
    { key: "24h", label: "24h", hours: 24 },
    { key: "7d", label: "7d", hours: 168 },
];

const CHART_VITALS = [
    { key: "spo2", label: "SpO₂", unit: "%", color: "#06b6d4" },
    { key: "heart_rate", label: "HR", unit: "bpm", color: "#ef4444" },
    { key: "systolic_bp", label: "Sys", unit: "mmHg", color: "#8b5cf6" },
    { key: "temperature", label: "Temp", unit: "°C", color: "#f59e0b" },
];

export function VitalMonitorChart({ patientId }: VitalMonitorChartProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>("24h");
    const hours = TIME_RANGES.find((r) => r.key === timeRange)!.hours;
    const { data: vitals, isLoading } = useVitals(patientId ?? "", hours);

    const chartData = (vitals ?? []).map((v) => ({
        time: new Date(v.recorded_at).toLocaleTimeString("de-CH", {
            hour: "2-digit",
            minute: "2-digit",
        }),
        spo2: v.spo2,
        heart_rate: v.heart_rate,
        systolic_bp: v.systolic_bp,
        temperature: v.temperature,
    }));

    const latest = vitals && vitals.length > 0 ? vitals[vitals.length - 1] : null;
    const statValues = [
        {
            key: "spo2",
            label: "SpO₂",
            value: latest?.spo2 != null ? `${latest.spo2}%` : "—",
            color: "#06b6d4",
        },
        {
            key: "heart_rate",
            label: "HR",
            value: latest?.heart_rate != null ? `${latest.heart_rate} bpm` : "—",
            color: "#ef4444",
        },
        {
            key: "systolic_bp",
            label: "BP",
            value:
                latest?.systolic_bp != null && latest?.diastolic_bp != null
                    ? `${latest.systolic_bp}/${latest.diastolic_bp}`
                    : "—",
            color: "#8b5cf6",
        },
        {
            key: "temperature",
            label: "Temp",
            value: latest?.temperature != null ? `${latest.temperature}°C` : "—",
            color: "#f59e0b",
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-[13px] font-bold text-slate-900">
                        Fernüberwachung
                        {!patientId && " — Kein Patient ausgewählt"}
                    </h3>
                    {patientId && (
                        <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 inline-block">
                            ● Online
                        </span>
                    )}
                </div>
                <div className="flex gap-1">
                    {TIME_RANGES.map((range) => (
                        <button
                            key={range.key}
                            onClick={() => setTimeRange(range.key)}
                            className={cn(
                                "px-2.5 py-1 rounded-md text-[9px] font-semibold transition-all",
                                timeRange === range.key
                                    ? "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white"
                                    : "bg-slate-50 text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Vital stat badges */}
            <div className="flex gap-5 mb-3">
                {statValues.map((stat) => (
                    <div key={stat.key} className="flex items-center gap-1.5">
                        <div
                            className="w-2 h-2 rounded-sm"
                            style={{ backgroundColor: stat.color }}
                        />
                        <span
                            className="text-[10px] font-semibold"
                            style={{ color: stat.color }}
                        >
                            {stat.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-900">
                            {stat.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Chart area */}
            <div className="h-[160px]">
                {!patientId ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-[11px] text-slate-400">Patient auswählen</p>
                    </div>
                ) : isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-[11px] text-slate-400">
                            Keine Vitaldaten im gewählten Zeitraum
                        </p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis
                                dataKey="time"
                                tick={{ fontSize: 8, fill: "#94a3b8" }}
                                interval="preserveStartEnd"
                            />
                            <YAxis tick={{ fontSize: 8, fill: "#94a3b8" }} />
                            <Tooltip
                                contentStyle={{
                                    fontSize: 10,
                                    borderRadius: 8,
                                    border: "1px solid #e2e8f0",
                                }}
                            />
                            {CHART_VITALS.map((v) => (
                                <Line
                                    key={v.key}
                                    type="monotone"
                                    dataKey={v.key}
                                    stroke={v.color}
                                    strokeWidth={2}
                                    dot={false}
                                    connectNulls
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
