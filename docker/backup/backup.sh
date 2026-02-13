#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# PDMS Home-Spital — Automatisches Datenbank-Backup
# Erstellt pg_dump Backup mit Rotation (max. 14 Tage)
#
# Cronjob einrichten (täglich 02:00):
#   crontab -e
#   0 2 * * * /path/to/docker/backup/backup.sh >> /var/log/pdms-backup.log 2>&1
#
# Recovery:
#   gunzip -c backups/pdms_2026-02-13_020000.sql.gz | \
#     docker exec -i pdms-postgres psql -U pdms_user -d pdms
# ─────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/backups"
CONTAINER="pdms-postgres"
DB_NAME="pdms"
DB_USER="pdms_user"
RETENTION_DAYS=14
TIMESTAMP="$(date +%Y-%m-%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "═══════════════════════════════════════════════════════"
echo "  PDMS Backup — ${TIMESTAMP}"
echo "═══════════════════════════════════════════════════════"

# ── 1. Backup-Verzeichnis erstellen ────────────────────────────
mkdir -p "${BACKUP_DIR}"

# ── 2. Prüfen ob Container läuft ──────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo "FEHLER: Container ${CONTAINER} läuft nicht!"
    exit 1
fi

# ── 3. pg_dump mit Kompression ─────────────────────────────────
echo "→ Erstelle Backup: ${BACKUP_FILE}"
docker exec "${CONTAINER}" pg_dump \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --format=plain \
    --no-owner \
    --no-privileges \
    --verbose 2>/dev/null | gzip > "${BACKUP_FILE}"

# ── 4. Backup-Grösse prüfen ───────────────────────────────────
BACKUP_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "→ Backup-Grösse: ${BACKUP_SIZE}"

if [ ! -s "${BACKUP_FILE}" ]; then
    echo "FEHLER: Backup-Datei ist leer!"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# ── 5. Alte Backups aufräumen (Rotation) ───────────────────────
echo "→ Lösche Backups älter als ${RETENTION_DAYS} Tage..."
DELETED=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete -print | wc -l)
echo "  ${DELETED} alte Backups gelöscht"

# ── 6. Zusammenfassung ────────────────────────────────────────
TOTAL=$(find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_DIR}" | cut -f1)
echo ""
echo "✔ Backup erfolgreich"
echo "  Datei:    ${BACKUP_FILE}"
echo "  Grösse:   ${BACKUP_SIZE}"
echo "  Gesamt:   ${TOTAL} Backups (${TOTAL_SIZE})"
echo "═══════════════════════════════════════════════════════"
