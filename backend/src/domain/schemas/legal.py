"""Legal Pydantic schemas — Consent, AdvanceDirective, PatientWishes, PalliativeCare, DeathNotification."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


# ════════════════════════════════════════════════════════════════
# Consent (Einwilligung)
# ════════════════════════════════════════════════════════════════

CONSENT_TYPES = (
    "home_spital", "iv_antibiotics", "telemedizin",
    "ndsg", "epdg", "thromboprophylaxe",
)

CONSENT_TYPE_LABELS: dict[str, str] = {
    "home_spital": "Home-Spital-Behandlung",
    "iv_antibiotics": "i.v.-Antibiotikatherapie",
    "telemedizin": "Telemedizin / Teleconsult",
    "ndsg": "Datenbearbeitung (nDSG)",
    "epdg": "Elektronisches Patientendossier (EPDG)",
    "thromboprophylaxe": "Thromboseprophylaxe",
}

CONSENT_STATUS_LABELS: dict[str, str] = {
    "pending": "Ausstehend",
    "granted": "Erteilt",
    "refused": "Verweigert",
    "revoked": "Widerrufen",
}


class ConsentCreate(BaseModel):
    patient_id: uuid.UUID
    consent_type: str = Field(..., pattern=r"^(home_spital|iv_antibiotics|telemedizin|ndsg|epdg|thromboprophylaxe)$")
    status: str = Field("pending", pattern=r"^(pending|granted|refused)$")
    granted_at: datetime | None = None
    granted_by: str | None = None
    valid_from: date | None = None
    valid_until: date | None = None
    witness_name: str | None = None
    notes: str | None = None


class ConsentUpdate(BaseModel):
    status: str | None = Field(None, pattern=r"^(pending|granted|refused|revoked)$")
    granted_at: datetime | None = None
    granted_by: str | None = None
    valid_from: date | None = None
    valid_until: date | None = None
    revoked_at: datetime | None = None
    revoked_reason: str | None = None
    witness_name: str | None = None
    notes: str | None = None


class ConsentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    consent_type: str
    status: str
    granted_at: datetime | None
    granted_by: str | None
    valid_from: date | None
    valid_until: date | None
    revoked_at: datetime | None
    revoked_reason: str | None
    witness_name: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class PaginatedConsents(BaseModel):
    items: list[ConsentResponse]
    total: int


# ════════════════════════════════════════════════════════════════
# AdvanceDirective (Patientenverfügung)
# ════════════════════════════════════════════════════════════════

DIRECTIVE_TYPE_LABELS: dict[str, str] = {
    "patientenverfuegung": "Patientenverfügung (FMH)",
    "vorsorgeauftrag": "Vorsorgeauftrag (ZGB Art. 360)",
}


class DirectiveCreate(BaseModel):
    patient_id: uuid.UUID
    directive_type: str = Field(..., pattern=r"^(patientenverfuegung|vorsorgeauftrag)$")
    rea_status: str = Field("FULL", pattern=r"^(FULL|DNR)$")
    intensive_care: bool = True
    mechanical_ventilation: bool = True
    dialysis: bool = True
    artificial_nutrition: bool = True
    trusted_person_name: str | None = None
    trusted_person_phone: str | None = None
    trusted_person_relation: str | None = None
    trusted_person_contact_id: uuid.UUID | None = None
    document_date: date | None = None
    storage_location: str | None = None
    notes: str | None = None


class DirectiveUpdate(BaseModel):
    rea_status: str | None = Field(None, pattern=r"^(FULL|DNR)$")
    intensive_care: bool | None = None
    mechanical_ventilation: bool | None = None
    dialysis: bool | None = None
    artificial_nutrition: bool | None = None
    trusted_person_name: str | None = None
    trusted_person_phone: str | None = None
    trusted_person_relation: str | None = None
    trusted_person_contact_id: uuid.UUID | None = None
    document_date: date | None = None
    storage_location: str | None = None
    is_valid: bool | None = None
    notes: str | None = None


class DirectiveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    directive_type: str
    rea_status: str
    intensive_care: bool
    mechanical_ventilation: bool
    dialysis: bool
    artificial_nutrition: bool
    trusted_person_name: str | None
    trusted_person_phone: str | None
    trusted_person_relation: str | None
    trusted_person_contact_id: uuid.UUID | None
    document_date: date | None
    storage_location: str | None
    is_valid: bool
    notes: str | None
    created_at: datetime
    updated_at: datetime


# ════════════════════════════════════════════════════════════════
# PatientWishes (Mutmasslicher Wille)
# ════════════════════════════════════════════════════════════════


class WishesUpsert(BaseModel):
    quality_of_life: str | None = None
    autonomy_preferences: str | None = None
    pain_management: str | None = None
    decision_maker: str | None = None
    decision_maker_contact_id: uuid.UUID | None = None
    sleep_preferences: str | None = None
    nutrition_preferences: str | None = None
    family_wishes: str | None = None
    pet_info: str | None = None
    spiritual_needs: str | None = None
    other_wishes: str | None = None


class WishesResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    quality_of_life: str | None
    autonomy_preferences: str | None
    pain_management: str | None
    decision_maker: str | None
    decision_maker_contact_id: uuid.UUID | None
    sleep_preferences: str | None
    nutrition_preferences: str | None
    family_wishes: str | None
    pet_info: str | None
    spiritual_needs: str | None
    other_wishes: str | None
    recorded_at: datetime
    updated_at: datetime


# ════════════════════════════════════════════════════════════════
# PalliativeCare
# ════════════════════════════════════════════════════════════════


class PalliativeUpsert(BaseModel):
    is_active: bool | None = None
    reserve_morphin: str | None = None
    reserve_midazolam: str | None = None
    reserve_haloperidol: str | None = None
    reserve_scopolamin: str | None = None
    reserve_other: str | None = None
    palliative_service_name: str | None = None
    palliative_service_phone: str | None = None
    palliative_service_email: str | None = None
    goals_of_care: str | None = None
    notes: str | None = None


class PalliativeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    is_active: bool
    activated_at: datetime | None
    activated_by: uuid.UUID | None
    reserve_morphin: str | None
    reserve_midazolam: str | None
    reserve_haloperidol: str | None
    reserve_scopolamin: str | None
    reserve_other: str | None
    palliative_service_name: str | None
    palliative_service_phone: str | None
    palliative_service_email: str | None
    goals_of_care: str | None
    notes: str | None
    updated_at: datetime


# ════════════════════════════════════════════════════════════════
# DeathNotification (Todesfall-Mitteilungen)
# ════════════════════════════════════════════════════════════════


class DeathNotificationCreate(BaseModel):
    patient_id: uuid.UUID
    contact_name: str = Field(..., min_length=1, max_length=200)
    contact_phone: str | None = None
    contact_email: str | None = None
    contact_role: str | None = None
    emergency_contact_id: uuid.UUID | None = None
    priority: int = Field(2, ge=1, le=3)
    instructions: str | None = None


class DeathNotificationUpdate(BaseModel):
    contact_name: str | None = Field(None, max_length=200)
    contact_phone: str | None = None
    contact_email: str | None = None
    contact_role: str | None = None
    emergency_contact_id: uuid.UUID | None = None
    priority: int | None = Field(None, ge=1, le=3)
    instructions: str | None = None


class DeathNotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    contact_name: str
    contact_phone: str | None
    contact_email: str | None
    contact_role: str | None
    emergency_contact_id: uuid.UUID | None
    priority: int
    instructions: str | None
    created_at: datetime
