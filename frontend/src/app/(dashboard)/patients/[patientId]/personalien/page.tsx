"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { usePatient } from "@/hooks/use-patients";
import { formatDate, calculateAge } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardTitle, Spinner, Badge } from "@/components/ui";
import { EncounterHistory } from "@/components/encounters/encounter-history";
import { AdmissionForm } from "@/components/encounters/admission-form";
import { InsuranceCard } from "@/components/patients/insurance-card";
import { ContactCard } from "@/components/patients/contact-card";
import { ProviderCard } from "@/components/patients/provider-card";

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
  const [showAdmission, setShowAdmission] = useState(false);

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
        </CardContent>
      </Card>

      {/* Aufenthaltshistorie */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Aufenthalte (Encounters)</CardTitle>
            <button
              onClick={() => setShowAdmission((v) => !v)}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              {showAdmission ? "Abbrechen" : "+ Aufnahme"}
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {showAdmission && (
            <div className="mb-6">
              <AdmissionForm
                patientId={patientId}
                onSuccess={() => setShowAdmission(false)}
                onCancel={() => setShowAdmission(false)}
              />
            </div>
          )}
          <EncounterHistory patientId={patientId} />
        </CardContent>
      </Card>

      {/* Versicherungen */}
      <Card className="lg:col-span-2">
        <CardContent>
          <InsuranceCard patientId={patientId} />
        </CardContent>
      </Card>

      {/* Kontaktpersonen */}
      <Card>
        <CardContent>
          <ContactCard patientId={patientId} />
        </CardContent>
      </Card>

      {/* Medizinische Zuweiser */}
      <Card>
        <CardContent>
          <ProviderCard patientId={patientId} />
        </CardContent>
      </Card>
    </div>
  );
}
