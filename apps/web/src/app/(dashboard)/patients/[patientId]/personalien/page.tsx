"use client";

import { useParams } from "next/navigation";
import { usePatient } from "@/hooks/use-patients";
import { formatDate, calculateAge } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardTitle, Spinner, Badge } from "@/components/ui";

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value || "—"}</span>
    </div>
  );
}

export default function PersonalienPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const { data: patient, isLoading, isError } = usePatient(patientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-red-600 py-8 text-center">
            Patientendaten konnten nicht geladen werden.
          </p>
        </CardContent>
      </Card>
    );
  }

  const genderLabel =
    patient.gender === "male" ? "Männlich" :
      patient.gender === "female" ? "Weiblich" : patient.gender;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Stammdaten</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Nachname" value={patient.last_name} />
          <InfoRow label="Vorname" value={patient.first_name} />
          <InfoRow label="Geburtsdatum" value={formatDate(patient.date_of_birth)} />
          <InfoRow label="Alter" value={`${calculateAge(patient.date_of_birth)} Jahre`} />
          <InfoRow label="Geschlecht" value={genderLabel} />
          <InfoRow label="AHV-Nr." value={patient.ahv_number} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status</CardTitle>
            <Badge
              variant={
                patient.status === "active" ? "success" :
                  patient.status === "discharged" ? "default" : "danger"
              }
            >
              {patient.status === "active" ? "Aktiv" :
                patient.status === "discharged" ? "Entlassen" : "Verstorben"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <InfoRow label="Patienten-ID" value={patient.id} />
          <p className="text-xs text-slate-400 mt-4">
            Weitere Felder (Versicherung, Notfallkontakte, Aufenthalte) werden in Phase 2 ergänzt.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
