"use client";

/**
 * MedicalLetterForm — Arztbrief erstellen/bearbeiten.
 */
import { useState, type FormEvent } from "react";
import { useCreateMedicalLetter } from "@/hooks/use-medical-letters";
import { LETTER_TYPE_LABELS, type MedicalLetterType } from "@pdms/shared-types";

interface Props {
    patientId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

const LETTER_TYPES = Object.entries(LETTER_TYPE_LABELS);

export function MedicalLetterForm({ patientId, onSuccess, onCancel }: Props) {
    const createMutation = useCreateMedicalLetter();
    const [letterType, setLetterType] = useState<MedicalLetterType>("discharge");
    const [title, setTitle] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [anamnesis, setAnamnesis] = useState("");
    const [findings, setFindings] = useState("");
    const [therapy, setTherapy] = useState("");
    const [recommendations, setRecommendations] = useState("");

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        await createMutation.mutateAsync({
            patient_id: patientId,
            letter_type: letterType,
            title,
            diagnosis: diagnosis || undefined,
            anamnesis: anamnesis || undefined,
            findings: findings || undefined,
            therapy: therapy || undefined,
            recommendations: recommendations || undefined,
        });
        onSuccess();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Brieftyp *</label>
                    <select
                        value={letterType} onChange={(e) => setLetterType(e.target.value as MedicalLetterType)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {LETTER_TYPES.map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Titel *</label>
                    <input
                        value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="z.B. Entlassbericht"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Diagnose</label>
                <input
                    value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Anamnese</label>
                <textarea
                    value={anamnesis} onChange={(e) => setAnamnesis(e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Befunde</label>
                <textarea
                    value={findings} onChange={(e) => setFindings(e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Therapie</label>
                <textarea
                    value={therapy} onChange={(e) => setTherapy(e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empfehlung / Procedere</label>
                <textarea
                    value={recommendations} onChange={(e) => setRecommendations(e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    {createMutation.isPending ? "Wird erstellt…" : "Brief erstellen"}
                </button>
            </div>
        </form>
    );
}
