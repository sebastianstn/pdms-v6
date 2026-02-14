"""Patient API endpoints — CRUD + search + Valkey caching."""

import mimetypes
import uuid
from io import BytesIO
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from PIL import Image, ImageOps, UnidentifiedImageError
from sqlalchemy import select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.config import get_media_root_path, settings
from src.domain.models.patient import PatientPhoto
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


def _guess_media_type(file_path: Path) -> str:
    """Ermittelt einen sinnvollen Content-Type für ein Bild."""
    guessed, _ = mimetypes.guess_type(file_path.name)
    return guessed or "application/octet-stream"


def _resolve_photo_path_from_url(photo_url: str | None) -> Path | None:
    """Leitet aus einer internen /media-URL den lokalen Dateipfad ab."""
    if not photo_url:
        return None
    if not photo_url.startswith(settings.media_url_prefix):
        return None

    relative = photo_url[len(settings.media_url_prefix) :].lstrip("/")
    if not relative:
        return None

    media_root = get_media_root_path().resolve()
    candidate = (media_root / relative).resolve()
    if media_root not in candidate.parents and candidate != media_root:
        return None
    return candidate if candidate.is_file() else None


def _canonical_photo_url(patient_id: uuid.UUID, filename: str) -> str:
    """Erzeugt die kanonische Media-URL für ein Patientenfoto."""
    return f"{settings.media_url_prefix}/patient-photos/{patient_id}/{filename}"


def _photo_fs_path(file_path: str) -> Path:
    """Wandelt relativen Datei-Pfad in absoluten Dateisystem-Pfad um."""
    return get_media_root_path() / file_path


async def _patient_photos_table_exists(db: AsyncSession) -> bool:
    """Prüft, ob die optionale patient_photos Tabelle im aktuellen Schema vorhanden ist."""
    regclass = (await db.execute(text("select to_regclass('public.patient_photos')"))).scalar_one()
    return regclass is not None


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

    patient_photo_dir = get_media_root_path() / "patient-photos" / str(patient_id)
    patient_photo_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}.webp"
    destination = patient_photo_dir / filename
    destination.write_bytes(normalized)

    canonical_url = _canonical_photo_url(patient_id, filename)
    relative_file_path = str(Path("patient-photos") / str(patient_id) / filename)

    if await _patient_photos_table_exists(db):
        await db.execute(
            update(PatientPhoto)
            .where(PatientPhoto.patient_id == patient_id)
            .values(is_current=False)
        )

        db.add(
            PatientPhoto(
                patient_id=patient_id,
                file_name=filename,
                file_path=relative_file_path,
                media_url=canonical_url,
                content_type="image/webp",
                file_size_bytes=len(normalized),
                uploaded_by=(user.get("preferred_username") if isinstance(user, dict) else None),
                is_current=True,
            )
        )

    patient.photo_url = canonical_url
    await db.flush()

    result = PatientResponse.model_validate(patient)
    await invalidate(CacheKeys.patient(str(patient_id)), CacheKeys.PATIENT_LIST_ALL)
    return result


@router.get("/patients/{patient_id}/photo")
async def get_patient_photo_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Liefert das Patientenfoto für Legacy- und aktuelle photo_url-Werte."""
    patient = await get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")

    # 1) Primär: über gespeicherte /media-URL auflösen
    resolved = _resolve_photo_path_from_url(patient.photo_url)
    if resolved is not None:
        canonical = _canonical_photo_url(patient_id, resolved.name)
        if patient.photo_url != canonical:
            patient.photo_url = canonical
            await db.flush()
            await invalidate(CacheKeys.patient(str(patient_id)), CacheKeys.PATIENT_LIST_ALL)
        return FileResponse(path=resolved, media_type=_guess_media_type(resolved))

    # 2) DB-Metadaten: aktuelles Foto aus patient_photos verwenden
    photo_row = None
    if await _patient_photos_table_exists(db):
        photo_row = (
            await db.execute(
                select(PatientPhoto)
                .where(PatientPhoto.patient_id == patient_id, PatientPhoto.is_current.is_(True))
                .order_by(PatientPhoto.created_at.desc())
                .limit(1)
            )
        ).scalar_one_or_none()

    if photo_row is not None:
        candidate = _photo_fs_path(photo_row.file_path)
        if candidate.is_file():
            canonical = _canonical_photo_url(patient_id, candidate.name)
            if patient.photo_url != canonical:
                patient.photo_url = canonical
                await db.flush()
                await invalidate(CacheKeys.patient(str(patient_id)), CacheKeys.PATIENT_LIST_ALL)
            return FileResponse(path=candidate, media_type=photo_row.content_type or _guess_media_type(candidate))

    # 3) Fallback: letzte Datei im Patient-Fotoordner (für Legacy-Datensätze)
    patient_photo_dir = get_media_root_path() / "patient-photos" / str(patient_id)
    if patient_photo_dir.exists() and patient_photo_dir.is_dir():
        files = [p for p in patient_photo_dir.glob("*") if p.is_file()]
        if files:
            latest = max(files, key=lambda path: path.stat().st_mtime)
            canonical = _canonical_photo_url(patient_id, latest.name)
            if await _patient_photos_table_exists(db):
                await db.execute(
                    update(PatientPhoto)
                    .where(PatientPhoto.patient_id == patient_id)
                    .values(is_current=False)
                )
                db.add(
                    PatientPhoto(
                        patient_id=patient_id,
                        file_name=latest.name,
                        file_path=str(Path("patient-photos") / str(patient_id) / latest.name),
                        media_url=canonical,
                        content_type=_guess_media_type(latest),
                        file_size_bytes=latest.stat().st_size,
                        uploaded_by=None,
                        is_current=True,
                    )
                )
            if patient.photo_url != canonical:
                patient.photo_url = canonical
            await db.flush()
            await invalidate(CacheKeys.patient(str(patient_id)), CacheKeys.PATIENT_LIST_ALL)
            return FileResponse(path=latest, media_type=_guess_media_type(latest))

    raise HTTPException(status_code=404, detail="Patientenbild nicht gefunden")


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
