"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePatient } from "@/hooks/use-patients";
import { useDirectives } from "@/hooks/use-directives";
import { calculateAge, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { Spinner } from "@/components/ui";
import { User } from "lucide-react";

export function PatientBand() {
  const { patientId } = useParams<{ patientId: string }>();
  const { data: patient, isLoading, isError } = usePatient(patientId);
  const { data: directives } = useDirectives(patientId);
  const [photoLoadFailed, setPhotoLoadFailed] = useState(false);

  useEffect(() => {
    setPhotoLoadFailed(false);
  }, [patient?.photo_url]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-1 flex items-center gap-3">
        <Spinner size="md" />
        <span className="text-sm text-slate-500">Patient laden…</span>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-1 text-sm text-red-700">
        Patient konnte nicht geladen werden (ID: {patientId})
      </div>
    );
  }

  const age = calculateAge(patient.date_of_birth);

  // REA-Status aus der neuesten gültigen Verfügung
  const latestDirective = directives?.find((d) => d.is_valid);
  const reaStatus = latestDirective?.rea_status;

  // Geschlecht-Zeichen
  const genderSymbol =
    patient.gender === "female" ? "♀" :
      patient.gender === "male" ? "♂" : "⚧";
  const genderColor =
    patient.gender === "female" ? "text-pink-500" :
      patient.gender === "male" ? "text-blue-500" : "text-purple-500";

  const statusVariant =
    patient.status === "active" ? "success" :
      patient.status === "discharged" ? "default" : "danger";
  const statusLabel =
    patient.status === "active" ? "Aktiv" :
      patient.status === "discharged" ? "Entlassen" : "Verstorben";

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-1 flex items-center gap-3">
      {patient.photo_url && !photoLoadFailed ? (
        <img
          src={patient.photo_url}
          alt={`Patientenbild ${patient.first_name} ${patient.last_name}`}
          className="w-12 h-12 rounded-full border border-slate-200 object-cover shrink-0 bg-slate-50"
          onError={() => setPhotoLoadFailed(true)}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <User className={`w-6 h-6 ${patient.gender === "female" ? "text-pink-500" : "text-blue-500"}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-bold text-slate-900 truncate">
          {patient.last_name}, {patient.first_name}
          <span className={`ml-2 text-base font-normal ${genderColor}`}>{genderSymbol}</span>
        </h2>
        <p className="text-sm text-slate-500">
          {formatDate(patient.date_of_birth)} · {age} Jahre
          {patient.ahv_number ? ` · AHV ${patient.ahv_number}` : ""}
        </p>
      </div>
      <div className="flex gap-3 items-center text-sm text-slate-600 shrink-0">
        {reaStatus && (
          <Badge variant={reaStatus === "DNR" ? "danger" : "success"}>
            REA: {reaStatus}
          </Badge>
        )}
        <Badge variant={statusVariant}>{statusLabel}</Badge>
        <span className="text-xs text-slate-500 font-mono">{patient.id.slice(0, 8)}</span>
      </div>
    </div>
  );
}
