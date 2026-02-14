"use client";

/**
 * DossierOverview — Aggregierte Patientenübersicht auf einer Seite.
 * Zeigt Zusammenfassung: Encounter, Vitals, Alarme, Medikamente,
 * Labor, Therapiepläne, Konsilien, Arztbriefe, Notizen, Pflege.
 */

import { useDossier } from "@/hooks/use-dossier";
import { Card, CardHeader, CardContent, CardTitle, Spinner } from "@/components/ui";

interface Props {
  patientId: string;
}

function StatCard({ label, value, color = "blue" }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    red: "bg-red-50 text-red-700 border-red-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };

  return (
    <div className={`rounded-lg border p-3 ${colorMap[color] ?? colorMap.blue}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium mt-0.5">{label}</p>
    </div>
  );
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit", month: "2-digit", year: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

export function DossierOverview({ patientId }: Props) {
  const { data, isLoading, isError } = useDossier(patientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 text-sm">Dossier konnte nicht geladen werden.</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, encounter, latest_vitals, latest_handover, active_nutrition, recent_notes, recent_nursing } = data;

  return (
    <div className="space-y-1.5">
      {/* Encounter-Banner */}
      {encounter && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">
                Aktiver Aufenthalt: {(encounter as Record<string, string>).encounter_type ?? "Home-Care"}
              </h3>
              <p className="text-sm text-blue-700 mt-0.5">
                Aufnahme: {formatDate((encounter as Record<string, string>).admitted_at)}
                {(encounter as Record<string, string>).reason && ` · ${(encounter as Record<string, string>).reason}`}
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              {(encounter as Record<string, string>).status ?? "aktiv"}
            </span>
          </div>
        </div>
      )}

      {/* Zusammenfassungs-Kacheln */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
        <StatCard label="Alarme" value={summary.active_alarms} color={summary.active_alarms > 0 ? "red" : "emerald"} />
        <StatCard label="Medikamente" value={summary.active_medications} color="blue" />
        <StatCard label="Therapiepläne" value={summary.active_treatment_plans} color="purple" />
        <StatCard label="Pflegediagnosen" value={summary.active_nursing_diagnoses} color="amber" />
        <StatCard label="Offene Konsilien" value={summary.open_consultations} color={summary.open_consultations > 0 ? "amber" : "slate"} />
        <StatCard label="Brief-Entwürfe" value={summary.draft_letters} color="slate" />
        <StatCard label="Ernährung" value={active_nutrition ? 1 : 0} color="emerald" />
      </div>

      {/* Vitaldaten + Letzte Übergabe */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
        {/* Letzte Vitaldaten */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Vitaldaten</CardTitle>
          </CardHeader>
          <CardContent>
            {latest_vitals ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(latest_vitals as Record<string, unknown>).map(([key, val]) => {
                  if (key === "id" || key === "patient_id" || key === "encounter_id" || key === "source" || !val) return null;
                  const labelMap: Record<string, string> = {
                    heart_rate: "HF", systolic_bp: "Sys", diastolic_bp: "Dia",
                    spo2: "SpO₂", temperature: "Temp", respiratory_rate: "AF",
                    gcs: "GCS", pain_score: "Schmerz", recorded_at: "Erfasst",
                  };
                  const unitMap: Record<string, string> = {
                    heart_rate: "/min", systolic_bp: "mmHg", diastolic_bp: "mmHg",
                    spo2: "%", temperature: "°C", respiratory_rate: "/min",
                    gcs: "", pain_score: "/10",
                  };
                  const label = labelMap[key];
                  if (!label) return null;
                  return (
                    <div key={key} className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-sm text-slate-500">{label}</span>
                      <span className="font-medium text-slate-900">
                        {key === "recorded_at" ? formatDate(val as string) : `${val} ${unitMap[key] ?? ""}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Keine Vitaldaten vorhanden.</p>
            )}
          </CardContent>
        </Card>

        {/* Letzte Schichtübergabe */}
        <Card>
          <CardHeader>
            <CardTitle>Letzte Schichtübergabe</CardTitle>
          </CardHeader>
          <CardContent>
            {latest_handover ? (
              <div className="space-y-1.5">
                <div>
                  <span className="text-xs font-semibold text-red-600">S — Situation</span>
                  <p className="text-sm text-slate-700">{(latest_handover as Record<string, string>).situation}</p>
                </div>
                {(latest_handover as Record<string, string>).shift_type && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500">Schicht:</span>
                    <span className="text-xs text-slate-700">{(latest_handover as Record<string, string>).shift_type}</span>
                  </div>
                )}
                <p className="text-xs text-slate-500 pt-1">{(latest_handover as Record<string, string>).handover_date}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Keine Übergabe vorhanden.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Letzte Notizen + Pflege-Einträge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
        <Card>
          <CardHeader>
            <CardTitle>Letzte Notizen</CardTitle>
          </CardHeader>
          <CardContent>
            {recent_notes.length > 0 ? (
              <div className="space-y-1.5">
                {recent_notes.map((note, i) => {
                  const n = note as Record<string, string>;
                  return (
                    <div key={i} className="border-b border-slate-100 pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-slate-900">{n.title}</span>
                        <span className="text-xs text-slate-500">{formatDate(n.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.note_type} · {n.status}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Keine Notizen vorhanden.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Letzte Pflege-Einträge</CardTitle>
          </CardHeader>
          <CardContent>
            {recent_nursing.length > 0 ? (
              <div className="space-y-1.5">
                {recent_nursing.map((entry, i) => {
                  const e = entry as Record<string, string>;
                  return (
                    <div key={i} className="border-b border-slate-100 pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-slate-900">{e.title}</span>
                        <span className="text-xs text-slate-500">{formatDate(e.recorded_at)}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{e.category} · {e.priority}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">Keine Pflege-Einträge vorhanden.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
