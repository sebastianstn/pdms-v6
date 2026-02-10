"use client";

import { useMemo, useState } from "react";
import { Spinner } from "@/components/ui";
import { useWeekAppointments } from "@/hooks/use-appointments";
import type { Appointment, AppointmentStatus } from "@pdms/shared-types";
import { APPOINTMENT_TYPE_LABELS } from "@pdms/shared-types";

// ─── Helpers ──────────────────────────────────────────────────

function startOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function fmtISO(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function fmtTime(iso: string): string {
    return new Date(iso).toLocaleTimeString("de-CH", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

const DAY_NAMES = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const STATUS_COLOR: Record<AppointmentStatus, string> = {
    planned: "bg-blue-100 border-blue-300 text-blue-800",
    confirmed: "bg-slate-100 border-slate-300 text-slate-800",
    in_progress: "bg-amber-100 border-amber-300 text-amber-800",
    completed: "bg-green-100 border-green-300 text-green-800",
    cancelled: "bg-red-100 border-red-200 text-red-500 line-through",
    no_show: "bg-red-50 border-red-200 text-red-400",
};

// ─── Component ────────────────────────────────────────────────

interface WeekCalendarProps {
    patientId: string;
}

export function WeekCalendar({ patientId }: WeekCalendarProps) {
    const [weekOffset, setWeekOffset] = useState(0);

    const weekStart = useMemo(() => {
        return addDays(startOfWeek(new Date()), weekOffset * 7);
    }, [weekOffset]);

    const weekStartISO = fmtISO(weekStart);
    const { data, isLoading } = useWeekAppointments(patientId, weekStartISO);

    const days = useMemo(
        () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
        [weekStart],
    );

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => setWeekOffset((o) => o - 1)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                    ← Vorwoche
                </button>
                <div className="text-center">
                    <span className="text-sm font-medium text-slate-700">
                        {weekStart.toLocaleDateString("de-CH", {
                            day: "2-digit",
                            month: "long",
                        })}{" "}
                        –{" "}
                        {addDays(weekStart, 6).toLocaleDateString("de-CH", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                        })}
                    </span>
                    {weekOffset !== 0 && (
                        <button
                            onClick={() => setWeekOffset(0)}
                            className="ml-2 text-xs text-blue-600 hover:underline"
                        >
                            Heute
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setWeekOffset((o) => o + 1)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                    Nächste →
                </button>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Spinner size="lg" />
                </div>
            )}

            {/* Grid */}
            {data && (
                <div className="grid grid-cols-7 gap-1">
                    {days.map((day, i) => {
                        const iso = fmtISO(day);
                        const dayAppts: Appointment[] = data[iso] ?? [];
                        const isToday = iso === fmtISO(new Date());

                        return (
                            <div
                                key={iso}
                                className={`min-h-[120px] rounded-lg border p-2 ${isToday
                                    ? "border-blue-300 bg-blue-50/30"
                                    : "border-slate-200 bg-white"
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span
                                        className={`text-xs font-medium ${isToday ? "text-blue-700" : "text-slate-500"
                                            }`}
                                    >
                                        {DAY_NAMES[i]}
                                    </span>
                                    <span
                                        className={`text-xs ${isToday
                                            ? "bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center"
                                            : "text-slate-400"
                                            }`}
                                    >
                                        {day.getDate()}
                                    </span>
                                </div>

                                <div className="space-y-1">
                                    {dayAppts.map((a) => (
                                        <div
                                            key={a.id}
                                            className={`text-[10px] leading-tight p-1 rounded border ${STATUS_COLOR[a.status]
                                                }`}
                                            title={`${a.title}\n${APPOINTMENT_TYPE_LABELS[a.appointment_type]}\n${fmtTime(a.start_time)} (${a.duration_minutes} Min.)`}
                                        >
                                            <div className="font-medium truncate">{fmtTime(a.start_time)}</div>
                                            <div className="truncate">{a.title}</div>
                                        </div>
                                    ))}
                                    {dayAppts.length === 0 && (
                                        <p className="text-[10px] text-slate-300 text-center pt-4">—</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
