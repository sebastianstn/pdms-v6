"use client";

/**
 * ShiftHandoverList — Schichtübergaben (SBAR-Protokoll).
 */
import { useShiftHandovers, useAcknowledgeShiftHandover } from "@/hooks/use-shift-handovers";
import { Spinner } from "@/components/ui";
import { SHIFT_TYPE_LABELS, type ShiftType } from "@pdms/shared-types";
import { useState } from "react";

interface Props {
  patientId: string;
}

function shiftColor(s: ShiftType): string {
  switch (s) {
    case "early": return "bg-yellow-100 text-yellow-800";
    case "late": return "bg-orange-100 text-orange-800";
    case "night": return "bg-indigo-100 text-indigo-800";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit", month: "2-digit", year: "2-digit",
  });
}

function AcknowledgeButton({ handoverId }: { handoverId: string }) {
  const mutation = useAcknowledgeShiftHandover(handoverId);
  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {mutation.isPending ? "…" : "✓ Quittieren"}
    </button>
  );
}

export function ShiftHandoverList({ patientId }: Props) {
  const { data, isLoading, isError } = useShiftHandovers(patientId);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <div className="flex justify-center py-8"><Spinner size="sm" /></div>;
  if (isError) return <p className="text-sm text-red-600 text-center py-4">Übergaben konnten nicht geladen werden.</p>;

  const items = data?.items ?? [];
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 text-center py-4">Keine Schichtübergaben vorhanden.</p>;
  }

  return (
    <div className="space-y-3">
      {items.map((h) => (
        <div
          key={h.id}
          className="border border-slate-200 rounded-lg p-4 hover:border-slate-300 transition-colors cursor-pointer"
          onClick={() => setExpandedId(expandedId === h.id ? null : h.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${shiftColor(h.shift_type)}`}>
                {SHIFT_TYPE_LABELS[h.shift_type]}
              </span>
              <span className="text-sm text-slate-700">{formatDate(h.handover_date)}</span>
            </div>
            <div className="flex items-center gap-2">
              {h.acknowledged_at ? (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  ✓ Quittiert
                </span>
              ) : (
                <AcknowledgeButton handoverId={h.id} />
              )}
            </div>
          </div>

          {/* SBAR — immer Situation zeigen */}
          <div className="mt-3">
            <span className="text-xs font-semibold text-red-600 uppercase">S — Situation</span>
            <p className="text-sm text-slate-700 mt-0.5">{h.situation}</p>
          </div>

          {/* Expandiert: B, A, R */}
          {expandedId === h.id && (
            <div className="mt-2 space-y-2">
              {h.background && (
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase">B — Background</span>
                  <p className="text-sm text-slate-700 mt-0.5">{h.background}</p>
                </div>
              )}
              {h.assessment && (
                <div>
                  <span className="text-xs font-semibold text-amber-600 uppercase">A — Assessment</span>
                  <p className="text-sm text-slate-700 mt-0.5">{h.assessment}</p>
                </div>
              )}
              {h.recommendation && (
                <div>
                  <span className="text-xs font-semibold text-emerald-600 uppercase">R — Recommendation</span>
                  <p className="text-sm text-slate-700 mt-0.5">{h.recommendation}</p>
                </div>
              )}
              {h.open_tasks && Array.isArray(h.open_tasks) && h.open_tasks.length > 0 && (
                <div className="mt-2 border-t border-slate-100 pt-2">
                  <span className="text-xs font-medium text-slate-500">Offene Aufgaben</span>
                  <ul className="mt-1 space-y-1">
                    {h.open_tasks.map((task, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {(task as Record<string, string>).task ?? JSON.stringify(task)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
