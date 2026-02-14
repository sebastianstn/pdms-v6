#!/usr/bin/env bash
set -euo pipefail

# Restore-Helfer für aktive Backup-Archive.
# Unterstützt:
# - --list: verfügbare Archive anzeigen
# - --latest: neuestes Archiv wiederherstellen
# - <archive-file>: bestimmtes Archiv wiederherstellen

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROJECT_NAME="$(basename "$REPO_ROOT")"

BACKUP_ROOT="${PDMS_ACTIVE_BACKUP_ROOT:-/mnt/data/1T-data/pdms-active-backups}"
PROJECT_BACKUP_DIR="$BACKUP_ROOT/$PROJECT_NAME"
HISTORY_DIR="$PROJECT_BACKUP_DIR/history"
ARCHIVE_DIR="${PDMS_ACTIVE_BACKUP_ARCHIVE_DIR:-$PROJECT_BACKUP_DIR/archive}"

TARGET_DIR="$HISTORY_DIR"

usage() {
  cat <<'EOF'
Verwendung:
  ./scripts/active-backup-restore.sh --list
  ./scripts/active-backup-restore.sh --latest [--target-dir <pfad>]
  ./scripts/active-backup-restore.sh <archive-file> [--target-dir <pfad>]

Beispiele:
  ./scripts/active-backup-restore.sh --list
  ./scripts/active-backup-restore.sh --latest
  ./scripts/active-backup-restore.sh /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/archive/2026-02/patches-2026-02-20260214-121000.tar.gz
  ./scripts/active-backup-restore.sh --latest --target-dir /tmp/pdms-restore-test
EOF
}

list_archives() {
  if [[ ! -d "$ARCHIVE_DIR" ]]; then
    echo "Kein Archivverzeichnis gefunden: $ARCHIVE_DIR"
    return 0
  fi

  mapfile -t archives < <(find "$ARCHIVE_DIR" -type f -name '*.tar.gz' | sort)
  if [[ ${#archives[@]} -eq 0 ]]; then
    echo "Keine Archive gefunden in: $ARCHIVE_DIR"
    return 0
  fi

  echo "Verfügbare Archive:"
  printf '  %s\n' "${archives[@]}"
}

resolve_latest_archive() {
  find "$ARCHIVE_DIR" -type f -name '*.tar.gz' | sort | tail -n 1
}

restore_archive() {
  local archive_file="$1"

  if [[ ! -f "$archive_file" ]]; then
    echo "Archiv nicht gefunden: $archive_file" >&2
    exit 1
  fi

  mkdir -p "$TARGET_DIR"

  echo "Stelle wieder her: $archive_file"
  echo "Zielordner: $TARGET_DIR"
  tar -xzf "$archive_file" -C "$TARGET_DIR"

  restored_count="$(tar -tzf "$archive_file" | wc -l | tr -d ' ')"
  echo "Wiederherstellung abgeschlossen: $restored_count Datei(en) entpackt."
}

MODE=""
ARCHIVE_FILE=""

if [[ $# -eq 0 ]]; then
  usage
  exit 1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --list)
      MODE="list"
      shift
      ;;
    --latest)
      MODE="latest"
      shift
      ;;
    --target-dir)
      if [[ $# -lt 2 ]]; then
        echo "Fehlender Wert für --target-dir" >&2
        exit 1
      fi
      TARGET_DIR="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      if [[ -z "$ARCHIVE_FILE" ]]; then
        ARCHIVE_FILE="$1"
        MODE="file"
        shift
      else
        echo "Unbekanntes Argument: $1" >&2
        usage
        exit 1
      fi
      ;;
  esac
done

case "$MODE" in
  list)
    list_archives
    ;;
  latest)
    if [[ ! -d "$ARCHIVE_DIR" ]]; then
      echo "Kein Archivverzeichnis gefunden: $ARCHIVE_DIR" >&2
      exit 1
    fi
    latest_archive="$(resolve_latest_archive)"
    if [[ -z "$latest_archive" ]]; then
      echo "Kein Archiv zum Wiederherstellen gefunden." >&2
      exit 1
    fi
    restore_archive "$latest_archive"
    ;;
  file)
    restore_archive "$ARCHIVE_FILE"
    ;;
  *)
    usage
    exit 1
    ;;
esac
