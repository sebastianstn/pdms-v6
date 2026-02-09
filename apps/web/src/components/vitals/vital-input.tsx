"use client";

import { useState } from "react";
import { VITAL_LABELS } from "@/lib/constants";

interface VitalInputProps {
  onSubmit: (data: Record<string, number>) => void;
  isLoading?: boolean;
}

export function VitalInput({ onSubmit, isLoading }: VitalInputProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericValues: Record<string, number> = {};
    for (const [key, val] of Object.entries(values)) {
      if (val) numericValues[key] = parseFloat(val);
    }
    onSubmit(numericValues);
    setValues({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(VITAL_LABELS).map(([key, meta]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {meta.label} ({meta.unit})
            </label>
            <input
              type="number"
              step="0.1"
              value={values[key] || ""}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              placeholder="—"
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {isLoading ? "Speichern..." : "Vitaldaten erfassen"}
      </button>
    </form>
  );
}
