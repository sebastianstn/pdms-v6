"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useVitals, useRecordVital } from "@/hooks/use-vitals";
import { useUserPermissions } from "@/hooks/use-rbac";
import { VitalChart } from "@/components/vitals/vital-chart";
import { AlarmList } from "@/components/vitals/alarm-list";
import { LabMiniTableCard } from "@/components/lab/lab-mini-table";
import { FluidBalanceOverview } from "@/components/fluid-balance/fluid-balance-overview";
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

const ALL_PARAMS = [
  "heart_rate",
  "systolic_bp",
  "diastolic_bp",
  "spo2",
  "temperature",
  "respiratory_rate",
  "gcs",
  "pain_score",
] as const;

const INPUT_RULES: Record<string, { min?: number; max?: number; step?: number }> = {
  heart_rate: { min: 0, max: 300, step: 1 },
  systolic_bp: { min: 0, max: 400, step: 1 },
  diastolic_bp: { min: 0, max: 300, step: 1 },
  spo2: { min: 0, max: 100, step: 1 },
  temperature: { min: 25, max: 45, step: 0.1 },
  respiratory_rate: { min: 0, max: 80, step: 1 },
  gcs: { min: 3, max: 15, step: 1 },
  pain_score: { min: 0, max: 10, step: 1 },
};

const INTEGER_PARAMS = new Set(["gcs", "pain_score"]);

const QUICK_TEMPLATES: Array<{ label: string; values: Record<string, number> }> = [
  {
    label: "Basis (stabil)",
    values: {
      heart_rate: 78,
      systolic_bp: 125,
      diastolic_bp: 78,
      spo2: 97,
      temperature: 36.8,
      respiratory_rate: 16,
      gcs: 15,
      pain_score: 2,
    },
  },
  {
    label: "Fieber/Infekt",
    values: {
      heart_rate: 104,
      systolic_bp: 132,
      diastolic_bp: 82,
      spo2: 94,
      temperature: 38.6,
      respiratory_rate: 22,
      gcs: 15,
      pain_score: 4,
    },
  },
  {
    label: "Respiratorisch belastet",
    values: {
      heart_rate: 112,
      systolic_bp: 138,
      diastolic_bp: 84,
      spo2: 89,
      temperature: 37.8,
      respiratory_rate: 28,
      gcs: 14,
      pain_score: 3,
    },
  },
];

function nowAsDateTimeLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function KurvePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [hours, setHours] = useState(24);
  const [selectedParams, setSelectedParams] = useState<string[]>(["heart_rate", "spo2"]);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [recordedAtLocal, setRecordedAtLocal] = useState<string>(nowAsDateTimeLocal());
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const { data: vitals, isLoading, isError } = useVitals(patientId, hours);
  const recordMut = useRecordVital();
  const { canWrite } = useUserPermissions();

  function toggleParam(param: string) {
    setSelectedParams((prev) =>
      prev.includes(param) ? prev.filter((p) => p !== param) : [...prev, param]
    );
  }

  function applyTemplate(values: Record<string, number>) {
    const mapped: Record<string, string> = {};
    ALL_PARAMS.forEach((param) => {
      if (values[param] != null) {
        mapped[param] = String(values[param]);
      }
    });
    setFormValues(mapped);
    setFormError(null);
  }

  function loadLatestValues() {
    if (!vitals || vitals.length === 0) {
      setFormError("Keine bisherigen Vitalwerte vorhanden.");
      return;
    }

    const latest = [...vitals].sort(
      (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    )[0];

    const latestMap = latest as unknown as Record<string, unknown>;
    const mapped: Record<string, string> = {};

    ALL_PARAMS.forEach((param) => {
      const value = latestMap[param];
      if (typeof value === "number") {
        mapped[param] = String(value);
      }
    });

    if (Object.keys(mapped).length === 0) {
      setFormError("In der letzten Messung sind keine numerischen Parameter enthalten.");
      return;
    }

    setFormValues(mapped);
    setRecordedAtLocal(nowAsDateTimeLocal());
    setFormError(null);
  }

  function resetFormState() {
    setFormValues({});
    setRecordedAtLocal(nowAsDateTimeLocal());
    setFormError(null);
  }

  const handleRecord = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data: Record<string, unknown> = { patient_id: patientId };
    let hasValue = false;

    if (recordedAtLocal) {
      const parsedDate = new Date(recordedAtLocal);
      if (Number.isNaN(parsedDate.getTime())) {
        setFormError("Ungültiger Messzeitpunkt.");
        return;
      }
      data.recorded_at = parsedDate.toISOString();
    }

    ALL_PARAMS.forEach((p) => {
      const val = formValues[p];
      if (!val || !val.trim()) return;

      const parsed = INTEGER_PARAMS.has(p) ? Number.parseInt(val, 10) : Number.parseFloat(val);
      if (!Number.isFinite(parsed)) return;

      data[p] = parsed;
      hasValue = true;
    });

    if (!hasValue) {
      setFormError("Bitte mindestens einen Vitalparameter eintragen.");
      return;
    }

    setFormError(null);
    recordMut.mutate(data as Parameters<typeof recordMut.mutate>[0], {
      onSuccess: () => {
        setShowForm(false);
        resetFormState();
      },
      onError: () => {
        setFormError("Speichern fehlgeschlagen. Bitte Eingaben prüfen und erneut versuchen.");
      },
    });
  };

  return (
    <div className="space-y-1.5">
      {/* Header mit Neue-Messung-Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Vitaldaten & Kurve</h2>
        {canWrite("Vitalparameter") && (
          <button
            onClick={() => {
              if (showForm) {
                resetFormState();
              }
              setShowForm(!showForm);
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            {showForm ? "Abbrechen" : "+ Neue Messung"}
          </button>
        )}
      </div>

      {/* Eingabeformular */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neue Vitalmessung erfassen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRecord} className="space-y-4">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Messzeitpunkt</label>
                  <input
                    name="recorded_at"
                    type="datetime-local"
                    value={recordedAtLocal}
                    onChange={(event) => setRecordedAtLocal(event.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-600 mb-1">Schnellvorlagen</span>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map((template) => (
                      <button
                        key={template.label}
                        type="button"
                        onClick={() => applyTemplate(template.values)}
                        className="px-2.5 py-1 text-xs rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        {template.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={loadLatestValues}
                      className="px-2.5 py-1 text-xs rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Letzten Wert laden
                    </button>
                    <button
                      type="button"
                      onClick={resetFormState}
                      className="px-2.5 py-1 text-xs rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                      Zurücksetzen
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ALL_PARAMS.map((param) => {
                  const meta = VITAL_LABELS[param];
                  const rules = INPUT_RULES[param];
                  return (
                    <div key={param}>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        {meta.label} <span className="text-slate-400">({meta.unit})</span>
                      </label>
                      <input
                        name={param}
                        type="number"
                        step={rules.step ?? "any"}
                        min={rules.min}
                        max={rules.max}
                        value={formValues[param] ?? ""}
                        onChange={(event) => {
                          const newValue = event.target.value;
                          setFormValues((prev) => ({ ...prev, [param]: newValue }));
                        }}
                        placeholder="—"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    setShowForm(false);
                  }}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={recordMut.isPending}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {recordMut.isPending ? "Speichern…" : "Messung speichern"}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1.5">
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
                    <p className="text-xs text-slate-500">{meta.unit}</p>
                    {latest && (
                      <p className="text-[10px] text-slate-500 mt-1">
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
      {/* I/O-Bilanz — Flüssigkeitsbilanz */}
      <FluidBalanceOverview patientId={patientId} />

      {/* Laborwerte — aktuelle Zusammenfassung */}
      <LabMiniTableCard patientId={patientId} />
    </div>
  );
}
