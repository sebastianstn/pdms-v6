#!/usr/bin/env bash
set -euo pipefail

# Aktives Projekt-Backup für PDMS Home-Spital.
# - Synchronisiert den aktuellen Stand in ein Mirror-Verzeichnis
# - Speichert pro erfolgreichem Commit einen Patch in der Historie

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
PROJECT_NAME="$(basename "$REPO_ROOT")"

BACKUP_ROOT="${PDMS_ACTIVE_BACKUP_ROOT:-/mnt/data/1T-data/pdms-active-backups}"
PROJECT_BACKUP_DIR="$BACKUP_ROOT/$PROJECT_NAME"
ACTIVE_DIR="$PROJECT_BACKUP_DIR/active"
HISTORY_DIR="$PROJECT_BACKUP_DIR/history"
ARCHIVE_DIR="${PDMS_ACTIVE_BACKUP_ARCHIVE_DIR:-$PROJECT_BACKUP_DIR/archive}"
LOG_FILE="$PROJECT_BACKUP_DIR/backup.log"
MAX_PATCH_FILES="${PDMS_ACTIVE_BACKUP_MAX_PATCHES:-100}"

mkdir -p "$ACTIVE_DIR" "$HISTORY_DIR" "$ARCHIVE_DIR"

timestamp="$(date +"%Y-%m-%d %H:%M:%S")"

echo "[$timestamp] Starte aktive Synchronisierung: $REPO_ROOT -> $ACTIVE_DIR" | tee -a "$LOG_FILE"

rsync -a --delete \
  --exclude='.git/' \
  --exclude='node_modules/' \
  --exclude='frontend/.next/' \
  --exclude='**/__pycache__/' \
  --exclude='**/.pytest_cache/' \
  --exclude='**/.ruff_cache/' \
  "$REPO_ROOT/" "$ACTIVE_DIR/"

if git -C "$REPO_ROOT" rev-parse --verify HEAD >/dev/null 2>&1; then
  commit_hash="$(git -C "$REPO_ROOT" rev-parse --short HEAD)"
  commit_subject="$(git -C "$REPO_ROOT" log -1 --pretty=%s | tr -d '\n')"
  patch_ts="$(date +"%Y%m%d-%H%M%S")"
  patch_file="$HISTORY_DIR/${patch_ts}-${commit_hash}.patch"

  git -C "$REPO_ROOT" show --no-color HEAD > "$patch_file"

  # Aufbewahrung: nur die neuesten N Patch-Dateien behalten
  mapfile -t old_patch_files < <(
    find "$HISTORY_DIR" -maxdepth 1 -type f -name '*.patch' -printf '%T@ %f\n' \
      | sort -nr \
      | awk -v max="$MAX_PATCH_FILES" 'NR > max {print $2}'
  )

  if [[ ${#old_patch_files[@]} -gt 0 ]]; then
    declare -A monthly_groups=()

    for patch_name in "${old_patch_files[@]}"; do
      patch_month_raw="${patch_name:0:6}"
      if [[ "$patch_month_raw" =~ ^[0-9]{6}$ ]]; then
        patch_month="${patch_month_raw:0:4}-${patch_month_raw:4:2}"
      else
        patch_month="$(date +"%Y-%m")"
      fi
      monthly_groups["$patch_month"]+="$patch_name"$'\n'
    done

    archived_count=0
    for month in "${!monthly_groups[@]}"; do
      month_dir="$ARCHIVE_DIR/$month"
      mkdir -p "$month_dir"

      archive_file="$month_dir/patches-${month}-$(date +"%Y%m%d-%H%M%S").tar.gz"
      tmp_list_file="$(mktemp)"
      printf '%s' "${monthly_groups[$month]}" > "$tmp_list_file"

      # shellcheck disable=SC2046
      tar -czf "$archive_file" -C "$HISTORY_DIR" -T "$tmp_list_file"

      while IFS= read -r archived_patch; do
        [[ -z "$archived_patch" ]] && continue
        rm -f "$HISTORY_DIR/$archived_patch"
        archived_count=$((archived_count + 1))
      done < "$tmp_list_file"

      rm -f "$tmp_list_file"
      echo "[$timestamp] Monatsarchiv erstellt: $archive_file" | tee -a "$LOG_FILE"
    done

    echo "[$timestamp] Retention aktiv: $archived_count alte Patch-Datei(en) archiviert und entfernt (Limit: $MAX_PATCH_FILES)." | tee -a "$LOG_FILE"
  fi

  echo "[$timestamp] Commit gesichert: $commit_hash | $commit_subject" | tee -a "$LOG_FILE"
  echo "[$timestamp] Patch-Datei: $patch_file" | tee -a "$LOG_FILE"
else
  echo "[$timestamp] Kein Git-Commit vorhanden, nur Mirror synchronisiert." | tee -a "$LOG_FILE"
fi

echo "[$timestamp] Backup abgeschlossen." | tee -a "$LOG_FILE"
