# Aktives Backup (Auto-Sync)

Dieses Projekt unterstützt ein aktives Backup für erfolgreiche Änderungen.

## Ziel

- **Mirror (synchronisiert):** `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/active`
- **Historie (pro Commit):** `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/history`
- **Monatsarchive (Retention):** `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/archive/YYYY-MM/*.tar.gz`

## Verhalten

- Bei jedem erfolgreichen `git commit` wird automatisch:
  1. der Projektstand in den Mirror synchronisiert,
  2. ein Patch des letzten Commits in `history/` abgelegt.
  3. die Historie auf die **letzten 100 Patch-Dateien** begrenzt,
  4. ältere Patch-Dateien werden **pro Monat als `.tar.gz` archiviert** und danach aus `history/` entfernt.

## Manuell ausführen

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
./scripts/active-backup-sync.sh
```

## Optional: anderer Zielpfad

```bash
PDMS_ACTIVE_BACKUP_ROOT=/dein/pfad ./scripts/active-backup-sync.sh
```

## Optional: anderes Patch-Limit

```bash
PDMS_ACTIVE_BACKUP_MAX_PATCHES=150 ./scripts/active-backup-sync.sh
```

## Optional: eigener Archivpfad

```bash
PDMS_ACTIVE_BACKUP_ARCHIVE_DIR=/dein/archiv/pfad ./scripts/active-backup-sync.sh
```

## Restore aus Monatsarchiven

Archivübersicht anzeigen:

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
./scripts/active-backup-restore.sh --list
```

Neuestes Archiv in `history/` zurückspielen:

```bash
./scripts/active-backup-restore.sh --latest
```

Bestimmtes Archiv wiederherstellen:

```bash
./scripts/active-backup-restore.sh /pfad/zum/archiv.tar.gz
```

Restore testweise in separaten Ordner:

```bash
./scripts/active-backup-restore.sh --latest --target-dir /tmp/pdms-restore-test
```
