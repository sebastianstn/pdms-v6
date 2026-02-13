"use client";

import { useParams } from "next/navigation";
import { DossierOverview } from "@/components/dossier";

export default function UebersichtPage() {
  const { patientId } = useParams<{ patientId: string }>();

  return <DossierOverview patientId={patientId} />;
}
