"""Laboratory result Pydantic schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# ─── Analyte Catalogue ─────────────────────────────────────────

ANALYTES: dict[str, dict] = {
    "crp": {"display": "CRP", "loinc": "1988-5", "unit": "mg/L", "ref_min": 0, "ref_max": 5, "category": "chemistry"},
    "leukocytes": {"display": "Leukozyten", "loinc": "6690-2", "unit": "×10⁹/L", "ref_min": 4.0, "ref_max": 10.0, "category": "hematology"},
    "hemoglobin": {"display": "Hämoglobin", "loinc": "718-7", "unit": "g/L", "ref_min": 120, "ref_max": 160, "category": "hematology"},
    "thrombocytes": {"display": "Thrombozyten", "loinc": "777-3", "unit": "×10⁹/L", "ref_min": 150, "ref_max": 400, "category": "hematology"},
    "creatinine": {"display": "Kreatinin", "loinc": "2160-0", "unit": "µmol/L", "ref_min": 44, "ref_max": 97, "category": "chemistry"},
    "egfr": {"display": "eGFR", "loinc": "33914-3", "unit": "mL/min/1.73m²", "ref_min": 90, "ref_max": None, "category": "chemistry"},
    "urea": {"display": "Harnstoff", "loinc": "3091-6", "unit": "mmol/L", "ref_min": 2.1, "ref_max": 7.1, "category": "chemistry"},
    "sodium": {"display": "Natrium", "loinc": "2951-2", "unit": "mmol/L", "ref_min": 136, "ref_max": 145, "category": "chemistry"},
    "potassium": {"display": "Kalium", "loinc": "2823-3", "unit": "mmol/L", "ref_min": 3.5, "ref_max": 5.1, "category": "chemistry"},
    "glucose": {"display": "Glukose", "loinc": "2345-7", "unit": "mmol/L", "ref_min": 3.9, "ref_max": 5.6, "category": "chemistry"},
    "lactate": {"display": "Laktat", "loinc": "2524-7", "unit": "mmol/L", "ref_min": 0.5, "ref_max": 2.2, "category": "chemistry"},
    "procalcitonin": {"display": "Prokalzitonin", "loinc": "33959-8", "unit": "µg/L", "ref_min": 0, "ref_max": 0.1, "category": "chemistry"},
    "bilirubin": {"display": "Bilirubin (total)", "loinc": "1975-2", "unit": "µmol/L", "ref_min": 3, "ref_max": 21, "category": "chemistry"},
    "alt": {"display": "ALT (GPT)", "loinc": "1742-6", "unit": "U/L", "ref_min": 0, "ref_max": 35, "category": "chemistry"},
    "ast": {"display": "AST (GOT)", "loinc": "1920-8", "unit": "U/L", "ref_min": 0, "ref_max": 35, "category": "chemistry"},
    "albumin": {"display": "Albumin", "loinc": "1751-7", "unit": "g/L", "ref_min": 35, "ref_max": 52, "category": "chemistry"},
    "inr": {"display": "INR", "loinc": "6301-6", "unit": "", "ref_min": 0.9, "ref_max": 1.15, "category": "coagulation"},
    "d_dimer": {"display": "D-Dimer", "loinc": "48065-7", "unit": "mg/L FEU", "ref_min": 0, "ref_max": 0.5, "category": "coagulation"},
    "ph": {"display": "pH (arteriell)", "loinc": "2744-1", "unit": "", "ref_min": 7.35, "ref_max": 7.45, "category": "blood_gas"},
    "pco2": {"display": "pCO₂", "loinc": "2019-8", "unit": "kPa", "ref_min": 4.7, "ref_max": 6.0, "category": "blood_gas"},
    "po2": {"display": "pO₂", "loinc": "2703-7", "unit": "kPa", "ref_min": 10.0, "ref_max": 13.3, "category": "blood_gas"},
    "hba1c": {"display": "HbA1c", "loinc": "4548-4", "unit": "%", "ref_min": 4.0, "ref_max": 5.6, "category": "chemistry"},
}

ANALYTE_LABELS: dict[str, str] = {k: v["display"] for k, v in ANALYTES.items()}

LAB_CATEGORIES = ("chemistry", "hematology", "coagulation", "blood_gas", "urinalysis")

LAB_CATEGORY_LABELS: dict[str, str] = {
    "chemistry": "Klinische Chemie",
    "hematology": "Hämatologie",
    "coagulation": "Gerinnung",
    "blood_gas": "Blutgasanalyse",
    "urinalysis": "Urinanalyse",
}

FLAG_LABELS: dict[str, str] = {
    "H": "Hoch",
    "L": "Tief",
    "HH": "Kritisch hoch",
    "LL": "Kritisch tief",
}

INTERPRETATION_LABELS: dict[str, str] = {
    "normal": "Normal",
    "borderline": "Grenzwertig",
    "pathological": "Pathologisch",
    "critical": "Kritisch",
}


# ─── Schemas ────────────────────────────────────────────────────

class LabResultCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    analyte: str = Field(..., min_length=1, max_length=50)
    loinc_code: str | None = None
    display_name: str | None = None
    value: float
    unit: str | None = None
    ref_min: float | None = None
    ref_max: float | None = None
    flag: str | None = Field(None, pattern=r"^(H|L|HH|LL)$")
    category: str = Field("chemistry", pattern=r"^(chemistry|hematology|coagulation|blood_gas|urinalysis)$")
    sample_type: str | None = None
    collected_at: datetime | None = None
    order_number: str | None = None
    notes: str | None = None


class LabResultBatchCreate(BaseModel):
    """Create multiple results at once (e.g. from one blood draw)."""
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    order_number: str | None = None
    collected_at: datetime | None = None
    sample_type: str | None = None
    results: list[LabResultCreate] = Field(..., min_length=1)


class LabResultUpdate(BaseModel):
    value: float | None = None
    flag: str | None = Field(None, pattern=r"^(H|L|HH|LL)$")
    notes: str | None = None
    validated_by: uuid.UUID | None = None


class LabResultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    analyte: str
    loinc_code: str | None
    display_name: str
    value: float
    unit: str
    ref_min: float | None
    ref_max: float | None
    flag: str | None
    interpretation: str | None
    trend: str | None
    previous_value: float | None
    category: str
    sample_type: str | None
    collected_at: datetime | None
    resulted_at: datetime
    ordered_by: uuid.UUID | None
    validated_by: uuid.UUID | None
    order_number: str | None
    notes: str | None
    created_at: datetime


class PaginatedLabResults(BaseModel):
    items: list[LabResultResponse]
    total: int
    page: int = 1
    per_page: int = 50


class LabTrendPoint(BaseModel):
    """Single point in a trend series."""
    value: float
    resulted_at: datetime
    flag: str | None
    interpretation: str | None


class LabTrendResponse(BaseModel):
    """Trend data for one analyte."""
    analyte: str
    display_name: str
    unit: str
    ref_min: float | None
    ref_max: float | None
    points: list[LabTrendPoint]


class LabSummaryItem(BaseModel):
    """Latest value + trend for an analyte (used in mini-table)."""
    analyte: str
    display_name: str
    value: float
    unit: str
    ref_min: float | None
    ref_max: float | None
    flag: str | None
    interpretation: str | None
    trend: str | None
    resulted_at: datetime


class LabSummaryResponse(BaseModel):
    """Latest values for all analytes of a patient."""
    items: list[LabSummaryItem]
