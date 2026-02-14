"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useCreateMedication, type MedicationCreate } from "@/hooks/use-medications";
import { useMedikamentSearch, type MedikamentResult } from "@/hooks/use-medikament-katalog";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui";

interface MedicationFormProps {
    patientId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

/** Debounce-Hook. */
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

const DOSE_UNITS = ["mg", "ml", "IE", "mcg", "g", "Tropfen", "Hübe", "Stk"];
const ROUTES = [
    { value: "oral", label: "Oral (p.o.)" },
    { value: "iv", label: "Intravenös (i.v.)" },
    { value: "sc", label: "Subkutan (s.c.)" },
    { value: "im", label: "Intramuskulär (i.m.)" },
    { value: "topisch", label: "Topisch" },
    { value: "inhalativ", label: "Inhalativ" },
    { value: "rektal", label: "Rektal" },
    { value: "sublingual", label: "Sublingual (s.l.)" },
    { value: "transdermal", label: "Transdermal (TTS)" },
    { value: "ophthalmisch", label: "Ophthalmisch (AT)" },
];

const FREQUENCIES = [
    "1x täglich",
    "2x täglich",
    "3x täglich",
    "4x täglich",
    "alle 4h",
    "alle 6h",
    "alle 8h",
    "alle 12h",
    "morgens",
    "abends",
    "bei Bedarf",
];

const INDIKATIONEN = [
    // ─── Schmerz ───────────────────────────────────────────
    "Schmerzen",
    "Schmerzen akut",
    "Schmerzen chronisch",
    "Schmerzen postoperativ",
    "Kopfschmerzen",
    "Migräne",
    "Rückenschmerzen",
    "Gelenkschmerzen",
    "Neuropathische Schmerzen",
    "Tumorschmerzen",
    "Koliken",
    "Dysmenorrhoe",
    // ─── Kardiovaskulär ────────────────────────────────────
    "Angina pectoris",
    "Arterielle Hypertonie",
    "Herzinsuffizienz",
    "Vorhofflimmern",
    "Tachykardie",
    "Bradykardie",
    "Herzrhythmusstörungen",
    "Koronare Herzkrankheit",
    "Myokardinfarkt",
    "Tiefe Beinvenenthrombose",
    "Lungenembolie",
    "Thromboseprophylaxe",
    "Periphere arterielle Verschlusskrankheit",
    "Ödeme",
    "Hypertensive Krise",
    // ─── Dyslipidämie ─────────────────────────────────────
    "Hypercholesterinämie",
    "Dyslipidämie",
    // ─── Diabetes ──────────────────────────────────────────
    "Diabetes mellitus Typ 1",
    "Diabetes mellitus Typ 2",
    "Hyperglykämie",
    "Hypoglykämie",
    "Diabetische Neuropathie",
    // ─── Gastrointestinal ──────────────────────────────────
    "Übelkeit",
    "Erbrechen",
    "Übelkeit und Erbrechen",
    "Übelkeit postoperativ",
    "Übelkeit Chemotherapie",
    "Gastroösophageale Refluxkrankheit",
    "Magenschutz",
    "Ulkusprophylaxe",
    "Gastritis",
    "Magenulkus",
    "Obstipation",
    "Diarrhoe",
    "Reizdarmsyndrom",
    "Morbus Crohn",
    "Colitis ulcerosa",
    "Blähungen",
    "Abdominalkrämpfe",
    "Leberzirrhose",
    "Aszites",
    // ─── Infektionen ──────────────────────────────────────
    "Bakterielle Infektion",
    "Pneumonie",
    "Harnwegsinfekt",
    "Sepsis",
    "Wundinfektion",
    "Hautinfektion",
    "Atemwegsinfekt",
    "Bronchitis",
    "Sinusitis",
    "Otitis media",
    "Pilzinfektion",
    "Candidose",
    "Tuberkulose",
    "MRSA-Infektion",
    "Endokarditis",
    "Meningitis",
    "Peritonitis",
    // ─── Atemwege ─────────────────────────────────────────
    "Dyspnoe",
    "Asthma bronchiale",
    "COPD",
    "COPD-Exazerbation",
    "Bronchospasmus",
    "Husten",
    "Mukostase",
    // ─── Neurologie / Psychiatrie ──────────────────────────
    "Depression",
    "Angststörung",
    "Schlafstörung",
    "Insomnie",
    "Agitiertheit",
    "Delir",
    "Epilepsie",
    "Krampfanfall",
    "Status epilepticus",
    "Morbus Parkinson",
    "Demenz",
    "Schizophrenie",
    "Psychose",
    "Bipolare Störung",
    "Spastik",
    "Muskelverspannung",
    "Tremor",
    "Restless-Legs-Syndrom",
    // ─── Rheumatologie / Entzündung ────────────────────────
    "Rheumatoide Arthritis",
    "Arthrose",
    "Gichtanfall",
    "Hyperurikämie",
    "Entzündung",
    "Autoimmunerkrankung",
    "Systemischer Lupus erythematodes",
    // ─── Allergie ─────────────────────────────────────────
    "Allergische Reaktion",
    "Anaphylaxie",
    "Urtikaria",
    "Allergische Rhinitis",
    "Juckreiz",
    // ─── Endokrinologie ───────────────────────────────────
    "Hypothyreose",
    "Hyperthyreose",
    "Nebenniereninsuffizienz",
    "Osteoporose",
    "Vitamin-D-Mangel",
    "Eisenmangel",
    "Eisenmangelanämie",
    "Vitamin-B12-Mangel",
    "Hyperkaliämie",
    "Hypokaliämie",
    "Hyponatriämie",
    "Hypokalzämie",
    "Hypomagnesiämie",
    // ─── Nephrologie / Urologie ────────────────────────────
    "Chronische Niereninsuffizienz",
    "Hyperphosphatämie",
    "Renale Anämie",
    "Benigne Prostatahyperplasie",
    "Harninkontinenz",
    "Überaktive Blase",
    "Harnverhalt",
    // ─── Onkologie ─────────────────────────────────────────
    "Tumorerkrankung",
    "Chemotherapie-Nebenwirkungen",
    "Neutropenie",
    "Tumoranämie",
    // ─── Palliativ ─────────────────────────────────────────
    "Palliative Symptomkontrolle",
    "Terminale Unruhe",
    "Rasselatmung",
    "Mundtrockenheit",
    // ─── Haut ──────────────────────────────────────────────
    "Ekzem",
    "Psoriasis",
    "Dekubitus",
    "Dermatitis",
    "Wundheilung",
    // ─── Auge ──────────────────────────────────────────────
    "Glaukom",
    "Konjunktivitis",
    "Trockene Augen",
    // ─── Gerinnung ─────────────────────────────────────────
    "Antikoagulation",
    "Schlaganfallprophylaxe",
    "Blutung",
    "Vitamin-K-Mangel",
    // ─── Sonstiges ─────────────────────────────────────────
    "Fieber",
    "Immunsuppression nach Transplantation",
    "Abstossungsprophylaxe",
    "Substitutionstherapie",
    "Volumensubstitution",
    "Elektrolytausgleich",
    "Prophylaxe",
    "Prämedikation",
    "Sedierung",
    "Narkose",
    "Reanimation",
];

export function MedicationForm({ patientId, onSuccess, onCancel }: MedicationFormProps) {
    const createMutation = useCreateMedication();
    const [form, setForm] = useState<Partial<MedicationCreate>>({
        patient_id: patientId,
        route: "oral",
        dose_unit: "mg",
        start_date: new Date().toISOString().split("T")[0],
        is_prn: false,
    });

    // ─── Medikamenten-Autosuggest ──────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // ─── Indikationen-Autosuggest ─────────────────────────
    const [showIndikationen, setShowIndikationen] = useState(false);
    const [indikHighlightIdx, setIndikHighlightIdx] = useState(-1);
    const indikDropdownRef = useRef<HTMLDivElement>(null);
    const filteredIndikationen = (form.reason?.length ?? 0) >= 1
        ? INDIKATIONEN.filter((ind) => ind.toLowerCase().includes((form.reason ?? "").toLowerCase()))
        : INDIKATIONEN;

    const debouncedQuery = useDebounce(searchQuery, 250);
    const { data: searchData } = useMedikamentSearch(debouncedQuery, showSuggestions);
    const suggestions = searchData?.results ?? [];

    // Klick ausserhalb schliesst Dropdowns
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
            if (indikDropdownRef.current && !indikDropdownRef.current.contains(e.target as Node)) {
                setShowIndikationen(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const selectSuggestion = useCallback((item: MedikamentResult) => {
        // Alle relevanten Felder automatisch ausfüllen
        const routeValue = item.route ?? "oral";
        const doseMatch = item.dosis?.match(/^([\d.,\/]+)\s*(mg|ml|IE|mcg|g|Tropfen|Hübe|Stk|mmol)?/i);
        setForm((prev) => ({
            ...prev,
            name: item.name,
            generic_name: item.wirkstoff,
            atc_code: item.atc_code ?? "",
            route: ROUTES.some((r) => r.value === routeValue) ? routeValue : "oral",
            dose: doseMatch?.[1] ?? item.dosis ?? "",
            dose_unit: doseMatch?.[2] ?? prev.dose_unit ?? "mg",
        }));
        setShowSuggestions(false);
        setHighlightIdx(-1);
    }, []);

    function update(field: string, value: string | boolean) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    const handleNameChange = (value: string) => {
        update("name", value);
        setSearchQuery(value);
        setShowSuggestions(value.length >= 2);
        setHighlightIdx(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightIdx((i) => (i + 1) % suggestions.length);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightIdx((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
        } else if (e.key === "Enter" && highlightIdx >= 0) {
            e.preventDefault();
            selectSuggestion(suggestions[highlightIdx]);
        } else if (e.key === "Escape") {
            setShowSuggestions(false);
        }
    };

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name || !form.dose || !form.dose_unit || !form.frequency || !form.start_date) return;

        await createMutation.mutateAsync(form as MedicationCreate);
        onSuccess?.();
    }

    const inputClass =
        "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500";
    const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Neues Medikament verordnen</CardTitle>
                    {onCancel && (
                        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300">
                            ✕
                        </button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Medikament + Wirkstoff (mit Autosuggest) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className={labelClass}>Medikament *</label>
                            <input
                                type="text"
                                placeholder="z.B. Dafalgan, Metformin, Xarelto"
                                value={form.name ?? ""}
                                onChange={(e) => handleNameChange(e.target.value)}
                                onFocus={() => { if ((form.name?.length ?? 0) >= 2) { setSearchQuery(form.name ?? ""); setShowSuggestions(true); }}}
                                onKeyDown={handleKeyDown}
                                className={inputClass}
                                autoComplete="off"
                                required
                                autoFocus
                            />
                            {/* ─── Suggestion Dropdown ─── */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div
                                    ref={dropdownRef}
                                    className="absolute z-50 left-0 right-0 mt-1 max-h-72 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg"
                                >
                                    {suggestions.map((item, idx) => (
                                        <button
                                            key={`${item.name}-${item.dosis}-${item.route}-${idx}`}
                                            type="button"
                                            onClick={() => selectSuggestion(item)}
                                            onMouseEnter={() => setHighlightIdx(idx)}
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                                idx === highlightIdx
                                                    ? "bg-blue-50 dark:bg-blue-900/30"
                                                    : "hover:bg-slate-50 dark:hover:bg-slate-700"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-slate-900 dark:text-slate-100">
                                                    {item.name}
                                                </span>
                                                {item.dosis && (
                                                    <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
                                                        {item.dosis}
                                                    </span>
                                                )}
                                                {item.route_label && (
                                                    <span className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                                        {item.route_label}
                                                    </span>
                                                )}
                                                {item.form && (
                                                    <span className="text-xs text-slate-400">
                                                        {item.form}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {item.wirkstoff}
                                                </span>
                                                {item.hersteller && (
                                                    <span className="text-xs text-slate-400 dark:text-slate-500">
                                                        — {item.hersteller}
                                                    </span>
                                                )}
                                                {item.atc_code && (
                                                    <span className="ml-auto text-xs font-mono text-slate-400">
                                                        {item.atc_code}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>Wirkstoff</label>
                            <input
                                type="text"
                                placeholder="z.B. Paracetamol"
                                value={form.generic_name ?? ""}
                                onChange={(e) => update("generic_name", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Dosierung */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Dosis *</label>
                            <input
                                type="text"
                                placeholder="z.B. 500"
                                value={form.dose ?? ""}
                                onChange={(e) => update("dose", e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Einheit *</label>
                            <select
                                value={form.dose_unit ?? "mg"}
                                onChange={(e) => update("dose_unit", e.target.value)}
                                className={inputClass}
                            >
                                {DOSE_UNITS.map((u) => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Verabreichungsweg</label>
                            <select
                                value={form.route ?? "oral"}
                                onChange={(e) => update("route", e.target.value)}
                                className={inputClass}
                            >
                                {ROUTES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Frequenz & Zeitraum */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className={labelClass}>Frequenz *</label>
                            <select
                                value={form.frequency ?? ""}
                                onChange={(e) => update("frequency", e.target.value)}
                                className={inputClass}
                                required
                            >
                                <option value="">Bitte wählen...</option>
                                {FREQUENCIES.map((f) => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Startdatum *</label>
                            <input
                                type="date"
                                value={form.start_date ?? ""}
                                onChange={(e) => update("start_date", e.target.value)}
                                className={inputClass}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Enddatum</label>
                            <input
                                type="date"
                                value={form.end_date ?? ""}
                                onChange={(e) => update("end_date", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Zusatzinfo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <label className={labelClass}>Indikation / Grund</label>
                            <input
                                type="text"
                                placeholder="z.B. Schmerzen, Angina pectoris"
                                value={form.reason ?? ""}
                                onChange={(e) => {
                                    update("reason", e.target.value);
                                    setShowIndikationen(true);
                                    setIndikHighlightIdx(-1);
                                }}
                                onFocus={() => setShowIndikationen(true)}
                                onKeyDown={(e) => {
                                    if (!showIndikationen || filteredIndikationen.length === 0) return;
                                    if (e.key === "ArrowDown") {
                                        e.preventDefault();
                                        setIndikHighlightIdx((i) => (i + 1) % filteredIndikationen.length);
                                    } else if (e.key === "ArrowUp") {
                                        e.preventDefault();
                                        setIndikHighlightIdx((i) => (i <= 0 ? filteredIndikationen.length - 1 : i - 1));
                                    } else if (e.key === "Enter" && indikHighlightIdx >= 0) {
                                        e.preventDefault();
                                        update("reason", filteredIndikationen[indikHighlightIdx]);
                                        setShowIndikationen(false);
                                        setIndikHighlightIdx(-1);
                                    } else if (e.key === "Escape") {
                                        setShowIndikationen(false);
                                    }
                                }}
                                autoComplete="off"
                                className={inputClass}
                            />
                            {showIndikationen && filteredIndikationen.length > 0 && (
                                <div
                                    ref={indikDropdownRef}
                                    className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg"
                                >
                                    {filteredIndikationen.map((ind, idx) => (
                                        <button
                                            key={ind}
                                            type="button"
                                            onClick={() => {
                                                update("reason", ind);
                                                setShowIndikationen(false);
                                                setIndikHighlightIdx(-1);
                                            }}
                                            onMouseEnter={() => setIndikHighlightIdx(idx)}
                                            className={`w-full text-left px-3 py-1.5 text-sm transition-colors ${
                                                idx === indikHighlightIdx
                                                    ? "bg-blue-50 dark:bg-blue-900/30 text-slate-900 dark:text-slate-100"
                                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                            }`}
                                        >
                                            {ind}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={labelClass}>ATC-Code</label>
                            <input
                                type="text"
                                placeholder="z.B. N02BE01"
                                value={form.atc_code ?? ""}
                                onChange={(e) => update("atc_code", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Besondere Hinweise</label>
                        <textarea
                            placeholder="z.B. Nicht nüchtern einnehmen"
                            value={form.notes ?? ""}
                            onChange={(e) => update("notes", e.target.value)}
                            className={`${inputClass} h-20 resize-none`}
                        />
                    </div>

                    {/* Bei Bedarf */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={form.is_prn ?? false}
                            onChange={(e) => update("is_prn", e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Bei Bedarf (pro re nata)</span>
                    </label>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        {onCancel && (
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                                Abbrechen
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={createMutation.isPending}
                            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {createMutation.isPending ? "Speichern..." : "Verordnung speichern"}
                        </button>
                    </div>

                    {createMutation.isError && (
                        <p className="text-sm text-red-500 mt-2">
                            Fehler: {(createMutation.error as Error).message}
                        </p>
                    )}
                </form>
            </CardContent>
        </Card>
    );
}
