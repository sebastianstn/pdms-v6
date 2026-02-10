"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";
import { WeekCalendar } from "@/components/calendar/week-calendar";
import { AppointmentList } from "@/components/calendar/appointment-list";
import { DischargeTracker } from "@/components/calendar/discharge-tracker";
import { HomeVisitTimeline, TeleconsultPanel } from "@/components/home-spital";

export default function TerminePage() {
  const { patientId } = useParams<{ patientId: string }>();
  const [view, setView] = useState<"week" | "list">("week");

  return (
    <div className="space-y-6">
      {/* Calendar / List Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Termine</CardTitle>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setView("week")}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${view === "week"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                📅 Woche
              </button>
              <button
                onClick={() => setView("list")}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${view === "list"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                📋 Liste
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {view === "week" ? (
            <WeekCalendar patientId={patientId} />
          ) : (
            <AppointmentList patientId={patientId} />
          )}
        </CardContent>
      </Card>

      {/* Home-Spital: Hausbesuche + Telekonsultationen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HomeVisitTimeline patientId={patientId} />
        <TeleconsultPanel patientId={patientId} />
      </div>

      {/* Discharge Tracker */}
      <DischargeTracker patientId={patientId} />
    </div>
  );
}
