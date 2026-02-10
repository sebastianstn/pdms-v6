"use client";

import { useState } from "react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
              onChange={(e) => setData({ ...data, [field.key]: e.target.value })}
              placeholder={field.placeholder}
              required={field.required}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          )}
        </div>
      ))}
      <div className="md:col-span-2 flex justify-end gap-3 mt-4">
        <button type="button" className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900">
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Speichern..." : "Speichern"}
        </button>
      </div>
    </form>
  );
}
