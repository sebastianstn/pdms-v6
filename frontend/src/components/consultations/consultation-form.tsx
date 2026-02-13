"use client";

/**
 * ConsultationForm — Neues Konsil anfordern.
 */
import { useState, type FormEvent } from "react";
import { useCreateConsultation } from "@/hooks/use-consultations";
import {
  CONSULTATION_SPECIALTY_LABELS,
  type ConsultationSpecialty,
  type ConsultationUrgency,
} from "@pdms/shared-types";

interface Props {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const SPECIALTIES = Object.entries(CONSULTATION_SPECIALTY_LABELS);

export function ConsultationForm({ patientId, onSuccess, onCancel }: Props) {
  const createMutation = useCreateConsultation();
  const [specialty, setSpecialty] = useState<ConsultationSpecialty>("kardiologie");
  const [urgency, setUrgency] = useState<ConsultationUrgency>("routine");
  const [question, setQuestion] = useState("");
  const [context, setContext] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({
      patient_id: patientId,
      specialty,
      urgency,
      question,
      clinical_context: context || undefined,
    });
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fachrichtung *</label>
          <select
            value={specialty} onChange={(e) => setSpecialty(e.target.value as ConsultationSpecialty)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SPECIALTIES.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dringlichkeit</label>
          <select
            value={urgency} onChange={(e) => setUrgency(e.target.value as ConsultationUrgency)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="routine">Routine</option>
            <option value="urgent">Dringend</option>
            <option value="emergency">Notfall</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Fragestellung *</label>
        <textarea
          value={question} onChange={(e) => setQuestion(e.target.value)} required rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Bitte konsiliarische Beurteilung…"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Klinischer Kontext</label>
        <textarea
          value={context} onChange={(e) => setContext(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Relevante Anamnese, Befunde, bisherige Therapie…"
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
          {createMutation.isPending ? "Wird angefordert…" : "Konsil anfordern"}
        </button>
      </div>
    </form>
  );
}
