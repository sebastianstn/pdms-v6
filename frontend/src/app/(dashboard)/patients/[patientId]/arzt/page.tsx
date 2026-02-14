"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { MedicationTable } from "@/components/medications/medication-table";
import { MedicationForm } from "@/components/medications/medication-form";
import { AdministrationDialog } from "@/components/medications/administration-dialog";
import { ClinicalNoteList } from "@/components/clinical-notes/clinical-note-list";
import { ClinicalNoteForm } from "@/components/clinical-notes/clinical-note-form";
import { ClinicalNoteDetail } from "@/components/clinical-notes/clinical-note-detail";
import { LabTrendChartCard } from "@/components/lab/lab-trend-chart";
import { LabMiniTableCard } from "@/components/lab/lab-mini-table";
import { LabResultForm } from "@/components/lab/lab-result-form";
import { TreatmentPlanList, TreatmentPlanForm } from "@/components/treatment-plans";
import { ConsultationList, ConsultationForm } from "@/components/consultations";
import { MedicalLetterList, MedicalLetterForm } from "@/components/medical-letters";
import { DiagnosisList, DiagnosisForm } from "@/components/diagnoses";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";
import { useUserPermissions } from "@/hooks/use-rbac";
import type { Medication } from "@/hooks/use-medications";
import type { ClinicalNote } from "@/hooks/use-clinical-notes";

