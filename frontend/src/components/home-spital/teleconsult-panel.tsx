"use client";

import { useTeleconsults, useStartTeleconsult, useEndTeleconsult } from "@/hooks/use-teleconsults";
import { Card, CardHeader, CardContent, CardTitle, Badge, Button, Spinner } from "@/components/ui";
import { TELECONSULT_STATUS_LABELS, TELECONSULT_PLATFORM_LABELS } from "@pdms/shared-types";
import type { Teleconsult, TeleconsultStatus } from "@pdms/shared-types";
import { useState } from "react";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    scheduled: "default",
    waiting: "info",
    active: "warning",
    completed: "success",
    no_show: "danger",
    technical_issue: "danger",
};

function fmtTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

function fmtDuration(minutes: number | null | undefined): string {
    if (!minutes) return "–";
    if (minutes < 60) return `${minutes} Min.`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h} Std. ${m} Min.` : `${h} Std.`;
}

interface TeleconsultPanelProps {
    patientId: string;
}

export function TeleconsultPanel({ patientId }: TeleconsultPanelProps) {
    const { data, isLoading } = useTeleconsults(patientId);
    const startMut = useStartTeleconsult(patientId);
    const endMut = useEndTeleconsult(patientId);

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <div className="flex justify-center py-8"><Spinner size="md" /></div>
                </CardContent>
            </Card>
        );
    }

    const teleconsults = data ?? [];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Telekonsultationen</CardTitle>
                    <Badge variant="default">{teleconsults.length}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                {teleconsults.length === 0 ? (
                    <p className="text-sm text-slate-500 py-4 text-center">Keine Telekonsultationen.</p>
                ) : (
                    <div className="space-y-3">
                        {teleconsults.map((tc) => (
                            <TeleconsultCard
                                key={tc.id}
                                teleconsult={tc}
                                patientId={patientId}
                                onStart={() => startMut.mutate(tc.id)}
                                onEnd={() => endMut.mutate(tc.id)}
                                isStarting={startMut.isPending}
                                isEnding={endMut.isPending}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

interface TeleconsultCardProps {
    teleconsult: Teleconsult;
    patientId: string;
    onStart: () => void;
    onEnd: () => void;
    isStarting: boolean;
    isEnding: boolean;
}

function TeleconsultCard({ teleconsult: tc, onStart, onEnd, isStarting, isEnding }: TeleconsultCardProps) {
    const [soapOpen, setSoapOpen] = useState(false);

    return (
        <div className="border border-slate-100 rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{tc.physician_name ?? "Arzt"}</span>
                    <Badge variant={STATUS_VARIANT[tc.status] ?? "default"}>
                        {TELECONSULT_STATUS_LABELS[tc.status as TeleconsultStatus] ?? tc.status}
                    </Badge>
                    {tc.meeting_platform && (
                        <span className="text-xs text-slate-500">
                            {TELECONSULT_PLATFORM_LABELS[tc.meeting_platform] ?? tc.meeting_platform}
                        </span>
                    )}
                </div>
                <span className="text-xs text-slate-500">
                    {fmtTime(tc.scheduled_start)}
                    {tc.duration_minutes && ` • ${fmtDuration(tc.duration_minutes)}`}
                </span>
            </div>

            {/* Meeting Link */}
            {tc.meeting_link && tc.status !== "completed" && (
                <a
                    href={tc.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                >
                    Meeting beitreten
                </a>
            )}

            {/* SOAP Notes Toggle */}
            {(tc.soap_subjective || tc.soap_objective || tc.soap_assessment || tc.soap_plan) && (
                <div>
                    <button
                        onClick={() => setSoapOpen(!soapOpen)}
                        className="text-xs text-slate-500 hover:text-slate-700 transition-colors"
                    >
                        {soapOpen ? "▾ SOAP-Notizen ausblenden" : "▸ SOAP-Notizen anzeigen"}
                    </button>
                    {soapOpen && (
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            {tc.soap_subjective && <div><span className="font-medium">S:</span> {tc.soap_subjective}</div>}
                            {tc.soap_objective && <div><span className="font-medium">O:</span> {tc.soap_objective}</div>}
                            {tc.soap_assessment && <div><span className="font-medium">A:</span> {tc.soap_assessment}</div>}
                            {tc.soap_plan && <div><span className="font-medium">P:</span> {tc.soap_plan}</div>}
                        </div>
                    )}
                </div>
            )}

            {/* Follow-up indicator */}
            {tc.followup_required && (
                <div className="text-xs text-amber-600 flex items-center gap-1">
                    Follow-up erforderlich
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
                {tc.status === "scheduled" && (
                    <Button size="sm" onClick={onStart} disabled={isStarting}>
                        {isStarting ? "Starte…" : "▶ Sitzung starten"}
                    </Button>
                )}
                {tc.status === "active" && (
                    <Button size="sm" variant="danger" onClick={onEnd} disabled={isEnding}>
                        {isEnding ? "Beende…" : "⏹ Sitzung beenden"}
                    </Button>
                )}
            </div>
        </div>
    );
}
