"""Batch-Migration für Patientenfoto-URLs auf kanonischen /media-Pfad.

Dieses Skript korrigiert bestehende `photo_url`-Werte im Patientenstamm,
indem es den neuesten vorhandenen Datei-Stand unter
`<media_root>/patient-photos/<patient_id>/` auf
`<media_url_prefix>/patient-photos/<patient_id>/<filename>` mappt.

Ausführung (Dry-Run, Standard):
    cd backend
    python -m src.scripts.migrate_patient_photo_urls

Ausführung (schreibt in DB):
    cd backend
    python -m src.scripts.migrate_patient_photo_urls --apply
"""

from __future__ import annotations

import argparse
import asyncio
import uuid
from dataclasses import dataclass
from pathlib import Path

from sqlalchemy import select

from src.config import settings
from src.domain.models.patient import Patient
from src.infrastructure.database import AsyncSessionLocal


@dataclass
class MigrationStats:
    """Laufstatistik für die Foto-URL-Migration."""

    scanned: int = 0
    with_files: int = 0
    updated: int = 0
    unchanged: int = 0
    missing_files: int = 0


def _canonical_photo_url(patient_id: uuid.UUID, filename: str) -> str:
    """Erzeugt den kanonischen URL-Pfad für ein Patientenfoto."""
    return f"{settings.media_url_prefix}/patient-photos/{patient_id}/{filename}"


def _latest_photo_file(patient_id: uuid.UUID) -> Path | None:
    """Liefert die neueste Bilddatei aus dem Patienten-Fotoordner."""
    patient_photo_dir = Path(settings.media_root) / "patient-photos" / str(patient_id)
    if not patient_photo_dir.exists() or not patient_photo_dir.is_dir():
        return None

    files = [p for p in patient_photo_dir.glob("*") if p.is_file()]
    if not files:
        return None

    return max(files, key=lambda p: p.stat().st_mtime)


async def migrate_photo_urls(*, apply_changes: bool) -> MigrationStats:
    """Migriert alle Patientenfoto-URLs auf den kanonischen Media-Pfad."""
    stats = MigrationStats()

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Patient))
        patients = list(result.scalars().all())

        for patient in patients:
            stats.scanned += 1
            latest = _latest_photo_file(patient.id)
            if latest is None:
                stats.missing_files += 1
                continue

            stats.with_files += 1
            canonical = _canonical_photo_url(patient.id, latest.name)

            if patient.photo_url == canonical:
                stats.unchanged += 1
                continue

            patient.photo_url = canonical
            stats.updated += 1

        if apply_changes:
            await session.commit()
        else:
            await session.rollback()

    return stats


def parse_args() -> argparse.Namespace:
    """Parst CLI-Argumente."""
    parser = argparse.ArgumentParser(description="Migriert Patientenfoto-URLs auf /media/...")
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Änderungen in die Datenbank schreiben (ohne Flag = Dry-Run).",
    )
    return parser.parse_args()


async def _main() -> int:
    """CLI-Einstiegspunkt mit Ergebnis-Ausgabe."""
    args = parse_args()
    mode = "APPLY" if args.apply else "DRY-RUN"
    print(f"[photo-url-migration] Starte Lauf im Modus: {mode}")

    stats = await migrate_photo_urls(apply_changes=args.apply)

    print("[photo-url-migration] Ergebnis:")
    print(f"  - Gescannt:               {stats.scanned}")
    print(f"  - Mit Bilddatei:          {stats.with_files}")
    print(f"  - Aktualisiert:           {stats.updated}")
    print(f"  - Bereits korrekt:        {stats.unchanged}")
    print(f"  - Ohne Datei/kein Ordner: {stats.missing_files}")

    if not args.apply:
        print("[photo-url-migration] Hinweis: Dry-Run hat keine DB-Änderungen gespeichert.")
    else:
        print("[photo-url-migration] Änderungen wurden gespeichert.")

    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(_main()))
