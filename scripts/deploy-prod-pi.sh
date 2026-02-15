#!/usr/bin/env bash

set -euo pipefail

# Deployment-Helfer für PDMS auf Raspberry Pi (Production)
# Ausführung aus dem Projektroot:
#   ./scripts/deploy-prod-pi.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKER_DIR="$ROOT_DIR/docker"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.prod.yml"
ENV_FILE="$ROOT_DIR/.env"

echo "[PDMS] Prüfe Voraussetzungen ..."

if ! command -v docker >/dev/null 2>&1; then
  echo "[FEHLER] Docker ist nicht installiert oder nicht im PATH."
  exit 1
fi

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "[FEHLER] Compose-Datei nicht gefunden: $COMPOSE_FILE"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "[FEHLER] .env fehlt im Projektroot ($ENV_FILE)."
  echo "         Vorlage: cp .env.prod.example .env"
  exit 1
fi

for required in POSTGRES_PASSWORD KC_ADMIN_PASSWORD KC_API_SECRET RABBITMQ_PASSWORD; do
  if ! grep -q "^${required}=" "$ENV_FILE"; then
    echo "[FEHLER] Pflichtvariable fehlt in .env: $required"
    exit 1
  fi
done

echo "[PDMS] Starte/aktualisiere Production-Stack ..."
cd "$DOCKER_DIR"
docker compose -f docker-compose.prod.yml up -d --build

echo "[PDMS] Aktueller Service-Status:"
docker compose -f docker-compose.prod.yml ps

PDMS_DOMAIN="$(grep -E '^PDMS_DOMAIN=' "$ENV_FILE" | head -n1 | cut -d '=' -f2- || true)"

if [[ -n "$PDMS_DOMAIN" ]]; then
  echo "[PDMS] Health-Check via HTTPS: https://${PDMS_DOMAIN}/health"
  if command -v curl >/dev/null 2>&1; then
    curl -k -fsS "https://${PDMS_DOMAIN}/health" || echo "[WARNUNG] HTTPS-Healthcheck aktuell nicht erreichbar."
  else
    echo "[HINWEIS] curl nicht installiert, Healthcheck übersprungen."
  fi
else
  echo "[HINWEIS] PDMS_DOMAIN nicht gesetzt, externer Healthcheck übersprungen."
fi

echo "[PDMS] Deployment abgeschlossen."