export default function ArztPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { canWrite } = useUserPermissions();
  const [showForm, setShowForm] = useState(false);
  const [editMed, setEditMed] = useState<Medication | null>(null);
  const [adminMed, setAdminMed] = useState<Medication | null>(null);

  // Clinical Notes state
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [editNote, setEditNote] = useState<ClinicalNote | null>(null);
  const [viewNote, setViewNote] = useState<ClinicalNote | null>(null);

  // Lab state
  const [showLabForm, setShowLabForm] = useState(false);

  // Phase 3c state
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showConsilForm, setShowConsilForm] = useState(false);
  const [showLetterForm, setShowLetterForm] = useState(false);
  const [showDiagForm, setShowDiagForm] = useState(false);

  return (
    <div className="space-y-1.5">
      {/* ─── Diagnosen (ICD-10) ─────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Diagnosen</CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                ICD-10 kodierte Haupt-, Neben- und Verdachtsdiagnosen.
              </p>
            </div>
            {canWrite("Diagnosen") && (
              <button
                onClick={() => setShowDiagForm((v) => !v)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {showDiagForm ? "Abbrechen" : "+ Neue Diagnose"}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showDiagForm && (
            <div className="mb-6">
              <DiagnosisForm
                patientId={patientId}
                onSuccess={() => setShowDiagForm(false)}
                onCancel={() => setShowDiagForm(false)}
              />
            </div>
          )}
          <DiagnosisList patientId={patientId} />
        </CardContent>
      </Card>

      {/* Verordnungen */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Medikamenten-Verordnungen</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Verordnungen erstellen, bearbeiten und einsehen.
              </p>
            </div>
            {canWrite("Medikamente") && (
              <button
                onClick={() => setShowForm((v) => !v)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {showForm ? "Abbrechen" : "+ Neue Verordnung"}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mb-6">
              <MedicationForm
                patientId={patientId}
                onSuccess={() => setShowForm(false)}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          <MedicationTable
            patientId={patientId}
            onAdminister={(med) => setAdminMed(med)}
            onEdit={(med) => setEditMed(med)}
          />
        </CardContent>
      </Card>

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

      {/* Laborwerte — Trend-Chart (CRP Default) */}
      <LabTrendChartCard patientId={patientId} />

      {/* Laborwerte — Aktuelle Übersicht + Erfassung */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1.5">
        <LabMiniTableCard patientId={patientId} />
        <div>
          <div className="flex items-center justify-end mb-3">
            {canWrite("Laborwerte") && (
              <button
                onClick={() => setShowLabForm((v) => !v)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {showLabForm ? "Abbrechen" : "Laborwerte erfassen"}
              </button>
            )}
          </div>
          {showLabForm && (
            <LabResultForm
              patientId={patientId}
              onSuccess={() => setShowLabForm(false)}
              onCancel={() => setShowLabForm(false)}
            />
          )}
        </div>
      </div>

      {/* Klinische Notizen / Verlauf */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Klinische Notizen / Verlauf</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Verlaufsnotizen, Konsilien, Aufnahme- und Entlassberichte.
              </p>
            </div>
            {canWrite("Klinische Notizen") && (
              <button
                onClick={() => {
                  setShowNoteForm((v) => !v);
                  setEditNote(null);
                  setViewNote(null);
                }}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {showNoteForm ? "Abbrechen" : "+ Neue Notiz"}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Formulare */}
          {(showNoteForm || editNote) && (
            <div className="mb-6">
              <ClinicalNoteForm
                patientId={patientId}
                editNote={editNote}
                onSuccess={() => {
                  setShowNoteForm(false);
                  setEditNote(null);
                }}
                onCancel={() => {
                  setShowNoteForm(false);
                  setEditNote(null);
                }}
              />
            </div>
          )}

          {/* Detail-Ansicht */}
          {viewNote && !showNoteForm && !editNote && (
            <div className="mb-6">
              <ClinicalNoteDetail
                note={viewNote}
                onEdit={(n) => {
                  setEditNote(n);
                  setViewNote(null);
                }}
                onClose={() => setViewNote(null)}
              />
            </div>
          )}

          {/* Liste */}
          <ClinicalNoteList
            patientId={patientId}
            onEdit={(n) => {
              setEditNote(n);
              setShowNoteForm(false);
              setViewNote(null);
            }}
            onView={(n) => {
              setViewNote(n);
              setShowNoteForm(false);
              setEditNote(null);
            }}
          />
        </CardContent>
      </Card>

      {/* ─── Therapiepläne ──────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Therapiepläne</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Behandlungspläne mit Zielen und Massnahmen.
              </p>
            </div>
            {canWrite("Therapiepläne") && (
              <button
                onClick={() => setShowPlanForm((v) => !v)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {showPlanForm ? "Abbrechen" : "+ Neuer Plan"}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showPlanForm && (
            <div className="mb-6">
              <TreatmentPlanForm
                patientId={patientId}
                onSuccess={() => setShowPlanForm(false)}
                onCancel={() => setShowPlanForm(false)}
              />
            </div>
          )}
          <TreatmentPlanList patientId={patientId} />
        </CardContent>
      </Card>

      {/* ─── Konsilien ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Konsilien</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Anfragen und Berichte von Fachspezialisten.
              </p>
            </div>
            {canWrite("Konsilien") && (
              <button
                onClick={() => setShowConsilForm((v) => !v)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {showConsilForm ? "Abbrechen" : "+ Neues Konsil"}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showConsilForm && (
            <div className="mb-6">
              <ConsultationForm
                patientId={patientId}
                onSuccess={() => setShowConsilForm(false)}
                onCancel={() => setShowConsilForm(false)}
              />
            </div>
          )}
          <ConsultationList patientId={patientId} />
        </CardContent>
      </Card>

      {/* ─── Arztbriefe ──────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Arztbriefe</CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                Entlass-, Überweisungs- und Verlaufsberichte.
              </p>
            </div>
            {canWrite("Arztbriefe") && (
              <button
                onClick={() => setShowLetterForm((v) => !v)}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                {showLetterForm ? "Abbrechen" : "+ Neuer Brief"}
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showLetterForm && (
            <div className="mb-6">
              <MedicalLetterForm
                patientId={patientId}
                onSuccess={() => setShowLetterForm(false)}
                onCancel={() => setShowLetterForm(false)}
              />
            </div>
          )}
          <MedicalLetterList patientId={patientId} />
        </CardContent>
      </Card>
    </div>
  );
}
