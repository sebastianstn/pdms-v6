"use client";

import { useState } from "react";
import { formatAHVInput, isValidAHV } from "@/lib/utils";

interface PatientFormProps {
  onSubmit: (data: Record<string, string>) => void;
  initialData?: Record<string, string>;
  isLoading?: boolean;
}

const FIELDS = [
  { key: "first_name", label: "Vorname", required: true },
  { key: "last_name", label: "Nachname", required: true },
  { key: "date_of_birth", label: "Geburtsdatum", type: "date", required: true },
  { key: "gender", label: "Geschlecht", type: "select", options: ["male", "female", "other", "unknown"] },
  { key: "ahv_number", label: "AHV-Nr.", placeholder: "756.XXXX.XXXX.XX" },
  { key: "phone", label: "Telefon" },
  { key: "email", label: "E-Mail", type: "email" },
  { key: "address_street", label: "Strasse" },
  { key: "address_zip", label: "PLZ" },
  { key: "address_city", label: "Ort" },
  { key: "address_canton", label: "Kanton", placeholder: "z.B. VD" },
];

export function PatientForm({ onSubmit, initialData = {}, isLoading }: PatientFormProps) {
  const [data, setData] = useState(initialData);
  const ahvValue = (data.ahv_number || "").trim();
  const hasAhvInput = ahvValue.length > 0;
  const ahvIsValid = !hasAhvInput || isValidAHV(ahvValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ahvIsValid) {
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {field.label}{field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {field.type === "select" ? (
            <select
              value={data[field.key] || ""}
              onChange={(e) => setData({ ...data, [field.key]: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">Bitte wählen</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          ) : (
            <input
              type={field.type || "text"}
              value={data[field.key] || ""}
              onChange={(e) => {
                const value = field.key === "ahv_number" ? formatAHVInput(e.target.value) : e.target.value;
                setData({ ...data, [field.key]: value });
              }}
              placeholder={field.placeholder}
              required={field.required}
              inputMode={field.key === "ahv_number" ? "numeric" : undefined}
              maxLength={field.key === "ahv_number" ? 16 : undefined}
              pattern={field.key === "ahv_number" ? "^756\\.\\d{4}\\.\\d{4}\\.\\d{2}$" : undefined}
              title={field.key === "ahv_number" ? "AHV muss dem Format 756.XXXX.XXXX.XX entsprechen" : undefined}
              aria-invalid={field.key === "ahv_number" ? hasAhvInput && !ahvIsValid : undefined}
              className={`w-full px-3 py-2 border rounded-lg text-sm ${field.key === "ahv_number" && hasAhvInput && !ahvIsValid
                  ? "border-red-300"
                  : field.key === "ahv_number" && hasAhvInput && ahvIsValid
                    ? "border-emerald-300"
                    : "border-slate-200"
                }`}
            />
          )}
          {field.key === "ahv_number" && (
            <>
              <p className="mt-1 text-xs text-slate-500">Die AHV beginnt immer mit 756.</p>
              {hasAhvInput && !ahvIsValid && (
                <p className="mt-1 text-xs text-red-600">Ungültige AHV: Bitte im Format 756.XXXX.XXXX.XX eingeben.</p>
              )}
              {hasAhvInput && ahvIsValid && <p className="mt-1 text-xs text-emerald-600">AHV-Format ist gültig.</p>}
            </>
          )}
        </div>
      ))}
      <div className="md:col-span-2 flex justify-end gap-3 mt-4">
        <button type="button" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isLoading || !ahvIsValid}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Speichern..." : "Speichern"}
        </button>
      </div>
    </form>
  );
}
