"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { VITAL_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

interface VitalDataPoint {
  recorded_at: string;
  heart_rate?: number;
  systolic_bp?: number;
  diastolic_bp?: number;
  spo2?: number;
  temperature?: number;
  respiratory_rate?: number;
}

interface VitalChartProps {
  data: VitalDataPoint[];
  parameters?: string[];
  height?: number;
}

function formatXAxis(value: string) {
  try {
    const d = new Date(value);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  } catch {
    return value;
  }
}

interface TooltipPayloadEntry {
  dataKey: string;
  value: number;
  color: string;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-medium text-slate-700 mb-1">{formatDateTime(label ?? "")}</p>
      {payload.map((entry: TooltipPayloadEntry) => {
        const meta = VITAL_LABELS[entry.dataKey];
        return (
          <p key={entry.dataKey} style={{ color: entry.color }}>
            {meta?.label ?? entry.dataKey}: {entry.value} {meta?.unit ?? ""}
          </p>
        );
      })}
    </div>
  );
}

export function VitalChart({
  data,
  parameters = ["heart_rate", "spo2"],
  height = 300,
}: VitalChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-slate-500 text-sm"
        style={{ height }}
      >
        Keine Vitaldaten vorhanden
      </div>
    );
  }

  // Sort by time ascending
  const sorted = [...data].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  return (
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={height}>
        <LineChart data={sorted} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="recorded_at"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            stroke="#cbd5e1"
          />
          <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} stroke="#cbd5e1" />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value: string) => VITAL_LABELS[value]?.label ?? value}
            wrapperStyle={{ fontSize: 12 }}
          />
          {parameters.map((param) => {
            const meta = VITAL_LABELS[param];
            return (
              <Line
                key={param}
                type="monotone"
                dataKey={param}
                stroke={meta?.color ?? "#6366f1"}
                strokeWidth={2}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
