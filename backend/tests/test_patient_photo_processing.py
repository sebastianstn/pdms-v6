"""Tests für Patientenfoto-Bildpipeline (EXIF, Crop, Resize, Komprimierung)."""

from io import BytesIO

import pytest
from PIL import Image

from src.api.v1.patients import _normalize_patient_photo


def _encode_image(image: Image.Image, *, fmt: str, exif_orientation: int | None = None) -> bytes:
    """Hilfsfunktion: PIL-Image als Bytes kodieren."""
    buf = BytesIO()
    if exif_orientation is not None:
        exif = Image.Exif()
        exif[274] = exif_orientation  # Orientation
        image.save(buf, format=fmt, exif=exif)
    else:
        image.save(buf, format=fmt)
    return buf.getvalue()


def test_normalize_patient_photo_returns_square_webp() -> None:
    """Output muss WebP und quadratisch mit Zielgröße sein."""
    img = Image.new("RGB", (1200, 800), color=(180, 40, 40))
    raw = _encode_image(img, fmt="JPEG")

    normalized = _normalize_patient_photo(raw)

    with Image.open(BytesIO(normalized)) as result:
        assert result.format == "WEBP"
        assert result.size == (512, 512)



def test_normalize_patient_photo_handles_exif_orientation() -> None:
    """EXIF-rotierte Bilder müssen ohne Fehler verarbeitet werden."""
    img = Image.new("RGB", (900, 500), color=(40, 120, 200))
    raw_with_exif = _encode_image(img, fmt="JPEG", exif_orientation=6)

    normalized = _normalize_patient_photo(raw_with_exif)

    with Image.open(BytesIO(normalized)) as result:
        assert result.format == "WEBP"
        assert result.size == (512, 512)



def test_normalize_patient_photo_rejects_invalid_bytes() -> None:
    """Ungültige Bytes müssen mit ValueError abgelehnt werden."""
    invalid = b"this-is-not-an-image"

    with pytest.raises(ValueError, match="gültiges Bild"):
        _normalize_patient_photo(invalid)
