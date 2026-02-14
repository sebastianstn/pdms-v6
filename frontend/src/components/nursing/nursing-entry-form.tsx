"use client";

import { useState } from "react";
import {
    useCreateNursingEntry,
    type NursingEntryCreate,
    type EntryCategory,
    type EntryPriority,
} from "@/hooks/use-nursing";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";

interface NursingEntryFormProps {
    patientId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const CATEGORIES: { value: EntryCategory; label: string }[] = [
    { value: "observation", label: "Beobachtung" },
    { value: "intervention", label: "Intervention / Massnahme" },
    { value: "wound_care", label: "Wundversorgung" },
    { value: "mobility", label: "Mobilisation" },
    { value: "nutrition", label: "Ernährung / Flüssigkeit" },
    { value: "elimination", label: "Ausscheidung" },
    { value: "communication", label: "Kommunikation" },
    { value: "handover", label: "Übergabe-Notiz" },
];

const PRIORITIES: { value: EntryPriority; label: string }[] = [
    { value: "low", label: "Niedrig" },
    { value: "normal", label: "Normal" },
    { value: "high", label: "Hoch" },
    { value: "urgent", label: "Dringend" },
];

export function NursingEntryForm({ patientId, onSuccess, onCancel }: NursingEntryFormProps) {
    const createMutation = useCreateNursingEntry();
    const [form, setForm] = useState<Partial<NursingEntryCreate>>({
        patient_id: patientId,
        category: "observation",
        priority: "normal",
        is_handover: false,
    });

    function update(field: string, value: string | boolean) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.title || !form.content || !form.category) return;
        await createMutation.mutateAsync(form as NursingEntryCreate);
        onSuccess?.();
    }

    const inputClass =
        "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

    return (
        <Card>
            <CardHeader>
                <CardTitle>Neuer Pflegeeintrag</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Kategorie + Priorität */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Kategorie *</label>
                            <select
                                className={inputClass}
                                value={form.category || "observation"}
                                onChange={(e) => update("category", e.target.value)}
                            >
                                {CATEGORIES.map((c) => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Priorität</label>
                            <select
                                className={inputClass}
                                value={form.priority || "normal"}
                                onChange={(e) => update("priority", e.target.value)}
                            >
                                {PRIORITIES.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Titel */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Titel *</label>
                        <input
                            className={inputClass}
                            placeholder="Kurzbezeichnung des Eintrags"
                            value={form.title || ""}
                            onChange={(e) => update("title", e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    {/* Inhalt */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Inhalt *</label>
                        <textarea
                            className={`${inputClass} min-h-[120px] resize-y`}
                            placeholder="Beschreibung der Beobachtung, Massnahme oder Intervention..."
                            value={form.content || ""}
                            onChange={(e) => update("content", e.target.value)}
                            required
                            rows={5}
                        />
                    </div>

                    {/* Übergabe-Checkbox */}
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                            type="checkbox"
                            className="rounded border-slate-300"
                            checked={form.is_handover || false}
                            onChange={(e) => update("is_handover", e.target.checked)}
                        />
                        Übergabe-relevant (wird in Schichtübergabe angezeigt)
                    </label>

                    {/* Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={createMutation.isPending || !form.title || !form.content}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {createMutation.isPending ? "Speichere..." : "Eintrag erstellen"}
                        </button>
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Abbrechen
                            </button>
                        )}
                    </div>

                    {createMutation.isError && (
                        <p className="text-sm text-red-500">Fehler beim Erstellen des Eintrags.</p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
