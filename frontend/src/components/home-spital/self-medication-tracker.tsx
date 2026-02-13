"use client";

import { useSelfMedicationLogs, useConfirmMedication, useMissMedication, useSkipMedication } from "@/hooks/use-self-medication";
import { Card, CardHeader, CardContent, CardTitle, Badge, Button, Spinner } from "@/components/ui";
import { SELF_MED_STATUS_LABELS } from "@pdms/shared-types";
import type { SelfMedicationLog, SelfMedStatus } from "@pdms/shared-types";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    pending: "warning",
    confirmed: "success",
    missed: "danger",
    skipped: "default",
};

function fmtTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });
}

interface SelfMedicationTrackerProps {
    patientId: string;
}

export function SelfMedicationTracker({ patientId }: SelfMedicationTrackerProps) {
    const { data, isLoading } = useSelfMedicationLogs(patientId);
    const confirmMut = useConfirmMedication(patientId);
    const missMut = useMissMedication(patientId);
    const skipMut = useSkipMedication(patientId);

    if (isLoading) {
        return (
            <Card>
                <CardContent>
                    <div className="flex justify-center py-8"><Spinner size="md" /></div>
                </CardContent>
            </Card>
        );
    }

    const logs = data ?? [];
    const pending = logs.filter((l: SelfMedicationLog) => l.status === "pending").length;
    const missed = logs.filter((l: SelfMedicationLog) => l.status === "missed").length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Selbstmedikation</CardTitle>
                    <div className="flex items-center gap-2">
                        {pending > 0 && <Badge variant="warning">{pending} ausstehend</Badge>}
                        {missed > 0 && <Badge variant="danger">{missed} verpasst</Badge>}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <p className="text-sm text-slate-400 py-4 text-center">
                        Keine Selbstmedikations-Einträge.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {logs.map((log) => (
                            <MedicationLogRow
                                key={log.id}
                                log={log}
                                patientId={patientId}
                                onConfirm={() => confirmMut.mutate(log.id)}
                                onMiss={() => missMut.mutate(log.id)}
                                onSkip={() => skipMut.mutate(log.id)}
                                isBusy={confirmMut.isPending || missMut.isPending || skipMut.isPending}
                            />
                        ))}
                    </div>
                )}

                {/* Info Banner */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                    Die Selbstmedikation wird vom Patienten über die Patienten-App bestätigt.
                    Pflege kann Einträge manuell als «verpasst» oder «übersprungen» markieren.
                </div>
            </CardContent>
        </Card>
    );
}

interface MedicationLogRowProps {
    log: SelfMedicationLog;
    patientId: string;
    onConfirm: () => void;
    onMiss: () => void;
    onSkip: () => void;
    isBusy: boolean;
}

function MedicationLogRow({ log, onConfirm, onMiss, onSkip, isBusy }: MedicationLogRowProps) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">
                        {log.medication_id ?? "Medikament"}
                    </span>
                    <Badge variant={STATUS_VARIANT[log.status] ?? "default"}>
                        {SELF_MED_STATUS_LABELS[log.status as SelfMedStatus] ?? log.status}
                    </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                    Geplant: {fmtTime(log.scheduled_time)}
                    {log.confirmed_at && ` • Bestätigt: ${fmtTime(log.confirmed_at)}`}
                </p>
            </div>

            {/* Actions only for pending logs */}
            {log.status === "pending" && (
                <div className="flex gap-1">
                    <Button size="sm" onClick={onConfirm} disabled={isBusy}>
                        ✓
                    </Button>
                    <Button size="sm" variant="danger" onClick={onMiss} disabled={isBusy}>
                        ✗
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onSkip} disabled={isBusy}>
                        ⊘
                    </Button>
                </div>
            )}
        </div>
    );
}
