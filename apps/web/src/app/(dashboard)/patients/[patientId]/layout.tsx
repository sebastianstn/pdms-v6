"use client";

import { PatientBand } from "@/components/layout/patient-band";
import { TabNavigation } from "@/components/layout/tab-navigation";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PatientBand />
      <TabNavigation />
      <div className="mt-4">{children}</div>
    </div>
  );
}
