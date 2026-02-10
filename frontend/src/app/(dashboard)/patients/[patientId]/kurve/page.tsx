"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useVitals } from "@/hooks/use-vitals";
import { VitalChart } from "@/components/vitals/vital-chart";
import { AlarmList } from "@/components/vitals/alarm-list";
import { Card, CardHeader, CardContent, CardTitle, Spinner } from "@/components/ui";
import { VITAL_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";

const TIME_RANGES = [
  { label: "6h", hours: 6 },
  { label: "12h", hours: 12 },
  { label: "24h", hours: 24 },
  { label: "48h", hours: 48 },
  { label: "7d", hours: 168 },
];

const ALL_PARAMS = Object.keys(VITAL_LABELS);

export default function KurvePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [hours, setHours] = useState(24);
  const [selectedParams, setSelectedParams] = useState<string[]>(["heart_rate", "spo2"]);
  const { data: vitals, isLoading, isError } = useVitals(patientId, hours);

  function toggleParam(param: string) {
    setSelectedParams((prev) =>
      prev.includes(param) ? prev.filter((p) => p !== param) : [...prev, param]
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 pt-4">
            {/* Time Range */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500 mr-2">Zeitraum:</span>
              {TIME_RANGES.map((range) => (
                <button
                  key={range.hours}
                  onClick={() => setHours(range.hours)}
                  className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${hours === range.hours
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-slate-200" />

            {/* Parameter Toggle */}
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-xs text-slate-500 mr-2">Parameter:</span>
              {ALL_PARAMS.map((param) => {
                const meta = VITAL_LABELS[param];
                const isActive = selectedParams.includes(param);
                return (
                  <button
                    key={param}
                    onClick={() => toggleParam(param)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${isActive
                      ? "border-transparent text-white"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                      }`}
                    style={isActive ? { backgroundColor: meta.color } : undefined}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Vitalkurve – letzte {hours < 48 ? `${hours}h` : `${hours / 24}d`}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <p className="text-sm text-red-600 py-8 text-center">
              Vitaldaten konnten nicht geladen werden.
            </p>
          ) : (
            <VitalChart
              data={vitals ?? []}
              parameters={selectedParams}
              height={350}
            />
          )}
        </CardContent>
      </Card>

      {/* Patient-spezifische Alarme */}
      <Card>
        <CardHeader>
          <CardTitle>Aktive Alarme</CardTitle>
        </CardHeader>
        <CardContent>
          <AlarmList patientId={patientId} compact />
        </CardContent>
      </Card>

      {/* Latest Values Table */}
      {vitals && vitals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Letzter Messwert</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {ALL_PARAMS.map((param) => {
                const meta = VITAL_LABELS[param];
                const latest = [...vitals]
                  .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
                  .find((v) => (v as unknown as Record<string, unknown>)[param] != null);
                const value = latest ? (latest as unknown as Record<string, unknown>)[param] : null;

                return (
                  <div key={param} className="text-center p-3 rounded-lg bg-slate-50">
                    <p className="text-xs text-slate-500">{meta.label}</p>
                    <p className="text-2xl font-bold mt-1" style={{ color: meta.color }}>
                      {value != null ? String(value) : "—"}
                    </p>
                    <p className="text-xs text-slate-400">{meta.unit}</p>
                    {latest && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDateTime(latest.recorded_at)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
