/** Fluid Balance (I/O-Bilanz) types. */

// ─── Direction & Category Types ────────────────────────────────

export type FluidDirection = "intake" | "output";

export type IntakeCategory = "infusion" | "oral" | "medication" | "blood_product" | "nutrition" | "other_intake";
export type OutputCategory = "urine" | "drain" | "vomit" | "stool" | "perspiratio" | "blood_loss" | "other_output";
export type FluidCategory = IntakeCategory | OutputCategory;

export type FluidRoute = "iv" | "oral" | "subcutaneous" | "rectal" | "ng_tube" | "catheter" | "other";

// ─── Labels ────────────────────────────────────────────────────

export const FLUID_DIRECTION_LABELS: Record<FluidDirection, string> = {
    intake: "Einfuhr",
    output: "Ausfuhr",
};

export const FLUID_CATEGORY_LABELS: Record<string, string> = {
    // Intake
    infusion: "Infusion",
    oral: "Oral",
    medication: "Medikamentös",
    blood_product: "Blutprodukt",
    nutrition: "Enterale Ernährung",
    other_intake: "Andere Einfuhr",
    // Output
    urine: "Urin",
    drain: "Drainage",
    vomit: "Erbrechen",
    stool: "Stuhl",
    perspiratio: "Perspiratio insensibilis",
    blood_loss: "Blutverlust",
    other_output: "Andere Ausfuhr",
};

export const INTAKE_CATEGORIES: IntakeCategory[] = [
    "infusion", "oral", "medication", "blood_product", "nutrition", "other_intake",
];

export const OUTPUT_CATEGORIES: OutputCategory[] = [
    "urine", "drain", "vomit", "stool", "perspiratio", "blood_loss", "other_output",
];

export const FLUID_ROUTE_LABELS: Record<FluidRoute, string> = {
    iv: "Intravenös",
    oral: "Oral",
    subcutaneous: "Subkutan",
    rectal: "Rektal",
    ng_tube: "Magensonde",
    catheter: "Katheter",
    other: "Andere",
};

// ─── Interfaces ────────────────────────────────────────────────

export interface FluidEntry {
    id: string;
    patient_id: string;
    encounter_id?: string;
    direction: FluidDirection;
    category: string;
    display_name: string;
    volume_ml: number;
    route?: FluidRoute;
    recorded_at: string;
    recorded_by?: string;
    notes?: string;
    created_at: string;
}

export interface FluidEntryCreate {
    patient_id: string;
    encounter_id?: string;
    direction: FluidDirection;
    category: string;
    display_name: string;
    volume_ml: number;
    route?: string;
    recorded_at?: string;
    notes?: string;
}

export interface FluidEntryUpdate {
    volume_ml?: number;
    display_name?: string;
    route?: string;
    notes?: string;
}

export interface FluidBalanceSummary {
    period_start: string;
    period_end: string;
    total_intake_ml: number;
    total_output_ml: number;
    balance_ml: number;
    intake_by_category: Record<string, number>;
    output_by_category: Record<string, number>;
    entry_count: number;
}

export interface FluidBalanceMeta {
    direction_labels: Record<string, string>;
    category_labels: Record<string, string>;
    intake_categories: string[];
    output_categories: string[];
    route_labels: Record<string, string>;
}
