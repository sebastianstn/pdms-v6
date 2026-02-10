/** Medication input validators. */

export interface MedicationValidationErrors {
    name?: string;
    dose?: string;
    dose_unit?: string;
    frequency?: string;
    start_date?: string;
    end_date?: string;
}

export function validateMedication(data: Record<string, unknown>): MedicationValidationErrors {
    const errors: MedicationValidationErrors = {};

    if (!data.name || String(data.name).trim().length < 2) {
        errors.name = "Medikamentenname ist erforderlich (mind. 2 Zeichen).";
    }
    if (!data.dose || String(data.dose).trim().length === 0) {
        errors.dose = "Dosis ist erforderlich.";
    }
    if (!data.dose_unit) {
        errors.dose_unit = "Dosiseinheit ist erforderlich.";
    }
    if (!data.frequency || String(data.frequency).trim().length === 0) {
        errors.frequency = "Frequenz ist erforderlich.";
    }
    if (!data.start_date) {
        errors.start_date = "Startdatum ist erforderlich.";
    }
    if (data.start_date && data.end_date) {
        const start = new Date(String(data.start_date));
        const end = new Date(String(data.end_date));
        if (end < start) {
            errors.end_date = "Enddatum darf nicht vor dem Startdatum liegen.";
        }
    }

    return errors;
}

export function isMedicationValid(data: Record<string, unknown>): boolean {
    return Object.keys(validateMedication(data)).length === 0;
}
