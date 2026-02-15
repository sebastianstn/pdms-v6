# Deployment auf Raspberry Pi 5 (Production)

Diese Anleitung deployt den vollständigen PDMS-Stack via Docker Compose auf einem Raspberry Pi 5 (ARM64).

## 1) Voraussetzungen

- Raspberry Pi OS 64-bit (Bookworm empfohlen)
- Docker Engine + Docker Compose Plugin installiert
- Öffentliche Domain (z. B. `pdms.example.ch`) auf die Pi-IP zeigend
- Router/Firewall: Ports **80** und **443** offen

## 2) Repository bereitstellen

Projekt auf den Pi kopieren/klonen und in das Repo wechseln:

- Arbeitsverzeichnis: `pdms-home-spital/`

## 3) Produktions-`.env` erstellen

Im Projektroot:

- `.env.prod.example` nach `.env` kopieren
- Alle Platzhalter `<...>` ersetzen

Pflichtvariablen:

- `PDMS_DOMAIN`
- `POSTGRES_PASSWORD`
- `KC_ADMIN_PASSWORD`
- `KC_API_SECRET`
- `RABBITMQ_PASSWORD`
- `VALKEY_PASSWORD` (empfohlen, praktisch Pflicht)

Empfohlene Defaults:

- `ENVIRONMENT=production`
- `LOG_LEVEL=WARNING`

## 4) TLS-Zertifikate prüfen

Nginx erwartet folgende Dateien in `docker/nginx/ssl/`:

- `pdms.crt`
- `pdms.key`
- `dhparam.pem`

Diese Dateien sind im Repo bereits vorgesehen. Für Internet-Betrieb sollten CA-signierte Zertifikate (z. B. Let's Encrypt) verwendet werden.

## 5) Produktions-Stack starten

Im Verzeichnis `docker/`:

- `docker compose -f docker-compose.prod.yml up -d --build`

Alternativ (empfohlen) direkt aus dem Projektroot mit Safety-Checks:

- `./scripts/deploy-prod-pi.sh`

## 6) Health-Checks und Status

Nach dem Start prüfen:

- Container-Status: `docker compose -f docker-compose.prod.yml ps`
- Nginx Health: `https://<PDMS_DOMAIN>/health`
- Frontend: `https://<PDMS_DOMAIN>/`
- API: `https://<PDMS_DOMAIN>/api/v1/health` (falls verfügbar) oder backendseitig `http://localhost:8000/health` im API-Container

Optional Logs:

- `docker compose -f docker-compose.prod.yml logs -f --tail=150 nginx api web keycloak`

## 7) Keycloak Produktionshinweise

- Realm wird aus `docker/keycloak/realm-export.json` importiert
- Prüfe nach erstem Start:
  - Redirect URIs für Web-Client
  - Web Origins
  - Client Secret (`KC_API_SECRET`) konsistent mit Backend

## 8) Update-Prozess

1. Neue Version pullen
2. `.env` unverändert behalten
3. `docker compose -f docker-compose.prod.yml up -d --build`
4. Health prüfen

## 9) Troubleshooting (kurz)

- **Container startet nicht:** meist fehlende Pflichtvariable in `.env`
- **401/403 nach Login:** Keycloak Redirect URI / Domain passt nicht
- **502 über Nginx:** Upstream nicht healthy (`api`, `web`, `keycloak`)
- **SSL-Fehler:** Zertifikatsdateien fehlen oder falscher Mount/Pfad

## 10) Security-Checkliste

- Keine Secrets in Git
- Starke Passwörter/Secrets (>= 20 Zeichen)
- Kein Dev-Bypass in Produktion
- Regelmäßige Backups für PostgreSQL-Volume
- Nur Ports 80/443 extern offen
