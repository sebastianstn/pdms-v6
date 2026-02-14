"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreatePatient } from "@/hooks/use-patients";
import { formatAHVInput, isValidAHV } from "@/lib/utils";

export default function NewPatientPage() {
    const router = useRouter();
    const createPatient = useCreatePatient();
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        date_of_birth: "",
        gender: "male" as "male" | "female" | "other",
        ahv_number: "",
    });

    const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((prev) => ({ ...prev, [field]: e.target.value }));

    const setAhvNumber = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, ahv_number: formatAHVInput(e.target.value) }));

    const hasAhvInput = form.ahv_number.trim().length > 0;
    const ahvIsValid = !hasAhvInput || isValidAHV(form.ahv_number);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ahvIsValid) {
            return;
        }
        try {
            const patient = await createPatient.mutateAsync(form);
            router.push(`/patients/${patient.id}/personalien`);
        } catch (err) {
            console.error("Patient erstellen fehlgeschlagen:", err);
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Neuer Patient</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-slate-200 p-6">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Vorname *</label>
                        <input
                            type="text"
                            required
                            value={form.first_name}
                            onChange={set("first_name")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Max"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nachname *</label>
                        <input
                            type="text"
                            required
                            value={form.last_name}
                            onChange={set("last_name")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Mustermann"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Geburtsdatum *</label>
                        <input
                            type="date"
                            required
                            value={form.date_of_birth}
                            onChange={set("date_of_birth")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Geschlecht *</label>
                        <select
                            required
                            value={form.gender}
                            onChange={set("gender")}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                            <option value="male">Männlich</option>
                            <option value="female">Weiblich</option>
                            <option value="other">Andere</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">AHV-Nummer</label>
                    <input
                        type="text"
                        value={form.ahv_number}
                        onChange={setAhvNumber}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${hasAhvInput && !ahvIsValid
                                ? "border-red-300 focus:ring-red-500"
                                : hasAhvInput && ahvIsValid
                                    ? "border-emerald-300 focus:ring-emerald-500"
                                    : "border-slate-200 focus:ring-blue-500"
                            }`}
                        placeholder="756.XXXX.XXXX.XX"
                        inputMode="numeric"
                        maxLength={16}
                        pattern="^756\.\d{4}\.\d{4}\.\d{2}$"
                        title="AHV muss dem Format 756.XXXX.XXXX.XX entsprechen"
                        aria-invalid={hasAhvInput && !ahvIsValid}
                    />
                    <p className="mt-1 text-xs text-slate-500">Die AHV beginnt immer mit 756.</p>
                    {hasAhvInput && !ahvIsValid && (
                        <p className="mt-1 text-xs text-red-600">Ungültige AHV: Bitte im Format 756.XXXX.XXXX.XX eingeben.</p>
                    )}
                    {hasAhvInput && ahvIsValid && <p className="mt-1 text-xs text-emerald-600">AHV-Format ist gültig.</p>}
                </div>

                {createPatient.isError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        Fehler beim Erstellen des Patienten. Bitte versuchen Sie es erneut.
                    </div>
                )}

                <div className="flex gap-3 justify-end pt-2">
                    <button
                        type="button"
                        onClick={() => router.push("/patients")}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Abbrechen
                    </button>
                    <button
                        type="submit"
                        disabled={createPatient.isPending || !ahvIsValid}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {createPatient.isPending ? "Erstelle…" : "Patient erstellen"}
                    </button>
                </div>
            </form>
        </div>
    );
}
