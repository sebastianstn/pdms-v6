"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PatientBand } from "@/components/layout/patient-band";
import { TabNavigation } from "@/components/layout/tab-navigation";
import { EncounterBanner } from "@/components/encounters/encounter-banner";
import { usePatient } from "@/hooks/use-patients";
import { ApiError } from "@/lib/api-client";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { patientId } = useParams<{ patientId: string }>();
  const router = useRouter();
  const patientQuery = usePatient(patientId);

  const isPatientNotFound =
    patientQuery.isError && patientQuery.error instanceof ApiError && patientQuery.error.status === 404;

  useEffect(() => {
    if (isPatientNotFound) {
      router.replace("/patients");
    }
  }, [isPatientNotFound, router]);

  if (isPatientNotFound) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-slate-500">
        Patient nicht gefunden – Weiterleitung zur Patientenliste…
      </div>
    );
  }

  return (
    <div className="-mt-6 -mx-6 -mb-6 flex flex-col h-[calc(100%+3rem)]">
      <div className="shrink-0 bg-slate-50 dark:bg-slate-950 px-6 pt-3 pb-2 shadow-sm z-10 border-b border-slate-200 dark:border-slate-700">
        <PatientBand />
        <div className="mt-1">
          <EncounterBanner patientId={patientId} />
        </div>
        <div className="mt-1">
          <TabNavigation />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
        {children}
      </div>
    </div>
  );
}
