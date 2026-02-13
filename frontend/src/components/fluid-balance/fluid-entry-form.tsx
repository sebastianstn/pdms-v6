"use client";

/**
 * FluidEntryForm — Create a new fluid intake or output entry.
 *
 * Category options change based on direction selection.
 */

import { useState } from "react";
import { useCreateFluidEntry } from "@/hooks/use-fluid-balance";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";
import {
    FLUID_CATEGORY_LABELS,
    FLUID_ROUTE_LABELS,
    INTAKE_CATEGORIES,
    OUTPUT_CATEGORIES,
} from "@pdms/shared-types";
import type { FluidDirection } from "@pdms/shared-types";

interface Props {
    patientId: string;
    encounterId?: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

// Common quick-add presets
const PRESETS: { label: string; direction: FluidDirection; category: string; displayName: string; volume: number; route?: string }[] = [
    { label: "NaCl 0.9% 500ml", direction: "intake", category: "infusion", displayName: "NaCl 0.9% 500ml", volume: 500, route: "iv" },
    { label: "NaCl 0.9% 1000ml", direction: "intake", category: "infusion", displayName: "NaCl 0.9% 1000ml", volume: 1000, route: "iv" },
    { label: "Ringer 500ml", direction: "intake", category: "infusion", displayName: "Ringer-Laktat 500ml", volume: 500, route: "iv" },
    { label: "Wasser 200ml", direction: "intake", category: "oral", displayName: "Wasser 200ml", volume: 200, route: "oral" },
    { label: "Urin 300ml", direction: "output", category: "urine", displayName: "Urin", volume: 300, route: "catheter" },
    { label: "Perspiratio", direction: "output", category: "perspiratio", displayName: "Perspiratio insensibilis", volume: 500 },
];

export function FluidEntryForm({ patientId, encounterId, onSuccess, onCancel }: Props) {
    const [direction, setDirection] = useState<FluidDirection>("intake");
    const [category, setCategory] = useState("infusion");
    const [displayName, setDisplayName] = useState("");
    const [volumeMl, setVolumeMl] = useState("");
    const [route, setRoute] = useState<string>("");
    const [notes, setNotes] = useState("");

    const create = useCreateFluidEntry();

    const categories = direction === "intake" ? INTAKE_CATEGORIES : OUTPUT_CATEGORIES;

    function handleDirectionChange(dir: FluidDirection) {
        setDirection(dir);
        setCategory(dir === "intake" ? "infusion" : "urine");
    }

    function applyPreset(preset: typeof PRESETS[number]) {
        setDirection(preset.direction);
        setCategory(preset.category);
        setDisplayName(preset.displayName);
        setVolumeMl(String(preset.volume));
        setRoute(preset.route ?? "");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const vol = parseFloat(volumeMl);
        if (isNaN(vol) || vol <= 0) return;

        await create.mutateAsync({
            patient_id: patientId,
            encounter_id: encounterId,
            direction,
            category,
            display_name: displayName || FLUID_CATEGORY_LABELS[category] || category,
            volume_ml: vol,
            route: route || undefined,
            notes: notes || undefined,
        });

        // Reset form
        setDisplayName("");
        setVolumeMl("");
        setRoute("");
        setNotes("");
        onSuccess?.();
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Flüssigkeit erfassen</CardTitle>
            </CardHeader>
            <CardContent>
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {PRESETS.map((p) => (
                        <button
                            key={p.label}
                            type="button"
                            onClick={() => applyPreset(p)}
                            className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${p.direction === "intake"
                                    ? "border-blue-200 text-blue-600 hover:bg-blue-50"
                                    : "border-amber-200 text-amber-600 hover:bg-amber-50"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Direction Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => handleDirectionChange("intake")}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${direction === "intake"
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            ↓ Einfuhr
                        </button>
                        <button
                            type="button"
                            onClick={() => handleDirectionChange("output")}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${direction === "output"
                                    ? "bg-amber-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            ↑ Ausfuhr
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Category */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Kategorie *</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{FLUID_CATEGORY_LABELS[cat] ?? cat}</option>
                                ))}
                            </select>
                        </div>

                        {/* Volume */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Menge (mL) *</label>
                            <input
                                type="number"
                                step="any"
                                min="1"
                                value={volumeMl}
                                onChange={(e) => setVolumeMl(e.target.value)}
                                placeholder="z.B. 500"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Display Name */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Bezeichnung</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                placeholder={FLUID_CATEGORY_LABELS[category] ?? "Bezeichnung"}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            />
                        </div>

                        {/* Route */}
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Verabreichungsweg</label>
                            <select
                                value={route}
                                onChange={(e) => setRoute(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            >
                                <option value="">— keine Angabe —</option>
                                {Object.entries(FLUID_ROUTE_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Notizen</label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            placeholder="Optional…"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={create.isPending}
                            className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors disabled:opacity-50 ${direction === "intake"
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-amber-600 hover:bg-amber-700"
                                }`}
                        >
                            {create.isPending ? "Speichere…" : direction === "intake" ? "↓ Einfuhr erfassen" : "↑ Ausfuhr erfassen"}
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
