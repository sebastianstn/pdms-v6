"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MedicationTable } from "@/components/medications/medication-table";
import { AdministrationDialog } from "@/components/medications/administration-dialog";
import { NursingEntryList } from "@/components/nursing/nursing-entry-list";
import { NursingEntryForm } from "@/components/nursing/nursing-entry-form";
import { AssessmentOverview } from "@/components/nursing/assessment-overview";
import { AssessmentForm } from "@/components/nursing/assessment-form";
import { RemoteDevicePanel, SelfMedicationTracker } from "@/components/home-spital";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";
import type { Medication } from "@/hooks/use-medications";
import type { AssessmentType } from "@/hooks/use-nursing";

type Tab = "entries" | "medications" | "assessments" | "home_spital";

export default function PflegePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>("entries");
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [adminMed, setAdminMed] = useState<Medication | null>(null);
  const [assessmentType, setAssessmentType] = useState<AssessmentType | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  const tabs: { key: Tab; label: string }[] = [
    { key: "entries", label: "Pflegeeinträge" },
    { key: "assessments", label: "Assessments" },
    { key: "medications", label: "Medikamente" },
    { key: "home_spital", label: "Home-Spital" },
  ];

  return (
    <div className="space-y-6">
      {/* Tab-Navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Pflegeeinträge Tab ──────────────────────────── */}
      {activeTab === "entries" && (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pflege-Dokumentation</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Beobachtungen, Interventionen und Massnahmen dokumentieren.
                  </p>
                </div>
                <button
                  onClick={() => setShowEntryForm((v) => !v)}
                  className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  {showEntryForm ? "Abbrechen" : "+ Neuer Eintrag"}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {showEntryForm && (
                <div className="mb-6">
                  <NursingEntryForm
                    patientId={patientId}
                    onSuccess={() => setShowEntryForm(false)}
                    onCancel={() => setShowEntryForm(false)}
                  />
                </div>
              )}

              {/* Kategorie-Filter */}
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs text-slate-500">Filter:</span>
                {[
                  { value: undefined, label: "Alle" },
                  { value: "observation", label: "Beobachtung" },
                  { value: "intervention", label: "Intervention" },
                  { value: "wound_care", label: "Wundversorgung" },
                  { value: "mobility", label: "Mobilisation" },
                  { value: "nutrition", label: "Ernährung" },
                  { value: "handover", label: "Übergabe" },
                ].map((f) => (
                  <button
                    key={f.value ?? "all"}
                    onClick={() => setCategoryFilter(f.value)}
                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${categoryFilter === f.value
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <NursingEntryList patientId={patientId} category={categoryFilter} />
            </CardContent>
          </Card>
        </>
      )}

      {/* ─── Assessments Tab ─────────────────────────────── */}
      {activeTab === "assessments" && (
        <Card>
          <CardHeader>
            <CardTitle>Pflege-Assessments</CardTitle>
            <p className="text-sm text-slate-500">
              Barthel-Index, Norton-Skala, Braden-Skala, Sturzrisiko — letzte Ergebnisse und Neuerfassung.
            </p>
          </CardHeader>
          <CardContent>
            {assessmentType ? (
              <AssessmentForm
                patientId={patientId}
                assessmentType={assessmentType}
                onSuccess={() => setAssessmentType(null)}
                onCancel={() => setAssessmentType(null)}
              />
            ) : (
              <AssessmentOverview
                patientId={patientId}
                onNewAssessment={(type) => setAssessmentType(type as AssessmentType)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Medikamente Tab ─────────────────────────────── */}
      {activeTab === "medications" && (
        <Card>
          <CardHeader>
            <CardTitle>Medikamenten-Verabreichung</CardTitle>
            <p className="text-sm text-slate-500">
              Verordnete Medikamente einsehen und Gabe dokumentieren.
            </p>
          </CardHeader>
          <CardContent>
            <MedicationTable
              patientId={patientId}
              onAdminister={(med) => setAdminMed(med)}
            />
          </CardContent>
        </Card>
      )}

      {/* ─── Home-Spital Tab ─────────────────────────── */}
      {activeTab === "home_spital" && (
        <div className="space-y-6">
          <RemoteDevicePanel patientId={patientId} />
          <SelfMedicationTracker patientId={patientId} />
        </div>
      )}

      {/* Verabreichungs-Dialog */}
      {adminMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg">
            <AdministrationDialog
              medication={adminMed}
              onSuccess={() => setAdminMed(null)}
              onCancel={() => setAdminMed(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
