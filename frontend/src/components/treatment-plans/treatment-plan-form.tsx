"use client";

/**
 * TreatmentPlanForm — Neuen Therapieplan erstellen.
 */
import { useState, type FormEvent } from "react";
import { useCreateTreatmentPlan } from "@/hooks/use-treatment-plans";
import type { TreatmentPlanPriority } from "@pdms/shared-types";

interface Props {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TreatmentPlanForm({ patientId, onSuccess, onCancel }: Props) {
  const createMutation = useCreateTreatmentPlan();
  const [title, setTitle] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [icdCode, setIcdCode] = useState("");
  const [goals, setGoals] = useState("");
  const [interventions, setInterventions] = useState("");
  const [priority, setPriority] = useState<TreatmentPlanPriority>("normal");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({
      patient_id: patientId,
      title,
      diagnosis,
      icd_code: icdCode || undefined,
      goals,
      interventions,
      priority,
      start_date: startDate,
    });
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Antibiotikatherapie i.v."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Diagnose *</label>
          <input
            value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. Pneumonie rechts"
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">ICD-10</label>
          <input
            value={icdCode} onChange={(e) => setIcdCode(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="z.B. J18.1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Priorität</label>
          <select
            value={priority} onChange={(e) => setPriority(e.target.value as TreatmentPlanPriority)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">Niedrig</option>
            <option value="normal">Normal</option>
            <option value="high">Hoch</option>
            <option value="urgent">Dringend</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Startdatum</label>
          <input
            type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Therapieziele *</label>
        <textarea
          value={goals} onChange={(e) => setGoals(e.target.value)} required rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="z.B. Entfieberung, CRP-Abfall < 20mg/L"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Massnahmen *</label>
        <textarea
          value={interventions} onChange={(e) => setInterventions(e.target.value)} required rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="z.B. Amoxicillin/Clavulansäure 2.2g 3x/Tag i.v."
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">
          Abbrechen
        </button>
        <button
          type="submit" disabled={createMutation.isPending}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {createMutation.isPending ? "Wird erstellt…" : "Therapieplan erstellen"}
        </button>
      </div>
    </form>
  );
}
