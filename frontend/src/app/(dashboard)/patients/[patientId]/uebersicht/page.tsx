"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { DossierOverview } from "@/components/dossier";

export default function UebersichtPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const searchParams = useSearchParams();
  const epdRef = searchParams.get("epd_ref");
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyEpdRef = async () => {
    if (!epdRef) return;
    try {
      await navigator.clipboard.writeText(epdRef);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1800);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <div className="space-y-3">
      {epdRef && (
        <div
          className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs text-cyan-900"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              Diese Ansicht wurde über eine EPD-Referenz geöffnet.
              <span className="ml-1 font-semibold">Referenz: {epdRef}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyEpdRef}
              className="rounded-md border border-cyan-300 bg-white px-2 py-1 text-[11px] font-semibold text-cyan-800 hover:bg-cyan-100"
            >
              Kopieren
            </button>
          </div>
          {isCopied && (
            <div className="mt-2 inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
              In Zwischenablage kopiert.
            </div>
          )}
        </div>
      )}
      <DossierOverview patientId={patientId} />
    </div>
  );
}
