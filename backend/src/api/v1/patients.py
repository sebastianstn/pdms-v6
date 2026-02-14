"""Patient API endpoints — CRUD + search + Valkey caching."""

import uuid
from io import BytesIO
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.config import settings
from src.domain.schemas.patient import PaginatedPatients, PatientCreate, PatientResponse, PatientUpdate
from src.domain.services.patient_service import (
    create_patient,
    get_patient,
    list_patients,
    soft_delete_patient,
    update_patient,
)
from src.infrastructure.valkey import (
    CacheKeys,
    TTL_PATIENT,
    TTL_PATIENT_LIST,
    get_cached,
    invalidate,
    set_cached,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]

_ALLOWED_IMAGE_MIME_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _normalize_patient_photo(image_bytes: bytes) -> bytes:
    """Normalisiert Patientenfotos: EXIF-Rotation, 1:1-Zuschnitt, Resize, WebP-Komprimierung."""
    try:
        with Image.open(BytesIO(image_bytes)) as source:
            image = ImageOps.exif_transpose(source)
            image.load()
    except (UnidentifiedImageError, OSError) as exc:
        raise ValueError("Datei enthält kein gültiges Bild.") from exc

    if image.mode not in ("RGB", "L"):
        image = image.convert("RGB")
    elif image.mode == "L":
        image = image.convert("RGB")

    width, height = image.size
    side = min(width, height)
    left = (width - side) // 2
    top = (height - side) // 2
    image = image.crop((left, top, left + side, top + side))

    target_size = max(128, settings.patient_photo_target_px)
    resampling = getattr(getattr(Image, "Resampling", Image), "LANCZOS")
    image = image.resize((target_size, target_size), resample=resampling)

    out = BytesIO()
    image.save(out, format="WEBP", quality=settings.patient_photo_quality, method=6)
    return out.getvalue()


@router.get("/patients", response_model=PaginatedPatients)
async def list_patients_endpoint(
    db: DbSession,
    user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
):
    """Patientenliste mit Suche und Pagination."""
    # Check cache
    cache_key = CacheKeys.patient_list(page, per_page, search)
    cached = await get_cached(cache_key)
    if cached is not None:
        return PaginatedPatients(**cached)

    patients, total = await list_patients(db, page=page, per_page=per_page, search=search)
    result = PaginatedPatients(
        items=[PatientResponse.model_validate(p) for p in patients],
        total=total,
        page=page,
        per_page=per_page,
    )
    await set_cached(cache_key, result.model_dump(), ttl=TTL_PATIENT_LIST)
    return result


@router.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Einzelnen Patient abrufen."""
    # Check cache
    cache_key = CacheKeys.patient(str(patient_id))
    cached = await get_cached(cache_key)
    if cached is not None:
        return PatientResponse(**cached)

    patient = await get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")
    result = PatientResponse.model_validate(patient)
    await set_cached(cache_key, result.model_dump(), ttl=TTL_PATIENT)
    return result


@router.post("/patients", response_model=PatientResponse, status_code=201)
async def create_patient_endpoint(
    data: PatientCreate,
    db: DbSession,
    user: CurrentUser,
):
    """Neuen Patient anlegen."""
    patient = await create_patient(db, data)
    result = PatientResponse.model_validate(patient)
    # Invalidate list caches
    await invalidate(CacheKeys.PATIENT_LIST_ALL)
    return result


@router.post("/patients/{patient_id}/photo", response_model=PatientResponse)
async def upload_patient_photo_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    file: UploadFile = File(...),
):
    """Patientenbild hochladen und als photo_url am Patient speichern."""
    patient = await get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")

    content_type = (file.content_type or "").lower()
    if _ALLOWED_IMAGE_MIME_TYPES.get(content_type) is None:
        raise HTTPException(
            status_code=415,
            detail="Ungültiges Bildformat. Erlaubt: JPG, PNG, WEBP.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Leere Datei nicht erlaubt.")

    max_bytes = settings.patient_photo_max_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Datei zu gross. Maximal {settings.patient_photo_max_mb} MB erlaubt.",
        )

    try:
        normalized = _normalize_patient_photo(data)
    except ValueError as exc:
        raise HTTPException(status_code=415, detail=str(exc)) from exc

    patient_photo_dir = Path(settings.media_root) / "patient-photos" / str(patient_id)
    patient_photo_dir.mkdir(parents=True, exist_ok=True)

    # Nur das neueste Bild behalten
    for old_file in patient_photo_dir.glob("*"):
        if old_file.is_file():
            old_file.unlink(missing_ok=True)

    filename = f"{uuid.uuid4().hex}.webp"
    destination = patient_photo_dir / filename
    destination.write_bytes(normalized)

    patient.photo_url = f"{settings.media_url_prefix}/patient-photos/{patient_id}/{filename}"
    await db.flush()

    result = PatientResponse.model_validate(patient)
    await invalidate(CacheKeys.patient(str(patient_id)), CacheKeys.PATIENT_LIST_ALL)
    return result


@router.patch("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient_endpoint(
    patient_id: uuid.UUID,
    data: PatientUpdate,
    db: DbSession,
    user: CurrentUser,
):
    """Patient aktualisieren (partial update)."""
    patient = await update_patient(db, patient_id, data)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")
    result = PatientResponse.model_validate(patient)
    # Invalidate this patient + list caches
    await invalidate(CacheKeys.patient(str(patient_id)), CacheKeys.PATIENT_LIST_ALL)
    return result


@router.delete("/patients/{patient_id}", status_code=204)
async def delete_patient_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Patient soft-delete (Daten bleiben für Audit erhalten)."""
    deleted = await soft_delete_patient(db, patient_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")
    # Invalidate this patient + list caches
    await invalidate(CacheKeys.patient(str(patient_id)), CacheKeys.PATIENT_LIST_ALL)
