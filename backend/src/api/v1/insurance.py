"""Insurance API endpoints — CRUD for patient insurances."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.models.patient import Insurance, InsuranceCompany

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
AdminUser = Annotated[dict, Depends(require_role("admin"))]


# ─── Schemas ───────────────────────────────────────────────────

INSURANCE_TYPE_LABELS = {
    "grundversicherung": "Grundversicherung (KVG)",
    "zusatz": "Zusatzversicherung (VVG)",
    "unfall": "Unfallversicherung (UVG)",
    "iv": "Invalidenversicherung (IV)",
}

GARANT_LABELS = {
    "tiers_payant": "Tiers payant (Versicherung zahlt direkt)",
    "tiers_garant": "Tiers garant (Patient zahlt, Rückerstattung)",
}

GARANT_ALIASES = {
    "tiers_payant": "tiers_payant",
    "tiers_garant": "tiers_garant",
    # Legacy-Frontend-Werte (Abwärtskompatibilität)
    "versicherung": "tiers_payant",
    "patient": "tiers_garant",
    # Kanton als Kostenträger wird hier wie direkter Zahler behandelt
    "kanton": "tiers_payant",
}

DEFAULT_INSURERS = [
    "Aquilana",
    "Assura",
    "Atupri",
    "Avenir",
    "CONCORDIA",
    "CSS",
    "EGK",
    "Galenos",
    "Groupe Mutuel",
    "Helsana",
    "KLuG",
    "KPT",
    "Kolping",
    "Mutuel",
    "ÖKK",
    "Philos",
    "Sanitas",
    "SLKK",
    "Sodalis",
    "Sumiswalder",
    "SWICA",
    "Sympany",
    "Visana",
    "vita surselva",
    "Vivacare",
]

LOGO_COLORS = [
    "#2563EB",  # blue
    "#0891B2",  # cyan
    "#0D9488",  # teal
    "#16A34A",  # green
    "#CA8A04",  # yellow
    "#EA580C",  # orange
    "#DC2626",  # red
    "#9333EA",  # violet
]


def _normalize_garant(value: str | None) -> str | None:
    """Normalisiert Garant-Werte auf kanonische DB-Werte."""
    if value is None:
        return None

    normalized = GARANT_ALIASES.get(value.strip().lower())
    if normalized is None:
        raise HTTPException(status_code=422, detail="Ungültiger Garant-Wert")
    return normalized


async def _ensure_default_insurers(session: AsyncSession) -> list[InsuranceCompany]:
    """Stellt sicher, dass der Standardkatalog vollständig vorhanden ist (inkl. Sympany)."""
    all_companies = (await session.execute(select(InsuranceCompany))).scalars().all()
    by_name = {c.name.casefold(): c for c in all_companies}

    for name in DEFAULT_INSURERS:
        if name.casefold() not in by_name:
            session.add(InsuranceCompany(name=name))

    await session.flush()

    active = (
        await session.execute(
            select(InsuranceCompany).where(InsuranceCompany.is_active.is_(True)).order_by(InsuranceCompany.name)
        )
    ).scalars().all()
    return list(active)


def _logo_text(name: str) -> str:
    """Erzeugt kurzes Logo-Kürzel aus Versicherernamen."""
    tokens = [t for t in name.replace("-", " ").split() if t]
    if not tokens:
        return "VS"
    if len(tokens) == 1:
        return tokens[0][:2].upper()
    return f"{tokens[0][0]}{tokens[1][0]}".upper()


def _logo_color(name: str) -> str:
    """Stabile Farbzuordnung pro Versicherer."""
    idx = abs(hash(name.casefold())) % len(LOGO_COLORS)
    return LOGO_COLORS[idx]


class InsuranceCreate(BaseModel):
    patient_id: uuid.UUID
    insurer_name: str = Field(..., max_length=255)
    policy_number: str = Field(..., max_length=50)
    insurance_type: str = Field(..., pattern=r"^(grundversicherung|zusatz|unfall|iv)$")
    valid_from: date | None = None
    valid_until: date | None = None
    franchise: int | None = None
    kostengutsprache: bool = False
    kostengutsprache_bis: date | None = None
    garant: str | None = None
    bvg_number: str | None = None
    notes: str | None = None


class InsuranceUpdate(BaseModel):
    insurer_name: str | None = Field(None, max_length=255)
    policy_number: str | None = Field(None, max_length=50)
    insurance_type: str | None = Field(None, pattern=r"^(grundversicherung|zusatz|unfall|iv)$")
    valid_from: date | None = None
    valid_until: date | None = None
    franchise: int | None = None
    kostengutsprache: bool | None = None
    kostengutsprache_bis: date | None = None
    garant: str | None = None
    bvg_number: str | None = None
    notes: str | None = None


class InsuranceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    patient_id: uuid.UUID
    insurer_name: str
    policy_number: str
    insurance_type: str
    valid_from: date | None
    valid_until: date | None
    franchise: int | None
    kostengutsprache: bool
    kostengutsprache_bis: date | None
    garant: str | None
    bvg_number: str | None
    notes: str | None


class InsuranceProviderResponse(BaseModel):
    id: uuid.UUID
    name: str
    is_active: bool
    supports_basic: bool
    supports_semi_private: bool
    supports_private: bool
    logo_text: str
    logo_color: str


class InsuranceCompanyCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    supports_basic: bool = True
    supports_semi_private: bool = True
    supports_private: bool = True


class InsuranceCompanyUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=255)
    is_active: bool | None = None
    supports_basic: bool | None = None
    supports_semi_private: bool | None = None
    supports_private: bool | None = None


class InsuranceCompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    is_active: bool
    supports_basic: bool
    supports_semi_private: bool
    supports_private: bool
    logo_text: str
    logo_color: str


# ─── Endpoints ─────────────────────────────────────────────────


@router.get("/insurance/meta")
async def insurance_meta(user: CurrentUser):
    return {
        "insurance_types": INSURANCE_TYPE_LABELS,
        "garant_options": GARANT_LABELS,
    }


@router.get("/insurance/providers", response_model=list[InsuranceProviderResponse])
async def insurance_providers(
    db: DbSession,
    user: CurrentUser,
    coverage: str | None = Query(None, pattern=r"^(basic|semi_private|private)$"),
):
    """Liste aktiver Versicherer (optional nach Deckungsart gefiltert)."""
    companies = await _ensure_default_insurers(db)

    if coverage == "basic":
        companies = [c for c in companies if c.supports_basic]
    elif coverage == "semi_private":
        companies = [c for c in companies if c.supports_semi_private]
    elif coverage == "private":
        companies = [c for c in companies if c.supports_private]

    providers = sorted(companies, key=lambda c: c.name.casefold())
    return [
        InsuranceProviderResponse(
            id=c.id,
            name=c.name,
            is_active=c.is_active,
            supports_basic=c.supports_basic,
            supports_semi_private=c.supports_semi_private,
            supports_private=c.supports_private,
            logo_text=_logo_text(c.name),
            logo_color=_logo_color(c.name),
        )
        for c in providers
    ]


@router.get("/insurance/catalog", response_model=list[InsuranceCompanyResponse])
async def insurance_catalog(db: DbSession, user: AdminUser):
    """Admin: kompletter Versicherer-Katalog inkl. inaktiver Einträge."""
    await _ensure_default_insurers(db)
    rows = (await db.execute(select(InsuranceCompany).order_by(InsuranceCompany.name))).scalars().all()
    return [
        InsuranceCompanyResponse(
            id=row.id,
            name=row.name,
            is_active=row.is_active,
            supports_basic=row.supports_basic,
            supports_semi_private=row.supports_semi_private,
            supports_private=row.supports_private,
            logo_text=_logo_text(row.name),
            logo_color=_logo_color(row.name),
        )
        for row in rows
    ]


@router.post("/insurance/catalog", response_model=InsuranceCompanyResponse, status_code=201)
async def create_insurance_company(data: InsuranceCompanyCreate, db: DbSession, user: AdminUser):
    """Admin: neuen Versicherer im Katalog anlegen."""
    exists = (
        await db.execute(select(InsuranceCompany).where(InsuranceCompany.name.ilike(data.name.strip())))
    ).scalar_one_or_none()
    if exists:
        raise HTTPException(status_code=409, detail="Versicherer existiert bereits")

    company = InsuranceCompany(
        name=data.name.strip(),
        is_active=True,
        supports_basic=data.supports_basic,
        supports_semi_private=data.supports_semi_private,
        supports_private=data.supports_private,
    )
    db.add(company)
    await db.flush()
    await db.refresh(company)
    return InsuranceCompanyResponse(
        id=company.id,
        name=company.name,
        is_active=company.is_active,
        supports_basic=company.supports_basic,
        supports_semi_private=company.supports_semi_private,
        supports_private=company.supports_private,
        logo_text=_logo_text(company.name),
        logo_color=_logo_color(company.name),
    )


@router.patch("/insurance/catalog/{company_id}", response_model=InsuranceCompanyResponse)
async def update_insurance_company(company_id: uuid.UUID, data: InsuranceCompanyUpdate, db: DbSession, user: AdminUser):
    """Admin: Versicherer im Katalog aktualisieren."""
    company = (await db.execute(select(InsuranceCompany).where(InsuranceCompany.id == company_id))).scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Versicherer nicht gefunden")

    patch_data = data.model_dump(exclude_unset=True)
    if "name" in patch_data and patch_data["name"]:
        patch_data["name"] = patch_data["name"].strip()

    for field, value in patch_data.items():
        setattr(company, field, value)

    await db.flush()
    await db.refresh(company)
    return InsuranceCompanyResponse(
        id=company.id,
        name=company.name,
        is_active=company.is_active,
        supports_basic=company.supports_basic,
        supports_semi_private=company.supports_semi_private,
        supports_private=company.supports_private,
        logo_text=_logo_text(company.name),
        logo_color=_logo_color(company.name),
    )


@router.delete("/insurance/catalog/{company_id}", status_code=204)
async def deactivate_insurance_company(company_id: uuid.UUID, db: DbSession, user: AdminUser):
    """Admin: Versicherer deaktivieren (Soft-Delete)."""
    company = (await db.execute(select(InsuranceCompany).where(InsuranceCompany.id == company_id))).scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=404, detail="Versicherer nicht gefunden")
    company.is_active = False
    await db.flush()


@router.get("/patients/{patient_id}/insurances", response_model=list[InsuranceResponse])
async def list_patient_insurances(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    rows = (await db.execute(select(Insurance).where(Insurance.patient_id == patient_id))).scalars().all()
    return [InsuranceResponse.model_validate(i) for i in rows]


@router.post("/insurances", response_model=InsuranceResponse, status_code=201)
async def create_insurance_endpoint(data: InsuranceCreate, db: DbSession, user: CurrentUser):
    payload = data.model_dump()
    payload["garant"] = _normalize_garant(payload.get("garant"))
    ins = Insurance(**payload)
    db.add(ins)
    await db.flush()
    await db.refresh(ins)
    return InsuranceResponse.model_validate(ins)


@router.patch("/insurances/{insurance_id}", response_model=InsuranceResponse)
async def update_insurance_endpoint(insurance_id: uuid.UUID, data: InsuranceUpdate, db: DbSession, user: CurrentUser):
    ins = (await db.execute(select(Insurance).where(Insurance.id == insurance_id))).scalar_one_or_none()
    if not ins:
        raise HTTPException(404, "Versicherung nicht gefunden")
    patch_data = data.model_dump(exclude_unset=True)
    if "garant" in patch_data:
        patch_data["garant"] = _normalize_garant(patch_data.get("garant"))

    for field, value in patch_data.items():
        setattr(ins, field, value)
    await db.flush()
    await db.refresh(ins)
    return InsuranceResponse.model_validate(ins)


@router.delete("/insurances/{insurance_id}", status_code=204)
async def delete_insurance_endpoint(insurance_id: uuid.UUID, db: DbSession, user: CurrentUser):
    ins = (await db.execute(select(Insurance).where(Insurance.id == insurance_id))).scalar_one_or_none()
    if not ins:
        raise HTTPException(404, "Versicherung nicht gefunden")
    await db.delete(ins)
