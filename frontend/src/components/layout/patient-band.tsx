"use client";

import { useParams } from "next/navigation";
import { usePatient } from "@/hooks/use-patients";
import { calculateAge, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { Spinner } from "@/components/ui";
import { User } from "lucide-react";

export function PatientBand() {
  const { patientId } = useParams<{ patientId: string }>();
  const { data: patient, isLoading, isError } = usePatient(patientId);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
        <Spinner size="md" />
        <span className="text-sm text-slate-500">Patient laden…</span>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-4 text-sm text-red-700">
        Patient konnte nicht geladen werden (ID: {patientId})
      </div>
    );
  }

  const age = calculateAge(patient.date_of_birth);
  const statusVariant =
    patient.status === "active" ? "success" :
      patient.status === "discharged" ? "default" : "danger";
  const statusLabel =
    patient.status === "active" ? "Aktiv" :
      patient.status === "discharged" ? "Entlassen" : "Verstorben";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-6">
      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <User className={`w-6 h-6 ${patient.gender === "female" ? "text-pink-500" : "text-blue-500"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-slate-900 truncate">
          {patient.last_name}, {patient.first_name}
        </h2>
        <p className="text-sm text-slate-500">
          {formatDate(patient.date_of_birth)} · {age} Jahre
          {patient.ahv_number ? ` · AHV ${patient.ahv_number}` : ""}
        </p>
      </div>
      <div className="flex gap-3 items-center text-sm text-slate-600 shrink-0">
        <Badge variant={statusVariant}>{statusLabel}</Badge>
        <span className="text-xs text-slate-400 font-mono">{patient.id.slice(0, 8)}</span>
      </div>
    </div>
  );
}
