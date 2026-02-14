# Benutzerhandbuch (Einfach) — Backup & Restore

> Für den Alltag ohne viel Technik-Jargon
> Projekt: `pdms-home-spital`
> Stand: 14.02.2026

👉 Technische Version: [Benutzerhandbuch.md](./Benutzerhandbuch.md)

Dieses Handbuch ist die **einfache Version** zum schnellen Arbeiten.
Wenn du nur wissen willst „Was muss ich tun?“, bist du hier richtig.

---

## 1) Was wird automatisch gesichert?

Sobald du erfolgreich ein `git commit` machst, passiert automatisch:

1. Eine aktuelle Kopie des Projekts wird synchronisiert.
2. Die Änderung wird als Patch gespeichert.
3. Es bleiben nur die letzten 100 Patch-Dateien direkt im `history`-Ordner.
4. Ältere Patches werden monatlich als Archiv (`.tar.gz`) abgelegt.

Du musst dafür im Normalfall nichts extra klicken.

---

## 2) Wo liegen die Backups?

- Aktiver Spiegel:
  `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/active`

- Aktuelle Patch-Historie:
  `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/history`

- Monatsarchive alter Patches:
  `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/archive`

- Log-Datei (Protokoll):
  `/mnt/data/1T-data/pdms-active-backups/pdms-home-spital/backup.log`

---

## 3) 3 wichtigste Befehle (Schnellhilfe)

Im Projektordner ausführen:

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
```

### A) Backup manuell starten

```bash
./scripts/active-backup-sync.sh
```

### B) Verfügbare Archive anzeigen

```bash
./scripts/active-backup-restore.sh --list
```

### C) Neuestes Archiv wiederherstellen

```bash
./scripts/active-backup-restore.sh --latest
```

---

## 4) Sicherer Restore-Test (empfohlen)

Wenn du erst testen willst (ohne echte History zu verändern):

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
./scripts/active-backup-restore.sh --latest --target-dir /tmp/pdms-restore-test
ls -la /tmp/pdms-restore-test
```

So siehst du, ob Dateien korrekt wiederhergestellt werden.

---

## 5) Konkretes Archiv wiederherstellen

Wenn du ein bestimmtes Archiv kennst:

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
./scripts/active-backup-restore.sh /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/archive/2026-02/patches-2026-02-YYYYMMDD-HHMMSS.tar.gz
```

> Einfach den Dateinamen aus `--list` übernehmen.

---

## 6) Datenbank-Backup (zusätzlich zum Code-Backup)

### Backup manuell ausführen

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
./docker/backup/backup.sh
```

### Prüfen, welche DB-Backups da sind

```bash
ls -lah /mnt/data/pdms-v6/pdms-home-spital/docker/backup/backups
```

### DB-Backup zurückspielen (Restore)

```bash
gunzip -c /mnt/data/pdms-v6/pdms-home-spital/docker/backup/backups/pdms_YYYY-MM-DD_HHMMSS.sql.gz | docker exec -i pdms-postgres psql -U pdms_user -d pdms
```

---

## 7) Täglicher Mini-Workflow (empfohlen)

1. Arbeiten + committen (Auto-Backup läuft mit)
2. Kurz Log prüfen:

```bash
tail -n 20 /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/backup.log
```

3. 1x pro Woche Restore-Test in `/tmp` durchführen

---

## 8) Häufige Probleme + schnelle Lösung

### Problem: Nach Commit kein Backup

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
git config core.hooksPath
ls -la .githooks/post-commit
ls -la scripts/active-backup-sync.sh
```

Erwartung:

- `core.hooksPath` = `.githooks`
- Dateien sind ausführbar (`x`)

Wenn nicht:

```bash
chmod +x .githooks/post-commit scripts/active-backup-sync.sh scripts/active-backup-restore.sh
git config core.hooksPath .githooks
```

### Problem: `permission denied`

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
chmod +x .githooks/post-commit scripts/active-backup-sync.sh scripts/active-backup-restore.sh
```

### Problem: Kein Archiv gefunden

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
./scripts/active-backup-restore.sh --list
find /mnt/data/1T-data/pdms-active-backups/pdms-home-spital/archive -type f -name '*.tar.gz'
```

---

## 9) Erweiterte Optionen (nur wenn nötig)

### Mehr als 100 Patches behalten

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
PDMS_ACTIVE_BACKUP_MAX_PATCHES=150 ./scripts/active-backup-sync.sh
```

### Anderer Backup-Speicherort

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
PDMS_ACTIVE_BACKUP_ROOT=/dein/backup/pfad ./scripts/active-backup-sync.sh
```

### Anderer Archiv-Speicherort

```bash
cd /mnt/data/pdms-v6/pdms-home-spital
PDMS_ACTIVE_BACKUP_ARCHIVE_DIR=/dein/archiv/pfad ./scripts/active-backup-sync.sh
```

---

## 10) Wenn du nur 1 Seite merken willst

```bash
cd /mnt/data/pdms-v6/pdms-home-spital

# Backup manuell
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

Wenn du möchtest, erstelle ich dir als nächsten Schritt noch eine **„1-Klick Checkliste“** (Markdown mit ✅-Schritten für den Tagesbetrieb).