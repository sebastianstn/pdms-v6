#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# PDMS Home-Spital — Datenbank-Restore aus Backup
#
# Verwendung:
#   ./restore.sh backups/pdms_2026-02-13_020000.sql.gz
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

CONTAINER="pdms-postgres"
DB_NAME="pdms"
DB_USER="pdms_user"

if [ $# -ne 1 ]; then
    echo "Verwendung: $0 <backup-datei.sql.gz>"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "FEHLER: Datei nicht gefunden: ${BACKUP_FILE}"
    exit 1
fi

echo "╔══════════════════════════════════════════════════════╗"
echo "║  PDMS Restore — ACHTUNG: Überschreibt Datenbank!   ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "  Quelle: ${BACKUP_FILE}"
echo "  Ziel:   ${CONTAINER}/${DB_NAME}"
echo ""
read -p "Fortfahren? (ja/nein): " CONFIRM

if [ "${CONFIRM}" != "ja" ]; then
    echo "Abgebrochen."
    exit 0
fi

echo "→ Stoppe API-Container..."
docker stop pdms-api 2>/dev/null || true

echo "→ Restore läuft..."
gunzip -c "${BACKUP_FILE}" | docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" --quiet 2>/dev/null

echo "→ Starte API-Container..."
docker start pdms-api 2>/dev/null || true

echo ""
echo "✔ Restore erfolgreich abgeschlossen"
echo "  Migration ggf. nötig: docker exec pdms-api alembic upgrade head"
