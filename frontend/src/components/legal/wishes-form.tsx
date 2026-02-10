"use client";

import { usePatientWishes, useUpsertWishes } from "@/hooks/use-directives";
import { Card, CardHeader, CardContent, CardTitle, Spinner } from "@/components/ui";
import type { WishesUpsert } from "@pdms/shared-types";
import { useRef } from "react";

const FIELDS: { key: keyof WishesUpsert; label: string; placeholder: string }[] = [
    { key: "quality_of_life", label: "Lebensqualität", placeholder: "Was bedeutet Lebensqualität für Sie?" },
    { key: "autonomy_preferences", label: "Autonomie", placeholder: "Wie möchten Sie Entscheidungen treffen?" },
    { key: "pain_management", label: "Schmerzmanagement", placeholder: "Wünsche bezüglich Schmerzbehandlung" },
    { key: "decision_maker", label: "Entscheidungsträger (ZGB 378)", placeholder: "Name der vertretungsberechtigten Person" },
    { key: "sleep_preferences", label: "Schlaf", placeholder: "Schlafgewohnheiten, Rituale" },
    { key: "nutrition_preferences", label: "Ernährung", placeholder: "Ernährungswünsche, Diäten" },
    { key: "family_wishes", label: "Familie", placeholder: "Wünsche bezüglich Familienanwesenheit" },
    { key: "pet_info", label: "Haustiere", placeholder: "Informationen zu Haustieren" },
    { key: "spiritual_needs", label: "Spiritualität", placeholder: "Religiöse/spirituelle Bedürfnisse" },
    { key: "other_wishes", label: "Sonstige Wünsche", placeholder: "Weitere Wünsche und Präferenzen" },
];

interface WishesFormProps {
    patientId: string;
}

export function WishesForm({ patientId }: WishesFormProps) {
    const { data: wishes, isLoading } = usePatientWishes(patientId);
    const upsertMut = useUpsertWishes(patientId);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (isLoading) {
        return <Card><CardContent><div className="flex justify-center py-8"><Spinner size="md" /></div></CardContent></Card>;
    }

    // Auto-save with debounce
    const handleChange = (key: string, value: string) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            upsertMut.mutate({ [key]: value || undefined });
        }, 800);
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Mutmasslicher Wille (ZGB 378)</CardTitle>
                    {upsertMut.isPending && (
                        <span className="text-xs text-blue-600">Speichern...</span>
                    )}
                    {upsertMut.isSuccess && (
                        <span className="text-xs text-green-600">Gespeichert ✓</span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {FIELDS.map(({ key, label, placeholder }) => (
                        <div key={key}>
                            <label className="block text-xs font-medium text-slate-600 mb-1">
                                {label}
                            </label>
                            <textarea
                                defaultValue={(wishes as unknown as Record<string, string | undefined>)?.[key] ?? ""}
                                onChange={(e) => handleChange(key, e.target.value)}
                                placeholder={placeholder}
                                rows={2}
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    ))}
                </div>
                {wishes?.recorded_at && (
                    <p className="text-xs text-slate-400 mt-4">
                        Zuletzt aktualisiert: {new Date(wishes.updated_at).toLocaleString("de-CH")}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
