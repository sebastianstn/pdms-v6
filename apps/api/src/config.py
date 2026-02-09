"""Application configuration — loaded from environment variables."""

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

    # Valkey (Redis-compatible)
    valkey_url: str = "redis://localhost:6379/0"

    # RabbitMQ
    rabbitmq_url: str = "amqp://pdms:pdms_rabbit_2026@localhost:5672/pdms"

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    # App
    log_level: str = "DEBUG"
    environment: str = "development"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
