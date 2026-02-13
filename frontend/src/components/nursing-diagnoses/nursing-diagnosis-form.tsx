"use client";

/**
 * NursingDiagnosisForm — Neue Pflegediagnose erfassen.
 */
import { useState, type FormEvent } from "react";
import { useCreateNursingDiagnosis } from "@/hooks/use-nursing-diagnoses";
import type { NursingDiagnosisPriority } from "@pdms/shared-types";

interface Props {
    patientId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function NursingDiagnosisForm({ patientId, onSuccess, onCancel }: Props) {
    const createMutation = useCreateNursingDiagnosis();
    const [title, setTitle] = useState("");
    const [nandaCode, setNandaCode] = useState("");
    const [domain, setDomain] = useState("");
    const [characteristics, setCharacteristics] = useState("");
    const [goals, setGoals] = useState("");
    const [interventions, setInterventions] = useState("");
    const [priority, setPriority] = useState<NursingDiagnosisPriority>("normal");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        await createMutation.mutateAsync({
            patient_id: patientId,
            title,
            nanda_code: nandaCode || undefined,
            domain: domain || undefined,
            defining_characteristics: characteristics || undefined,
            goals,
            interventions,
            priority,
        });
        onSuccess();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pflegediagnose *</label>
                    <input
                        value={title} onChange={(e) => setTitle(e.target.value)} required
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="z.B. Beeinträchtigte Hautintegrität"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">NANDA-Code</label>
                    <input
                        value={nandaCode} onChange={(e) => setNandaCode(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="z.B. 00046"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Domäne</label>
                    <input
                        value={domain} onChange={(e) => setDomain(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="z.B. Sicherheit/Schutz"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priorität</label>
                    <select
                        value={priority} onChange={(e) => setPriority(e.target.value as NursingDiagnosisPriority)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="low">Niedrig</option>
                        <option value="normal">Normal</option>
                        <option value="high">Hoch</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Bestimmende Merkmale</label>
                <textarea
                    value={characteristics} onChange={(e) => setCharacteristics(e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. Druckstelle Sakral Grad II"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Pflegeziele *</label>
                <textarea
                    value={goals} onChange={(e) => setGoals(e.target.value)} required rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. Wundheilung innerhalb 14 Tagen"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Massnahmen *</label>
                <textarea
                    value={interventions} onChange={(e) => setInterventions(e.target.value)} required rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. 2x täglich Wundversorgung, Lagerungsprotokoll"
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
                    {createMutation.isPending ? "Wird erstellt…" : "Diagnose erfassen"}
                </button>
            </div>
        </form>
    );
}
