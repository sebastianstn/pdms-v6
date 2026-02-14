"use client";

import { useState, useMemo } from "react";
import {
    useAssessmentDefinitions,
    useCreateAssessment,
    type AssessmentCreate,
    type AssessmentType,
} from "@/hooks/use-nursing";
import { Card, CardHeader, CardContent, CardTitle, Spinner } from "@/components/ui";

interface AssessmentFormProps {
    patientId: string;
    assessmentType: AssessmentType;
    onSuccess?: () => void;
    onCancel: () => void;
}

export function AssessmentForm({ patientId, assessmentType, onSuccess, onCancel }: AssessmentFormProps) {
    const { data: definitions, isLoading } = useAssessmentDefinitions();
    const createMutation = useCreateAssessment(patientId);
    const [items, setItems] = useState<Record<string, number>>({});
    const [notes, setNotes] = useState("");

    const definition = definitions?.[assessmentType];

    // Compute total score from selected items
    const totalScore = useMemo(() => {
        return Object.values(items).reduce((sum, v) => sum + v, 0);
    }, [items]);

    // Check completeness
    const allItemsFilled = definition
        ? Object.keys(definition.items).every((key) => items[key] !== undefined)
        : false;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!definition || !allItemsFilled) return;

        const data: AssessmentCreate = {
            patient_id: patientId,
            assessment_type: assessmentType,
            total_score: totalScore,
            items,
            notes: notes || undefined,
        };

        await createMutation.mutateAsync(data);
        onSuccess?.();
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!definition) {
        return <p className="text-sm text-red-500">Assessment-Definition nicht gefunden.</p>;
    }

    const inputClass =
        "w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{definition.name}</CardTitle>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-slate-900">{totalScore}</span>
                        <span className="text-sm text-slate-500 ml-1">/ {definition.max_score}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Assessment Items */}
                    {Object.entries(definition.items).map(([key, itemDef]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {itemDef.label}
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {itemDef.options.map((opt) => {
                                    const isSelected = items[key] === opt;
                                    return (
                                        <button
                                            key={opt}
                                            type="button"
                                            onClick={() =>
                                                setItems((prev) => ({ ...prev, [key]: opt }))
                                            }
                                            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${isSelected
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Risk level indicator */}
                    {allItemsFilled && definition.risk_levels && (
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                            <span className="text-xs text-slate-500">Automatische Risikobewertung: </span>
                            <span className="text-sm font-medium text-slate-900">
                                {definition.risk_levels.find((r) => totalScore <= r.max)?.label || "—"}
                            </span>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Bemerkungen</label>
                        <textarea
                            className={`${inputClass} min-h-[80px] resize-y`}
                            placeholder="Optionale Bemerkungen zum Assessment..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={createMutation.isPending || !allItemsFilled}
                            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {createMutation.isPending ? "Speichere..." : "Assessment speichern"}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Abbrechen
                        </button>
                    </div>

                    {createMutation.isError && (
                        <p className="text-sm text-red-500">Fehler beim Speichern des Assessments.</p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
