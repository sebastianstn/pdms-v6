"use client";

interface Alarm {
    id: string;
    message: string;
    patient: string;
    location: string;
    severity: "critical" | "warning";
    timeAgo: string;
    action: string;
}

const DEMO_ALARMS: Alarm[] = [
    {
        id: "1",
        message: "SpO₂ < 90%",
        patient: "M. Rossi",
        location: "Yverdon",
        severity: "critical",
        timeAgo: "vor 2 Min",
        action: "Anrufen",
    },
    {
        id: "2",
        message: "HR > 110 bpm",
        patient: "A. König",
        location: "Payerne",
        severity: "warning",
        timeAgo: "vor 8 Min",
        action: "Prüfen",
    },
    {
        id: "3",
        message: "Medikament nicht bestätigt",
        patient: "E. Fischer",
        location: "Fribourg",
        severity: "warning",
        timeAgo: "vor 22 Min",
        action: "Prüfen",
    },
];

export function RemoteAlarms() {
    const totalCount = DEMO_ALARMS.length;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-bold text-slate-900">Remote-Alarme</h3>
                <span className="text-[9px] font-semibold text-red-600 bg-red-50 px-2 py-1 rounded-md">
                    {totalCount} aktiv
                </span>
            </div>

            {/* Alarm List */}
            <div className="space-y-2">
                {DEMO_ALARMS.map((alarm) => (
                    <div
                        key={alarm.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border ${alarm.severity === "critical"
                                ? "bg-red-50 border-red-200"
                                : "bg-amber-50 border-amber-200"
                            }`}
                    >
                        {/* Pulse dot */}
                        <div className={`w-2 h-2 rounded-full shrink-0 ${alarm.severity === "critical" ? "bg-red-500" : "bg-amber-500"
                            }`}>
                            {alarm.severity === "critical" && (
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            )}
                        </div>

                        {/* Message */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-[11px] font-semibold ${alarm.severity === "critical" ? "text-red-700" : "text-amber-800"
                                }`}>
                                {alarm.message} — {alarm.patient} ({alarm.location})
                            </p>
                        </div>

                        {/* Time */}
                        <span className="text-[9px] text-slate-400 shrink-0">{alarm.timeAgo}</span>

                        {/* Action Button */}
                        <button className={`text-[9px] font-semibold text-white px-3 py-1 rounded-md shrink-0 ${alarm.severity === "critical"
                                ? "bg-gradient-to-r from-red-500 to-red-600"
                                : "bg-gradient-to-r from-amber-500 to-amber-600"
                            }`}>
                            {alarm.action}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
