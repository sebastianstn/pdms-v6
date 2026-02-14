# Benutzerhandbuch — Backup & Restore (PDMS Home-Spital)

> Stand: 14.02.2026
> Projekt: `pdms-home-spital`

👉 Einfache Version: [Benutzerhandbuch-einfach.md](./Benutzerhandbuch-einfach.md)

Dieses Handbuch erklärt alle wichtigen Backup-Themen für den praktischen Betrieb:

- aktive Code-Backups (Mirror + Patch-Historie)
- automatische Archivierung alter Patches
- Restore aus Archiven
- Datenbank-Backups
- Pflege/Bearbeitung der Backup-Skripte
- wichtige Terminal-Befehle für Alltag und Notfälle

---

## 1) Überblick: Welche Backups gibt es?

### A) Aktives Projekt-Backup (Code)

Wird über folgende Skripte gesteuert:

- `scripts/active-backup-sync.sh`
- `scripts/active-backup-restore.sh`
- Git-Hook: `.githooks/post-commit`

**Funktion:**

1. Spiegelkopie des Projekts (`active/`)
2. Patch-Historie pro Commit (`history/`)
3. Retention (nur letzte 100 Patches)
4. Alte Patches werden monatlich als `.tar.gz` archiviert (`archive/YYYY-MM/`)

### B) Datenbank-Backup (PostgreSQL)

Skript:

- `docker/backup/backup.sh`

**Funktion:**

- erstellt `pg_dump` als `.sql.gz`
- rotiert standardmäßig auf 14 Tage

---

## 2) Wichtige Pfade

### Aktive Code-Backups

- Root: `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital`
- Mirror: `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/active`
- Historie: `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/history`
- Archive: `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/archive`
- Log: `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/backup.log`

### DB-Backups

- Verzeichnis: `docker/backup/backups/`

---

## 3) Schnellstart (einmalig prüfen)

```bash
cd /mnt/data/pdms-v6/pdms-home-spital

git config core.hooksPath
ls -la .githooks/post-commit
ls -la scripts/active-backup-sync.sh
ls -la scripts/active-backup-restore.sh
```

Erwartung:

- `core.hooksPath` zeigt auf `.githooks`
- Skripte sind ausführbar (`x`-Recht)

Wenn nicht:

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
chmod +x .githooks/post-commit scripts/active-backup-sync.sh scripts/active-backup-restore.sh
git config core.hooksPath .githooks
```

---

## 4) Tägliche Nutzung: aktives Backup

### 4.1 Automatisch nach Commit

Nach jedem erfolgreichen `git commit` läuft der Hook automatisch und stößt Backup-Sync an.

### 4.2 Manuell ausführen

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
./scripts/active-backup-sync.sh
```

### 4.3 Letzte Logeinträge ansehen

```bash
tail -n 30 /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/backup.log
```

---

## 5) Archivierung & Retention

Standard:

- `PDMS_ACTIVE_BACKUP_MAX_PATCHES=100`
- Alles über 100 wird in Monatsarchiv (`.tar.gz`) verschoben

### 5.1 Patch-Anzahl prüfen

```bash
find /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/history -maxdepth 1 -type f -name '*.patch' | wc -l
```

### 5.2 Archive auflisten

```bash
find /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/archive -type f -name '*.tar.gz' | sort
```

### 5.3 Optional: anderes Limit

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
PDMS_ACTIVE_BACKUP_MAX_PATCHES=150 ./scripts/active-backup-sync.sh
```

### 5.4 Optional: anderer Backup-/Archivpfad

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
PDMS_ACTIVE_BACKUP_ROOT=/mein/backup/pfad ./scripts/active-backup-sync.sh
PDMS_ACTIVE_BACKUP_ARCHIVE_DIR=/mein/archiv/pfad ./scripts/active-backup-sync.sh
```

---

## 6) Restore (Patch-Archive)

