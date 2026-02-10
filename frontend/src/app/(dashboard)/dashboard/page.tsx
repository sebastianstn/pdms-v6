"use client";

import { useAuth } from "@/providers/auth-provider";
import { usePatients } from "@/hooks/use-patients";
import { useAlarmCounts, useAlarmWebSocket } from "@/hooks/use-alarms";
import { useTodayHomeVisits } from "@/hooks/use-home-visits";
import { PatientCard } from "@/components/patients/patient-card";
import { AlarmPanel } from "@/components/vitals/alarm-panel";
import { HomeVisitTimeline } from "@/components/home-spital";
import { Card, CardHeader, CardContent, CardTitle, Badge, Spinner } from "@/components/ui";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: patients, isLoading: patientsLoading } = usePatients(1);
  const { data: alarmCounts, isLoading: alarmsLoading } = useAlarmCounts();

  const { data: homeVisits, isLoading: homeVisitsLoading } = useTodayHomeVisits();

  // WebSocket: Echtzeit-Alarm-Updates
  useAlarmWebSocket();

  const totalPatients = patients?.total ?? 0;
  const activeAlarms = alarmCounts?.total ?? 0;
  const criticalAlarms = alarmCounts?.critical ?? 0;
  const totalVisits = homeVisits?.length ?? 0;
  const pendingVisits = (homeVisits ?? []).filter(
    (v) => !["completed", "cancelled"].includes(v.status)
  ).length;

  const stats = [
    { label: "Patienten", value: totalPatients, icon: "👤", color: "bg-blue-50 text-blue-700" },
    { label: "Kritisch", value: criticalAlarms, icon: "🔴", color: "bg-red-50 text-red-700" },
    { label: "Alarme aktiv", value: activeAlarms, icon: "🔔", color: "bg-amber-50 text-amber-700" },
    { label: "Hausbesuche", value: homeVisitsLoading ? "…" : `${totalVisits} (${pendingVisits})`, icon: "🏠", color: "bg-teal-50 text-teal-700" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
      <p className="text-slate-500 mt-1">
        Willkommen, {user?.name || "Benutzer"}
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent>
              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-1">
                    {patientsLoading || alarmsLoading ? "…" : stat.value}
                  </p>
                </div>
                <span className={`text-2xl w-12 h-12 rounded-lg flex items-center justify-center ${stat.color}`}>
                  {stat.icon}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content areas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Patientenliste */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Patientenliste</CardTitle>
                <Link href="/patients" className="text-sm text-blue-600 hover:underline">
                  Alle anzeigen →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {patientsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : patients?.items?.length ? (
                <div className="space-y-2">
                  {patients.items.slice(0, 5).map((p) => (
                    <PatientCard
                      key={p.id}
                      id={p.id}
                      firstName={p.first_name}
                      lastName={p.last_name}
                      dateOfBirth={p.date_of_birth}
                      gender={p.gender}
                      status={p.status}
                      ahvNumber={p.ahv_number}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-8 text-center">Noch keine Patienten erfasst.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Aktive Alarme */}
        <AlarmPanel limit={8} />
      </div>

      {/* Hausbesuche Timeline */}
      <div className="mt-6">
        <HomeVisitTimeline />
      </div>
    </div>
  );
}
