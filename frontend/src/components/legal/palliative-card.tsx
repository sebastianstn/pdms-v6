"use client";

import { usePalliativeCare, useUpsertPalliative } from "@/hooks/use-directives";
import { Card, CardHeader, CardContent, CardTitle, Spinner, Badge } from "@/components/ui";
import { useUserPermissions } from "@/hooks/use-rbac";
import type { PalliativeUpsert } from "@pdms/shared-types";
import { useRef } from "react";

interface PalliativeCardProps {
    patientId: string;
}

export function PalliativeCard({ patientId }: PalliativeCardProps) {
    const { data: palliative, isLoading } = usePalliativeCare(patientId);
    const upsertMut = useUpsertPalliative(patientId);
    const { canWrite } = useUserPermissions();
    const writable = canWrite("Patientenverfügungen");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    if (isLoading) {
        return <Card><CardContent><div className="flex justify-center py-8"><Spinner size="md" /></div></CardContent></Card>;
    }

    const save = (data: PalliativeUpsert) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => upsertMut.mutate(data), 600);
    };

    const isActive = palliative?.is_active ?? false;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CardTitle>Palliative Care</CardTitle>
                        <Badge variant={isActive ? "danger" : "default"}>
                            {isActive ? "Aktiv" : "Nicht aktiv"}
                        </Badge>
                    </div>
                    {writable && (
                        <button
                            onClick={() => upsertMut.mutate({ is_active: !isActive })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${isActive
                                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                : "bg-red-600 text-white hover:bg-red-700"
                                }`}
                        >
                            {isActive ? "Deaktivieren" : "Aktivieren"}
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {/* Reserve-Medikation */}
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Reserve-Medikation
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                            { key: "reserve_morphin", label: "Morphin" },
                            { key: "reserve_midazolam", label: "Midazolam" },
                            { key: "reserve_haloperidol", label: "Haloperidol" },
                            { key: "reserve_scopolamin", label: "Scopolamin" },
                        ].map(({ key, label }) => (
                            <div key={key}>
                                <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
                                <input
                                    defaultValue={(palliative as unknown as Record<string, string | undefined>)?.[key] ?? ""}
                                    onChange={(e) => save({ [key]: e.target.value || undefined })}
                                    placeholder="Dosierung / Applikationsweg"
                                    disabled={!writable}
                                    className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg ${!writable ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1">Weitere Reserve</label>
                        <textarea
                            defaultValue={palliative?.reserve_other ?? ""}
                            onChange={(e) => save({ reserve_other: e.target.value || undefined })}
                            rows={2}
                            disabled={!writable}
                            className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg ${!writable ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                        />
                    </div>
                </div>

                {/* EMSP Kontakt */}
                <div className="mb-4">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                        Palliativdienst (EMSP)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Name</label>
                            <input
                                defaultValue={palliative?.palliative_service_name ?? ""}
                                onChange={(e) => save({ palliative_service_name: e.target.value || undefined })}
                                disabled={!writable}
                                className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg ${!writable ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Telefon</label>
                            <input
                                defaultValue={palliative?.palliative_service_phone ?? ""}
                                onChange={(e) => save({ palliative_service_phone: e.target.value || undefined })}
                                disabled={!writable}
                                className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg ${!writable ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">E-Mail</label>
                            <input
                                defaultValue={palliative?.palliative_service_email ?? ""}
                                onChange={(e) => save({ palliative_service_email: e.target.value || undefined })}
                                disabled={!writable}
                                className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg ${!writable ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Behandlungsziele */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Behandlungsziele</label>
                    <textarea
                        defaultValue={palliative?.goals_of_care ?? ""}
                        onChange={(e) => save({ goals_of_care: e.target.value || undefined })}
                        rows={3}
                        placeholder="z.B. Symptomkontrolle, Lebensqualität, Begleitung..."
                        disabled={!writable}
                        className={`w-full px-3 py-2 text-sm border border-slate-200 rounded-lg ${!writable ? "opacity-60 cursor-not-allowed bg-slate-50" : ""}`}
                    />
                </div>

                {palliative?.updated_at && (
                    <p className="text-xs text-slate-500 mt-3">
                        Zuletzt aktualisiert: {new Date(palliative.updated_at).toLocaleString("de-CH")}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
