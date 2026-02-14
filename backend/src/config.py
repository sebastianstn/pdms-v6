"""Application configuration — loaded from environment variables."""

import logging
from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """PDMS API Settings — all values come from .env or environment."""

    # Database
    database_url: str = "postgresql+asyncpg://pdms_user:pdms_secret_2026@localhost:5433/pdms"

    # Keycloak
    keycloak_url: str = "http://localhost:8080"
    keycloak_realm: str = "pdms-home-spital"
    keycloak_client_id: str = "pdms-api"
    keycloak_client_secret: str = Field(default="", validation_alias="KC_API_SECRET")
    keycloak_admin_realm: str = Field(default="master", validation_alias="KC_ADMIN_REALM")
    keycloak_admin_username: str = Field(default="", validation_alias="KC_ADMIN_USERNAME")
    keycloak_admin_password: str = Field(default="", validation_alias="KC_ADMIN_PASSWORD")
    keycloak_sync_users: bool = Field(default=True, validation_alias="KEYCLOAK_SYNC_USERS")

    # Valkey (Redis-compatible)
    valkey_url: str = "redis://localhost:6379/0"

    # RabbitMQ
    rabbitmq_url: str = "amqp://pdms:pdms_rabbit_2026@localhost:5672/pdms"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000", "http://192.168.1.4:3000", "http://localhost:8090", "https://localhost:8443", "https://pdms.local:8443"]

    # App
    log_level: str = "DEBUG"
    environment: str = "development"

    # Media / Uploads
    media_root: str = "./uploads"
    media_url_prefix: str = "/media"
    patient_photo_max_mb: int = 5
    patient_photo_target_px: int = 512
    patient_photo_quality: int = 82

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

logger = logging.getLogger("pdms")


@lru_cache(maxsize=1)
def get_media_root_path() -> Path:
    """Liefert einen beschreibbaren Media-Root mit Fallback auf /tmp."""
    media_root = Path(settings.media_root)
    try:
        media_root.mkdir(parents=True, exist_ok=True)
        return media_root
    except PermissionError:
        fallback_media_root = Path("/tmp/pdms-uploads")
        fallback_media_root.mkdir(parents=True, exist_ok=True)
        logger.warning(
            "Media-Root '%s' nicht beschreibbar, nutze Fallback '%s'",
            media_root,
            fallback_media_root,
        )
        return fallback_media_root
