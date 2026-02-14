"use client";

import { Card, CardContent, Badge } from "@/components/ui";
import { TRANSPORT_TYPE_LABELS } from "@pdms/shared-types";
import type { TransportType } from "@pdms/shared-types";

const TRANSPORT_ICON: Record<string, string> = {
    ambulance: "AMB",
    patient_transport: "KTW",
    taxi: "Taxi",
    self: "Selbst",
};

interface TransportCardProps {
    transportType: TransportType;
    notes?: string | null;
    scheduledTime?: string | null;
    pickupAddress?: string | null;
}

export function TransportCard({ transportType, notes, scheduledTime, pickupAddress }: TransportCardProps) {
    const icon = TRANSPORT_ICON[transportType] ?? "KTW";
    const label = TRANSPORT_TYPE_LABELS[transportType] ?? transportType;

    return (
        <Card>
            <CardContent>
                <div className="flex items-start gap-3 py-2">
                    <span className="text-2xl">{icon}</span>
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-800">Transport</span>
                            <Badge variant="info">{label}</Badge>
                        </div>
                        {scheduledTime && (
                            <p className="text-xs text-slate-500">
                                Abholzeit: {new Date(scheduledTime).toLocaleTimeString("de-CH", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        )}
                        {pickupAddress && (
                            <p className="text-xs text-slate-500">{pickupAddress}</p>
                        )}
                        {notes && (
                            <p className="text-xs text-slate-500 mt-1">{notes}</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
