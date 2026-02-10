"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import {
    useAdmitPatient,
    ENCOUNTER_TYPE_LABELS,
    type EncounterType,
    type EncounterCreate,
} from "@/hooks/use-encounters";

// ─── Props ────────────────────────────────────────────────────

interface AdmissionFormProps {
    patientId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// ─── Component ────────────────────────────────────────────────

export function AdmissionForm({ patientId, onSuccess, onCancel }: AdmissionFormProps) {
    const admitMut = useAdmitPatient();

    const [encounterType, setEncounterType] = useState<EncounterType>("hospitalization");
    const [ward, setWard] = useState("");
    const [bed, setBed] = useState("");
    const [reason, setReason] = useState("");

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const data: EncounterCreate = {
            patient_id: patientId,
            encounter_type: encounterType,
            ward: ward || undefined,
            bed: bed || undefined,
            reason: reason || undefined,
        };
        admitMut.mutate(data, { onSuccess });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h3 className="font-medium text-slate-800">Patienten-Aufnahme</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Typ */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                        Aufnahme-Typ *
                    </label>
                    <select
                        value={encounterType}
                        onChange={(e) => setEncounterType(e.target.value as EncounterType)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
                        required
                    >
                        {Object.entries(ENCOUNTER_TYPE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                        ))}
                    </select>
                </div>

                {/* Station */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                        Station
                    </label>
                    <input
                        type="text"
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="z.B. IPS-1, Med-3"
                        maxLength={50}
                    />
                </div>

                {/* Bett */}
                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">
                        Bett
                    </label>
                    <input
                        type="text"
                        value={bed}
                        onChange={(e) => setBed(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="z.B. 3a"
                        maxLength={20}
                    />
                </div>
            </div>

            {/* Grund */}
            <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">
                    Aufnahmegrund
                </label>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm min-h-[60px]"
                    placeholder="z.B. Herzinsuffizienz NYHA III, dekompensiert"
                />
            </div>

            {/* Error */}
            {admitMut.isError && (
                <p className="text-sm text-red-600">
                    Fehler: {admitMut.error?.message ?? "Aufnahme fehlgeschlagen"}
                </p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                <Button type="submit" disabled={admitMut.isPending}>
                    {admitMut.isPending ? "Aufnahme…" : "Aufnehmen"}
                </Button>
                {onCancel && (
                    <Button type="button" variant="secondary" onClick={onCancel}>
                        Abbrechen
                    </Button>
                )}
            </div>
        </form>
    );
}
