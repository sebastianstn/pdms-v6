"use client";

/**
 * DiagnosisForm — Formular zum Erstellen einer neuen Diagnose
 * mit ICD-10 Autovervollständigung.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useCreateDiagnosis } from "@/hooks/use-diagnoses";
import { useIcd10Search, type Icd10Result } from "@/hooks/use-icd10";
import type { DiagnosisType, DiagnosisSeverity } from "@pdms/shared-types";

interface Props {
    patientId: string;
    onSuccess?: () => void;
    onCancel?: () => void;
}

/** Debounce-Hook — verzögert einen Wert um `delay` ms. */
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

export function DiagnosisForm({ patientId, onSuccess, onCancel }: Props) {
    const createMutation = useCreateDiagnosis();

    const [title, setTitle] = useState("");
    const [icdCode, setIcdCode] = useState("");
    const [description, setDescription] = useState("");
    const [diagnosisType, setDiagnosisType] = useState<DiagnosisType>("haupt");
    const [severity, setSeverity] = useState<DiagnosisSeverity | "">("");
    const [bodySite, setBodySite] = useState("");
    const [laterality, setLaterality] = useState("");
    const [onsetDate, setOnsetDate] = useState("");
    const [notes, setNotes] = useState("");

    // ─── ICD-10 Autosuggest ────────────────────────────────
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeField, setActiveField] = useState<"title" | "icd" | null>(null);
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const debouncedQuery = useDebounce(searchQuery, 250);
    const { data: searchData } = useIcd10Search(debouncedQuery, showSuggestions);
    const suggestions = searchData?.results ?? [];

    // Klick ausserhalb schliesst Dropdown
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const selectSuggestion = useCallback((item: Icd10Result) => {
        setTitle(item.title);
        setIcdCode(item.code);
        setShowSuggestions(false);
        setHighlightIdx(-1);
    }, []);

    const handleTitleChange = (value: string) => {
        setTitle(value);
        setSearchQuery(value);
        setActiveField("title");
        setShowSuggestions(value.length >= 2);
        setHighlightIdx(-1);
    };

    const handleIcdChange = (value: string) => {
        setIcdCode(value);
        setSearchQuery(value);
        setActiveField("icd");
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        createMutation.mutate(
            {
                patient_id: patientId,
                title: title.trim(),
                icd_code: icdCode.trim() || undefined,
                description: description.trim() || undefined,
                diagnosis_type: diagnosisType,
                severity: (severity as DiagnosisSeverity) || undefined,
                body_site: bodySite.trim() || undefined,
                laterality: (laterality as "links" | "rechts" | "beidseits") || undefined,
                onset_date: onsetDate || undefined,
                notes: notes.trim() || undefined,
            },
            {
                onSuccess: () => {
                    setTitle("");
                    setIcdCode("");
                    setDescription("");
                    setDiagnosisType("haupt");
                    setSeverity("");
                    setBodySite("");
                    setLaterality("");
                    setOnsetDate("");
                    setNotes("");
                    onSuccess?.();
                },
            },
        );
    };

    const inputClass =
        "w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
    const labelClass = "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1";

    // ─── Suggestion Dropdown ───────────────────────────────
    const SuggestionDropdown = () => {
        if (!showSuggestions || suggestions.length === 0) return null;
        return (
            <div
                ref={dropdownRef}
                className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-auto rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-lg"
            >
                {suggestions.map((item, idx) => (
                    <button
                        key={item.code}
                        type="button"
                        onClick={() => selectSuggestion(item)}
                        onMouseEnter={() => setHighlightIdx(idx)}
                        className={`w-full text-left px-3 py-2 text-sm flex items-center gap-3 transition-colors ${idx === highlightIdx
                                ? "bg-blue-50 dark:bg-blue-900/30"
                                : "hover:bg-slate-50 dark:hover:bg-slate-700"
                            }`}
                    >
                        <span className="flex-shrink-0 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded min-w-[60px] text-center">
                            {item.code}
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                        </span>
                        {item.category && (
                            <span className="ml-auto flex-shrink-0 text-xs text-slate-400">
                                {item.category}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        );
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Neue Diagnose erfassen
            </h4>

            {/* Zeile 1: Titel + ICD-Code (mit Autosuggest) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 relative">
                    <label className={labelClass}>
                        Diagnose-Bezeichnung *
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        onFocus={() => { if (title.length >= 2) { setSearchQuery(title); setActiveField("title"); setShowSuggestions(true); } }}
                        onKeyDown={handleKeyDown}
                        placeholder="z.B. Herzinsuffizienz, Pneumonie"
                        required
                        autoComplete="off"
                        autoFocus
                        className={inputClass}
                    />
                    {activeField === "title" && <SuggestionDropdown />}
                </div>
                <div className="relative">
                    <label className={labelClass}>ICD-10 Code</label>
                    <input
                        type="text"
                        value={icdCode}
                        onChange={(e) => handleIcdChange(e.target.value)}
                        onFocus={() => { if (icdCode.length >= 2) { setSearchQuery(icdCode); setActiveField("icd"); setShowSuggestions(true); } }}
                        onKeyDown={handleKeyDown}
                        placeholder="z.B. I50.0"
                        autoComplete="off"
                        className={inputClass}
                    />
                    {activeField === "icd" && <SuggestionDropdown />}
                </div>
            </div>

            {/* Zeile 2: Typ + Schweregrad + Beginn */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                    <label className={labelClass}>Diagnose-Typ</label>
                    <select
                        value={diagnosisType}
                        onChange={(e) => setDiagnosisType(e.target.value as DiagnosisType)}
                        className={inputClass}
                    >
                        <option value="haupt">Hauptdiagnose</option>
                        <option value="neben">Nebendiagnose</option>
                        <option value="verdacht">Verdachtsdiagnose</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Schweregrad</label>
                    <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value as DiagnosisSeverity | "")}
                        className={inputClass}
                    >
                        <option value="">— nicht angegeben —</option>
                        <option value="leicht">Leicht</option>
                        <option value="mittel">Mittel</option>
                        <option value="schwer">Schwer</option>
                    </select>
                </div>
                <div>
                    <label className={labelClass}>Beginn (Onset)</label>
                    <input
                        type="date"
                        value={onsetDate}
                        onChange={(e) => setOnsetDate(e.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>

            {/* Zeile 3: Lokalisation + Seite */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                    <label className={labelClass}>Lokalisation</label>
                    <input
                        type="text"
                        value={bodySite}
                        onChange={(e) => setBodySite(e.target.value)}
                        placeholder="z.B. Lunge, Herz, Knie"
                        className={inputClass}
                    />
                </div>
                <div>
                    <label className={labelClass}>Seitenangabe</label>
                    <select
                        value={laterality}
                        onChange={(e) => setLaterality(e.target.value)}
                        className={inputClass}
                    >
                        <option value="">— nicht angegeben —</option>
                        <option value="links">Links</option>
                        <option value="rechts">Rechts</option>
                        <option value="beidseits">Beidseits</option>
                    </select>
                </div>
            </div>

            {/* Beschreibung */}
            <div>
                <label className={labelClass}>Beschreibung</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Detailbeschreibung der Diagnose..."
                    className={inputClass}
                />
            </div>

            {/* Notizen */}
            <div>
                <label className={labelClass}>Notizen</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Klinische Anmerkungen..."
                    className={inputClass}
                />
            </div>

            {/* Fehler */}
            {createMutation.isError && (
                <p className="text-sm text-red-600">
                    Fehler beim Erstellen der Diagnose. Bitte erneut versuchen.
                </p>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        Abbrechen
                    </button>
                )}
                <button
                    type="submit"
                    disabled={createMutation.isPending || !title.trim()}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {createMutation.isPending ? "Speichern..." : "Diagnose speichern"}
                </button>
            </div>
        </form>
    );
}
