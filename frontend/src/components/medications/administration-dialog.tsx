"use client";

import { useState } from "react";
import { useRecordAdministration, type Medication, type AdministrationCreate } from "@/hooks/use-medications";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";

interface AdminDialogProps {
    medication: Medication;
    onSuccess?: () => void;
    onCancel: () => void;
}

const STATUS_OPTIONS = [
    { value: "completed", label: "Verabreicht" },
    { value: "refused", label: "Vom Patienten verweigert" },
    { value: "held", label: "Zurückgehalten" },
    { value: "not-given", label: "Nicht verabreicht" },
];

export function AdministrationDialog({ medication, onSuccess, onCancel }: AdminDialogProps) {
    const recordMutation = useRecordAdministration(medication.patient_id);
    const [status, setStatus] = useState("completed");
    const [doseGiven, setDoseGiven] = useState(medication.dose);
    const [reasonNotGiven, setReasonNotGiven] = useState("");
    const [notes, setNotes] = useState("");

    const isNotGiven = status !== "completed";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const data: AdministrationCreate = {
            medication_id: medication.id,
            patient_id: medication.patient_id,
            dose_given: doseGiven,
            dose_unit: medication.dose_unit,
            route: medication.route,
            status,
            reason_not_given: isNotGiven ? reasonNotGiven : undefined,
            notes: notes || undefined,
        };

        await recordMutation.mutateAsync(data);
        onSuccess?.();
    }

    const inputClass =
        "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Verabreichung dokumentieren</CardTitle>
                        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">✕</button>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {medication.name} — {medication.dose} {medication.dose_unit} {medication.route}
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Status */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Status</label>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map((opt) => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setStatus(opt.value)}
                                        className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${status === opt.value
                                                ? opt.value === "completed"
                                                    ? "bg-green-600 text-white border-green-600"
                                                    : "bg-amber-600 text-white border-amber-600"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Dosis */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                Tatsächlich gegebene Dosis
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={doseGiven}
                                    onChange={(e) => setDoseGiven(e.target.value)}
                                    className={`${inputClass} flex-1`}
                                    required
                                />
                                <span className="px-3 py-2 bg-slate-100 rounded-lg text-sm text-slate-600 flex items-center">
                                    {medication.dose_unit}
                                </span>
                            </div>
                        </div>

                        {/* Grund bei Nicht-Verabreichung */}
                        {isNotGiven && (
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">
                                    Grund der Nicht-Verabreichung
                                </label>
                                <input
                                    type="text"
                                    placeholder="z.B. Patient nüchtern für OP"
                                    value={reasonNotGiven}
                                    onChange={(e) => setReasonNotGiven(e.target.value)}
                                    className={inputClass}
                                />
                            </div>
                        )}

                        {/* Notizen */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Bemerkungen</label>
                            <textarea
                                placeholder="Optionale Bemerkungen..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className={`${inputClass} h-16 resize-none`}
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="submit"
                                disabled={recordMutation.isPending}
                                className={`px-4 py-2 text-sm rounded-lg text-white transition-colors disabled:opacity-50 ${status === "completed"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-amber-600 hover:bg-amber-700"
                                    }`}
                            >
                                {recordMutation.isPending
                                    ? "Speichern..."
                                    : status === "completed"
                                        ? "Verabreichung bestätigen"
                                        : "Dokumentieren"}
                            </button>
                        </div>

                        {recordMutation.isError && (
                            <p className="text-sm text-red-500">
                                Fehler: {(recordMutation.error as Error).message}
                            </p>
                        )}
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
