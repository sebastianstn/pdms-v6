"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface VitalMonitorChartProps {
  patientId: string | null;
}

type TimeRange = "1h" | "6h" | "24h" | "7d" | "all";

// Demo-Daten für die Darstellung
function generateDemoData(hours: number) {
  const now = Date.now();
  const points = [];
  const count = Math.min(hours * 4, 96);
  for (let i = count; i >= 0; i--) {
    const time = new Date(now - i * (hours * 60 * 60 * 1000) / count);
    points.push({
      time: time.toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" }),
      spo2: 93 + Math.random() * 5,
      hr: 70 + Math.random() * 25,
      systolic: 120 + Math.random() * 20,
      diastolic: 75 + Math.random() * 15,
      temp: 36.8 + Math.random() * 1.2,
    });
  }
  return points;
}

const TIME_RANGES: { key: TimeRange; label: string; hours: number }[] = [
  { key: "1h", label: "1h", hours: 1 },
  { key: "6h", label: "6h", hours: 6 },
  { key: "24h", label: "24h", hours: 24 },
  { key: "7d", label: "7d", hours: 168 },
  { key: "all", label: "All", hours: 720 },
];

const VITALS = [
  { key: "spo2", label: "SpO₂", color: "#06b6d4", value: "96%", unit: "%" },
  { key: "hr", label: "HR", color: "#ef4444", value: "82 bpm", unit: "bpm" },
  { key: "bp", label: "BP", color: "#8b5cf6", value: "128/82", unit: "mmHg" },
  { key: "temp", label: "Temp", color: "#f59e0b", value: "37.4°C", unit: "°C" },
];

export function VitalMonitorChart({ patientId }: VitalMonitorChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const selectedRange = TIME_RANGES.find((r) => r.key === timeRange)!;
  const data = useMemo(() => generateDemoData(selectedRange.hours), [selectedRange.hours]);

  // SVG Chart berechnen
  const chartWidth = 480;
  const chartHeight = 160;
  const padding = { top: 10, right: 10, bottom: 20, left: 0 };
  const innerW = chartWidth - padding.left - padding.right;
  const innerH = chartHeight - padding.top - padding.bottom;

  function toPath(values: number[], min: number, max: number) {
    const range = max - min || 1;
    return values
      .map((v, i) => {
        const x = padding.left + (i / (values.length - 1)) * innerW;
        const y = padding.top + (1 - (v - min) / range) * innerH;
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }

  function toAreaPath(values: number[], min: number, max: number) {
    const line = toPath(values, min, max);
    const lastX = padding.left + innerW;
    const firstX = padding.left;
    const bottom = padding.top + innerH;
    return `${line} L${lastX},${bottom} L${firstX},${bottom} Z`;
  }

  const spo2Values = data.map((d) => d.spo2);
  const hrValues = data.map((d) => d.hr);

  const spo2Path = toPath(spo2Values, 60, 100);
  const spo2Area = toAreaPath(spo2Values, 60, 100);
  const hrPath = toPath(hrValues, 60, 100);

  // X-Achsen-Labels
  const xLabels = [
    data[0]?.time || "",
    data[Math.floor(data.length * 0.25)]?.time || "",
    data[Math.floor(data.length * 0.5)]?.time || "",
    data[Math.floor(data.length * 0.75)]?.time || "",
    "Jetzt",
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-[13px] font-bold text-slate-900">
            Fernüberwachung{patientId ? "" : " — Kein Patient ausgewählt"}
          </h3>
          {patientId && (
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                ● Online
              </span>
            </div>
          )}
        </div>

        {/* Time Range Pills */}
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

      {/* Vital Labels Row */}
      <div className="flex gap-5 mb-3">
        {VITALS.map((vital) => (
          <div key={vital.key} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ backgroundColor: vital.color }} />
            <span className="text-[10px] font-semibold" style={{ color: vital.color }}>
              {vital.label}
            </span>
            <span className="text-[10px] font-bold text-slate-900">{vital.value}</span>
          </div>
        ))}
      </div>

      {/* SVG Chart */}
      <div className="relative">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="spo2Grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>
            <linearGradient id="spo2AreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="hrGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#f87171" />
            </linearGradient>
          </defs>

          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + pct * innerH;
            return (
              <line key={i} x1={padding.left} y1={y} x2={chartWidth - padding.right} y2={y}
                stroke="#f1f5f9" strokeWidth="1" />
            );
          })}

          {/* Y-Axis Labels */}
          {[100, 90, 80, 70, 60].map((val, i) => (
            <text key={i} x={chartWidth - padding.right + 4} y={padding.top + i * (innerH / 4) + 3}
              fontSize="7" fill="#cbd5e1" textAnchor="start">
              {val}
            </text>
          ))}

          {/* SpO2 Area */}
          <path d={spo2Area} fill="url(#spo2AreaGrad)" />

          {/* SpO2 Line */}
          <path d={spo2Path} fill="none" stroke="url(#spo2Grad)" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* HR Line (dashed) */}
          <path d={hrPath} fill="none" stroke="url(#hrGrad)" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 3" />

          {/* Current Dots */}
          <circle cx={chartWidth - padding.right} cy={padding.top + (1 - (spo2Values[spo2Values.length - 1] - 60) / 40) * innerH}
            r="4" fill="white" stroke="#06b6d4" strokeWidth="2.5" />
          <circle cx={chartWidth - padding.right} cy={padding.top + (1 - (hrValues[hrValues.length - 1] - 60) / 40) * innerH}
            r="3.5" fill="white" stroke="#ef4444" strokeWidth="2" />

          {/* X-Axis Labels */}
          {xLabels.map((label, i) => (
            <text key={i} x={padding.left + i * (innerW / 4)} y={chartHeight - 2}
              fontSize="7" fill="#cbd5e1">
              {label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
