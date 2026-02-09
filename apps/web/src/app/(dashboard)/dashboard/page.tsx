"use client";

import { useAuth } from "@/providers/auth-provider";
import { usePatients } from "@/hooks/use-patients";
import { useAlarms } from "@/hooks/use-alarms";
import { PatientCard } from "@/components/patients/patient-card";
import { Card, CardHeader, CardContent, CardTitle, Badge, Spinner } from "@/components/ui";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: patients, isLoading: patientsLoading } = usePatients(1);
  const { data: alarms, isLoading: alarmsLoading } = useAlarms(false);

  const totalPatients = patients?.total ?? 0;
  const activeAlarms = alarms?.total ?? 0;
  const criticalAlarms = alarms?.items?.filter((a) => a.severity === "critical").length ?? 0;

  const stats = [
    { label: "Patienten", value: totalPatients, icon: "👤", color: "bg-blue-50 text-blue-700" },
    { label: "Kritisch", value: criticalAlarms, icon: "🔴", color: "bg-red-50 text-red-700" },
    { label: "Alarme aktiv", value: activeAlarms, icon: "🔔", color: "bg-amber-50 text-amber-700" },
    { label: "Aufnahmen heute", value: "—", icon: "🏥", color: "bg-green-50 text-green-700" },
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
        <Card>
          <CardHeader>
            <CardTitle>Aktive Alarme</CardTitle>
          </CardHeader>
          <CardContent>
            {alarmsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : alarms?.items?.length ? (
              <div className="space-y-3">
                {alarms.items.slice(0, 8).map((alarm) => (
                  <div
                    key={alarm.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-100"
                  >
                    <Badge variant={alarm.severity === "critical" ? "danger" : "warning"}>
                      {alarm.severity === "critical" ? "Kritisch" : "Warnung"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {alarm.parameter}
                      </p>
                      <p className="text-xs text-slate-500">
                        Wert: {alarm.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">Keine aktiven Alarme 🎉</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
