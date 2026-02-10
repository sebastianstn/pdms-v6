"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { usePatients } from "@/hooks/use-patients";
import { useAlarmCounts, useAlarmWebSocket } from "@/hooks/use-alarms";
import { useTodayHomeVisits } from "@/hooks/use-home-visits";
import { PatientListSidebar } from "@/components/dashboard/patient-list-sidebar";
import { VitalMonitorChart } from "@/components/dashboard/vital-monitor-chart";
import { MedicationTimeline } from "@/components/dashboard/medication-timeline";
import { RemoteAlarms } from "@/components/dashboard/remote-alarms";
import { PatientDetailPanel } from "@/components/dashboard/patient-detail-panel";
import { HomeVisitPanel } from "@/components/dashboard/home-visit-panel";
import { RemoteDevicesPanel } from "@/components/dashboard/remote-devices-panel";
import { StatusBar } from "@/components/dashboard/status-bar";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: patients, isLoading: patientsLoading } = usePatients(1);
  const { data: alarmCounts } = useAlarmCounts();
  const { data: homeVisits } = useTodayHomeVisits();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  useAlarmWebSocket();

  const totalPatients = patients?.total ?? 0;
  const criticalAlarms = alarmCounts?.critical ?? 0;
  const totalVisits = homeVisits?.length ?? 0;
  const pendingVisits = (homeVisits ?? []).filter(
    (v) => !["completed", "cancelled"].includes(v.status)
  ).length;

  // Stat-Karten Daten
  const stats = [
    {
      label: "Patienten Zuhause",
      value: totalPatients,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M4 12 L12 6 L20 12 L20 20 L4 20 Z" />
          <line x1="12" y1="14" x2="12" y2="17" strokeLinecap="round" />
          <line x1="10.5" y1="15.5" x2="13.5" y2="15.5" strokeLinecap="round" />
        </svg>
      ),
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      sub: `${totalPatients} aktiv betreut`,
      progressPercent: 83,
    },
    {
      label: "Kritisch",
      value: criticalAlarms,
      icon: <span className="text-xl">⚠</span>,
      iconBg: "bg-red-50",
      iconColor: "text-red-500",
      sub: "Remote-Alarme aktiv",
      dots: criticalAlarms,
    },
    {
      label: "Hausbesuche heute",
      value: totalVisits,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M4 12 L12 6 L20 12 L20 20 L4 20 Z" />
          <circle cx="12" cy="15" r="2" />
        </svg>
      ),
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      sub: `${pendingVisits} noch ausstehend`,
      subColor: "text-emerald-600",
    },
    {
      label: "Teleconsults heute",
      value: 5,
      icon: (
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="7" width="13" height="10" rx="2" />
          <path d="M16 9 L21 6 L21 18 L16 15" strokeLinejoin="round" />
        </svg>
      ),
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      sub: "Nächste in 45 Min",
      subColor: "text-violet-600",
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5 shrink-0">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-extrabold text-slate-900 leading-none">
                  {patientsLoading ? "…" : stat.value}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{stat.label}</p>
              </div>
            </div>
            {/* Progress bar */}
            {stat.progressPercent !== undefined && (
              <div className="mt-3">
                <div className="h-1.5 bg-cyan-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all"
                    style={{ width: `${stat.progressPercent}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-1 text-center">{stat.sub}</p>
              </div>
            )}
            {/* Dot indicators */}
            {stat.dots !== undefined && (
              <div className="flex items-center gap-1.5 mt-3">
                {Array.from({ length: Math.min(stat.dots, 5) }).map((_, i) => (
                  <div key={i} className="w-2 h-2 rounded-full bg-red-300 animate-pulse" />
                ))}
                <span className="text-[9px] text-slate-400 ml-1">{stat.sub}</span>
              </div>
            )}
            {/* Simple sub text */}
            {!stat.progressPercent && stat.dots === undefined && (
              <p className={`text-[9px] font-semibold mt-3 ${stat.subColor || "text-slate-400"}`}>
                ● {stat.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 overflow-auto pb-2">

        {/* ─ Left: Patient List ─ */}
        <div className="col-span-12 lg:col-span-2 min-w-[180px]">
          <PatientListSidebar
            patients={patients?.items ?? []}
            isLoading={patientsLoading}
            selectedId={selectedPatientId}
            onSelect={setSelectedPatientId}
          />
        </div>

        {/* ─ Center: Vital Chart + Medication ─ */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <VitalMonitorChart patientId={selectedPatientId} />
          <MedicationTimeline patientId={selectedPatientId} />
        </div>

        {/* ─ Right: Alarms + Details + Visits + Devices ─ */}
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          {/* Alarms */}
          <RemoteAlarms />

          {/* Two-column: Patient Details + Home Visits */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <PatientDetailPanel patientId={selectedPatientId} />
            <HomeVisitPanel visits={homeVisits ?? []} />
          </div>

          {/* Remote Devices */}
          <RemoteDevicesPanel patientId={selectedPatientId} />
        </div>
      </div>

      {/* ── Status Bar ── */}
      <StatusBar />
    </div>
  );
}
