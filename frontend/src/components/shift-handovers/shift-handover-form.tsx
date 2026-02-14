"use client";

/**
 * ShiftHandoverForm — Neue Schichtübergabe (SBAR) erstellen.
 */
import { useState, type FormEvent } from "react";
import { useCreateShiftHandover } from "@/hooks/use-shift-handovers";
import { SHIFT_TYPE_LABELS, type ShiftType } from "@pdms/shared-types";

interface Props {
  patientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const SHIFT_TYPES = Object.entries(SHIFT_TYPE_LABELS);

export function ShiftHandoverForm({ patientId, onSuccess, onCancel }: Props) {
  const createMutation = useCreateShiftHandover();
  const now = new Date();
  const currentHour = now.getHours();
  const defaultShift: ShiftType = currentHour < 14 ? "early" : currentHour < 22 ? "late" : "night";

  const [shiftType, setShiftType] = useState<ShiftType>(defaultShift);
  const [handoverDate, setHandoverDate] = useState(now.toISOString().split("T")[0]);
  const [situation, setSituation] = useState("");
  const [background, setBackground] = useState("");
  const [assessment, setAssessment] = useState("");
  const [recommendation, setRecommendation] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await createMutation.mutateAsync({
      patient_id: patientId,
      shift_type: shiftType,
      handover_date: handoverDate,
      situation,
      background: background || undefined,
      assessment: assessment || undefined,
      recommendation: recommendation || undefined,
    });
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Schicht</label>
          <select
            value={shiftType} onChange={(e) => setShiftType(e.target.value as ShiftType)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {SHIFT_TYPES.map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Datum</label>
          <input
            type="date" value={handoverDate} onChange={(e) => setHandoverDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="bg-red-50 rounded-lg p-3">
        <label className="block text-sm font-semibold text-red-700 mb-1">S — Situation *</label>
        <textarea
          value={situation} onChange={(e) => setSituation(e.target.value)} required rows={2}
          className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
          placeholder="Aktueller Zustand des Patienten…"
          autoFocus
        />
      </div>
      <div className="bg-blue-50 rounded-lg p-3">
        <label className="block text-sm font-semibold text-blue-700 mb-1">B — Background</label>
        <textarea
          value={background} onChange={(e) => setBackground(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-blue-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          placeholder="Relevante Vorgeschichte, Aufnahmegrund…"
        />
      </div>
      <div className="bg-amber-50 rounded-lg p-3">
        <label className="block text-sm font-semibold text-amber-700 mb-1">A — Assessment</label>
        <textarea
          value={assessment} onChange={(e) => setAssessment(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-amber-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          placeholder="Klinische Einschätzung, Veränderungen…"
        />
      </div>
      <div className="bg-emerald-50 rounded-lg p-3">
        <label className="block text-sm font-semibold text-emerald-700 mb-1">R — Recommendation</label>
        <textarea
          value={recommendation} onChange={(e) => setRecommendation(e.target.value)} rows={2}
          className="w-full px-3 py-2 border border-emerald-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          placeholder="Empfehlungen für die nächste Schicht…"
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
          {createMutation.isPending ? "Wird erstellt…" : "Übergabe erstellen"}
        </button>
      </div>
    </form>
  );
}
