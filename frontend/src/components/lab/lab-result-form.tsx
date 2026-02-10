"use client";

/**
 * LabResultForm — Create single or batch lab results.
 *
 * Doctor/Admin can add lab values manually or as a batch (one blood draw).
 * Auto-fills unit + reference range from the analyte catalogue.
 */

import { useState } from "react";
import { useCreateLabResult, useCreateLabResultBatch } from "@/hooks/use-lab-results";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";
import { LAB_ANALYTE_LABELS } from "@pdms/shared-types";

interface Props {
    patientId: string;
    encounterId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Quick catalogue (mirrors backend)
const ANALYTE_DEFAULTS: Record<string, { unit: string; refMin: number | null; refMax: number | null; category: string }> = {
    crp: { unit: "mg/L", refMin: 0, refMax: 5, category: "chemistry" },
    leukocytes: { unit: "×10⁹/L", refMin: 4.0, refMax: 10.0, category: "hematology" },
    hemoglobin: { unit: "g/L", refMin: 120, refMax: 160, category: "hematology" },
    thrombocytes: { unit: "×10⁹/L", refMin: 150, refMax: 400, category: "hematology" },
    creatinine: { unit: "µmol/L", refMin: 44, refMax: 97, category: "chemistry" },
    egfr: { unit: "mL/min/1.73m²", refMin: 90, refMax: null, category: "chemistry" },
    sodium: { unit: "mmol/L", refMin: 136, refMax: 145, category: "chemistry" },
    potassium: { unit: "mmol/L", refMin: 3.5, refMax: 5.1, category: "chemistry" },
    glucose: { unit: "mmol/L", refMin: 3.9, refMax: 5.6, category: "chemistry" },
    lactate: { unit: "mmol/L", refMin: 0.5, refMax: 2.2, category: "chemistry" },
    procalcitonin: { unit: "µg/L", refMin: 0, refMax: 0.1, category: "chemistry" },
    inr: { unit: "", refMin: 0.9, refMax: 1.15, category: "coagulation" },
};

interface BatchRow {
    analyte: string;
    value: string;
}

export function LabResultForm({ patientId, encounterId, onSuccess, onCancel }: Props) {
    const [mode, setMode] = useState<"single" | "batch">("batch");

    // Single mode
    const [analyte, setAnalyte] = useState("crp");
    const [value, setValue] = useState("");
    const [notes, setNotes] = useState("");

    // Batch mode
    const [batchRows, setBatchRows] = useState<BatchRow[]>([
        { analyte: "crp", value: "" },
        { analyte: "leukocytes", value: "" },
        { analyte: "hemoglobin", value: "" },
        { analyte: "creatinine", value: "" },
        { analyte: "potassium", value: "" },
    ]);
    const [orderNumber, setOrderNumber] = useState("");

    const createSingle = useCreateLabResult();
    const createBatch = useCreateLabResultBatch();
    const isSubmitting = createSingle.isPending || createBatch.isPending;

    function addBatchRow() {
        setBatchRows((prev) => [...prev, { analyte: "sodium", value: "" }]);
    }

    function removeBatchRow(idx: number) {
        setBatchRows((prev) => prev.filter((_, i) => i !== idx));
    }

    function updateBatchRow(idx: number, field: keyof BatchRow, val: string) {
        setBatchRows((prev) =>
            prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (mode === "single") {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) return;
            await createSingle.mutateAsync({
                patient_id: patientId,
                encounter_id: encounterId,
                analyte,
                value: numValue,
                notes: notes || undefined,
            });
        } else {
            const filledRows = batchRows.filter((r) => r.value.trim() !== "");
            if (filledRows.length === 0) return;

            await createBatch.mutateAsync({
                patient_id: patientId,
                encounter_id: encounterId,
                order_number: orderNumber || undefined,
                results: filledRows.map((r) => ({
                    patient_id: patientId,
                    analyte: r.analyte,
                    value: parseFloat(r.value),
                })),
            });
        }

        onSuccess?.();
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>🔬 Laborwerte erfassen</CardTitle>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setMode("single")}
                            className={`px-3 py-1 text-xs rounded-lg ${mode === "single" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                                }`}
                        >
                            Einzelwert
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("batch")}
                            className={`px-3 py-1 text-xs rounded-lg ${mode === "batch" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                                }`}
                        >
                            Batch (Blutentnahme)
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "single" ? (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Analyt *</label>
                                    <select
                                        value={analyte}
                                        onChange={(e) => setAnalyte(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                    >
                                        {Object.entries(LAB_ANALYTE_LABELS).map(([k, v]) => (
                                            <option key={k} value={k}>{v}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Wert * ({ANALYTE_DEFAULTS[analyte]?.unit ?? ""})
                                    </label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Notizen</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-slate-600 mb-1">Auftragsnummer</label>
                                <input
                                    type="text"
                                    value={orderNumber}
                                    onChange={(e) => setOrderNumber(e.target.value)}
                                    placeholder="z.B. LAB-2026-0842"
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                />
                            </div>
                            <div className="space-y-2">
                                {batchRows.map((row, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <select
                                            value={row.analyte}
                                            onChange={(e) => updateBatchRow(idx, "analyte", e.target.value)}
                                            className="flex-1 px-2 py-1.5 rounded border border-slate-200 text-sm"
                                        >
                                            {Object.entries(LAB_ANALYTE_LABELS).map(([k, v]) => (
                                                <option key={k} value={k}>{v}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="number"
                                            step="any"
                                            value={row.value}
                                            onChange={(e) => updateBatchRow(idx, "value", e.target.value)}
                                            placeholder={ANALYTE_DEFAULTS[row.analyte]?.unit ?? "Wert"}
                                            className="w-28 px-2 py-1.5 rounded border border-slate-200 text-sm"
                                        />
                                        <span className="text-xs text-slate-400 w-16 truncate">
                                            {ANALYTE_DEFAULTS[row.analyte]?.unit ?? ""}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => removeBatchRow(idx)}
                                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={addBatchRow}
                                    className="text-xs text-blue-600 hover:underline"
                                >
                                    + Wert hinzufügen
                                </button>
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {isSubmitting ? "Speichere…" : "Speichern"}
                        </button>
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-sm rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Abbrechen
                            </button>
                        )}
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