### 6.1 Verfügbare Archive anzeigen

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
./scripts/active-backup-restore.sh --list
```

### 6.2 Neuestes Archiv nach `history/` wiederherstellen

```bash
./scripts/active-backup-restore.sh --latest
```

### 6.3 Konkretes Archiv wiederherstellen

```bash
./scripts/active-backup-restore.sh /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/archive/2026-02/patches-2026-02-20260214-121000.tar.gz
```

### 6.4 Sicher testen (ohne produktives `history/` zu verändern)

```bash
./scripts/active-backup-restore.sh --latest --target-dir /tmp/pdms-restore-test
ls -la /tmp/pdms-restore-test
```

---

## 7) Datenbank-Backup (Postgres)

### 7.1 Manuell ausführen

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
./docker/backup/backup.sh
```

### 7.2 Backup-Dateien anzeigen

```bash
ls -lah /mnt/data/pdms-v6/pdms-home-spital/docker/backup/backups
```

### 7.3 Restore einer DB-Sicherung

> Beispieldatei anpassen.

```bash
gunzip -c /mnt/data/pdms-v6/pdms-home-spital/docker/backup/backups/pdms_YYYY-MM-DD_HHMMSS.sql.gz | docker exec -i pdms-postgres psql -U pdms_user -d pdms
```

### 7.4 Optionaler Cronjob (täglich 02:00)

```bash
crontab -e
```

Eintrag:

```cron
0 2 * * * /mnt/data/pdms-v6/pdms-home-spital/docker/backup/backup.sh >> /var/log/pdms-backup.log 2>&1
```

---

## 8) Pflege & Bearbeitung der Backup-Skripte

### Relevante Dateien

- `scripts/active-backup-sync.sh`
- `scripts/active-backup-restore.sh`
- `.githooks/post-commit`
- `docker/backup/backup.sh`

### Nach Änderungen immer ausführen

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
chmod +x scripts/active-backup-sync.sh scripts/active-backup-restore.sh .githooks/post-commit
./scripts/active-backup-sync.sh
./scripts/active-backup-restore.sh --list
```

### Hook prüfen

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
git config core.hooksPath
```

Sollte ausgeben:

```text
.githooks
```

---

## 9) Troubleshooting

### Problem: Nach Commit wird kein Backup erzeugt

Prüfen:

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
git config core.hooksPath
ls -la .githooks/post-commit
ls -la scripts/active-backup-sync.sh
tail -n 50 /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/backup.log
```

### Problem: `permission denied`

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
chmod +x .githooks/post-commit scripts/active-backup-sync.sh scripts/active-backup-restore.sh
```

### Problem: Kein Archiv gefunden

```bash
./scripts/active-backup-restore.sh --list
find /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/archive -type f -name '*.tar.gz'
```

### Problem: DB-Backup schlägt fehl

```bash
docker ps --format '{{.Names}}' | grep pdms-postgres
./docker/backup/backup.sh
```

---

## 10) Empfohlener Betriebsablauf

1. Normal entwickeln und committen (Auto-Backup läuft mit)
2. Täglich Log prüfen (kurz):

```bash
tail -n 20 /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/backup.log
```

3. Wöchentlich Stichprobe Restore in Testordner:

```bash
./scripts/active-backup-restore.sh --latest --target-dir /tmp/pdms-restore-weekly
```

4. DB-Backup täglich (Cron oder manuell)

---

## 11) Kurzreferenz (Cheat Sheet)

```bash
# Projekt-Backup manuell
./scripts/active-backup-sync.sh

# Archive anzeigen
./scripts/active-backup-restore.sh --list

# Neuestes Archiv wiederherstellen
./scripts/active-backup-restore.sh --latest

# Sicherer Restore-Test
./scripts/active-backup-restore.sh --latest --target-dir /tmp/pdms-restore-test

# DB-Backup
./docker/backup/backup.sh
```

---

Bei Bedarf kann dieses Handbuch erweitert werden um:

- Restore kompletter Arbeitsstände aus `active/`
- zusätzliche Offsite-Synchronisierung (NAS/SFTP)
- Verschlüsselung der Archive (z. B. age/gpg)
