"use client";

import { useState } from "react";
import { useCreateMedication, type MedicationCreate } from "@/hooks/use-medications";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";

interface MedicationFormProps {
    patientId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

const DOSE_UNITS = ["mg", "ml", "IE", "mcg", "g", "Tropfen", "Hübe", "Stk"];
const ROUTES = [
    { value: "oral", label: "Oral (p.o.)" },
    { value: "iv", label: "Intravenös (i.v.)" },
    { value: "sc", label: "Subkutan (s.c.)" },
    { value: "im", label: "Intramuskulär (i.m.)" },
    { value: "topisch", label: "Topisch" },
    { value: "inhalativ", label: "Inhalativ" },
    { value: "rektal", label: "Rektal" },
    { value: "sublingual", label: "Sublingual (s.l.)" },
];

const FREQUENCIES = [
    "1x täglich",
    "2x täglich",
    "3x täglich",
    "4x täglich",
    "alle 4h",
    "alle 6h",
    "alle 8h",
    "alle 12h",
    "morgens",
    "abends",
    "bei Bedarf",
];

export function MedicationForm({ patientId, onSuccess, onCancel }: MedicationFormProps) {
    const createMutation = useCreateMedication();
    const [form, setForm] = useState<Partial<MedicationCreate>>({
        patient_id: patientId,
        route: "oral",
        dose_unit: "mg",
        start_date: new Date().toISOString().split("T")[0],
        is_prn: false,
    });

    function update(field: string, value: string | boolean) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name || !form.dose || !form.dose_unit || !form.frequency || !form.start_date) return;

        await createMutation.mutateAsync(form as MedicationCreate);
        onSuccess?.();
    }

    const inputClass =
        "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
    const labelClass = "block text-xs font-medium text-slate-600 mb-1";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Neues Medikament verordnen</CardTitle>
                    {onCancel && (
                        <button onClick={onCancel} className="text-sm text-slate-400 hover:text-slate-600">
                            ✕
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Medikament */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Medikament *</label>
                            <input
                                type="text"
                                placeholder="z.B. Dafalgan"
                                value={form.name ?? ""}
                                onChange={(e) => update("name", e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Wirkstoff</label>
                            <input
                                type="text"
                                placeholder="z.B. Paracetamol"
                                value={form.generic_name ?? ""}
                                onChange={(e) => update("generic_name", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Dosierung */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Dosis *</label>
                            <input
                                type="text"
                                placeholder="z.B. 500"
                                value={form.dose ?? ""}
                                onChange={(e) => update("dose", e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Einheit *</label>
                            <select
                                value={form.dose_unit ?? "mg"}
                                onChange={(e) => update("dose_unit", e.target.value)}
                                className={inputClass}
                            >
                                {DOSE_UNITS.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Verabreichungsweg</label>
                            <select
                                value={form.route ?? "oral"}
                                onChange={(e) => update("route", e.target.value)}
                                className={inputClass}
                            >
                                {ROUTES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Frequenz & Zeitraum */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Frequenz *</label>
                            <select
                                value={form.frequency ?? ""}
                                onChange={(e) => update("frequency", e.target.value)}
                                className={inputClass}
                                required
                            >
                                <option value="">Bitte wählen...</option>
                                {FREQUENCIES.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Startdatum *</label>
                            <input
                                type="date"
                                value={form.start_date ?? ""}
                                onChange={(e) => update("start_date", e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Enddatum</label>
                            <input
                                type="date"
                                value={form.end_date ?? ""}
                                onChange={(e) => update("end_date", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Zusatzinfo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Indikation / Grund</label>
                            <input
                                type="text"
                                placeholder="z.B. Schmerzen postoperativ"
                                value={form.reason ?? ""}
                                onChange={(e) => update("reason", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>ATC-Code</label>
                            <input
                                type="text"
                                placeholder="z.B. N02BE01"
                                value={form.atc_code ?? ""}
                                onChange={(e) => update("atc_code", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Besondere Hinweise</label>
                        <textarea
                            placeholder="z.B. Nicht nüchtern einnehmen"
                            value={form.notes ?? ""}
                            onChange={(e) => update("notes", e.target.value)}
                            className={`${inputClass} h-20 resize-none`}
                        />
                    </div>

                    {/* Bei Bedarf */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_prn ?? false}
                            onChange={(e) => update("is_prn", e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Bei Bedarf (pro re nata)</span>
                    </label>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                Abbrechen
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {createMutation.isPending ? "Speichern..." : "Verordnung speichern"}
                        </button>
                    </div>

                    {createMutation.isError && (
                        <p className="text-sm text-red-500 mt-2">
                            Fehler: {(createMutation.error as Error).message}
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
