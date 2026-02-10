"use client";

import { useParams } from "next/navigation";
import { PatientBand } from "@/components/layout/patient-band";
import { TabNavigation } from "@/components/layout/tab-navigation";
import { EncounterBanner } from "@/components/encounters/encounter-banner";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  const { patientId } = useParams<{ patientId: string }>();

  return (
    <div>
      <PatientBand />
      <div className="mt-3">
        <EncounterBanner patientId={patientId} />
      </div>
      <TabNavigation />
      <div className="mt-4">{children}</div>
    </div>
  );
}
