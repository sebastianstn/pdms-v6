"use client";

import { useAlarmCounts, useAlarmWebSocket } from "@/hooks/use-alarms";
import { AlarmList } from "@/components/vitals/alarm-list";
import { Card, CardHeader, CardContent, CardTitle, Badge } from "@/components/ui";
import { useState, useCallback } from "react";

interface AlarmPanelProps {
    /** Optionaler Patient-Filter */
    patientId?: string;
    /** Maximale Anzahl Alarme in der Liste */
    limit?: number;
}

export function AlarmPanel({ patientId, limit = 10 }: AlarmPanelProps) {
    const { data: counts } = useAlarmCounts();
    const [newAlarmFlash, setNewAlarmFlash] = useState(false);

    // WebSocket: Echtzeit-Updates
    const handleNewAlarm = useCallback(() => {
        setNewAlarmFlash(true);
        setTimeout(() => setNewAlarmFlash(false), 2000);
    }, []);

    useAlarmWebSocket(handleNewAlarm);

    return (
        <Card className={newAlarmFlash ? "ring-2 ring-red-400 transition-all" : "transition-all"}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        Aktive Alarme
                        {counts && counts.total > 0 && (
                            <Badge variant="danger">{counts.total}</Badge>
                        )}
                    </CardTitle>
                    <div className="flex gap-2">
                        {counts && counts.critical > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium animate-pulse">
                                🔴 {counts.critical} kritisch
                            </span>
                        )}
                        {counts && counts.warning > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                                🟡 {counts.warning} Warnungen
                            </span>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <AlarmList patientId={patientId} limit={limit} />
            </CardContent>
        </Card>
    );
}
