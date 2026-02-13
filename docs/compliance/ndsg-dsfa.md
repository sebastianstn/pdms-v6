# Datenschutz-Folgenabschätzung (DSFA) gemäss nDSG Art. 22

> Pflicht bei Bearbeitung besonders schützenswerter Personendaten (Gesundheitsdaten).

---

## 1. Systembeschreibung

| Attribut | Beschreibung |
|---|---|
| **System** | PDMS Home-Spital (Patientendaten-Management-System) |
| **Zweck** | Verwaltung klinischer Daten für Home-Hospitalisierung |
| **Datenarten** | Gesundheitsdaten (Vitals, Diagnosen, Medikamente), AHV-Nummern, Kontaktdaten |
| **Betroffene** | Patienten im Home-Spital-Programm, deren Angehörige, Leistungserbringer |
| **Verantwortlicher** | [Organisation gemäss nDSG Art. 5 lit. j] |
| **Grundlage** | Einwilligung (Consent) + Behandlungsvertrag |

---

## 2. Bearbeitungszwecke

1. **Klinische Versorgung** — Dokumentation von Vitaldaten, Medikamenten, Pflegemassnahmen
2. **Alarmierung** — Automatische Alarm-Auslösung bei kritischen Vitalwerten
3. **Terminplanung** — Koordination von Hausbesuchen und Teleconsults
4. **Abrechnung** — Erfassung von Leistungen für Versicherungsabrechnungen
5. **Qualitätssicherung** — Audit-Trail, klinische Auswertungen

---

## 3. Technische und organisatorische Massnahmen (TOMs)

### 3.1 Vertraulichkeit
| Massnahme | Implementierung | Status |
|---|---|---|
| Zugangskontrolle | Keycloak OIDC + PKCE, JWT-Tokens | ✅ Umgesetzt |
| Rollenbasierte Zugriffskontrolle | RBAC (arzt, pflege, admin) auf Endpoint-Ebene | ✅ Umgesetzt |
| Transportverschlüsselung | TLS 1.3 via Nginx Reverse Proxy | ✅ Umgesetzt |
| Verschlüsselung at Rest | PostgreSQL TDE / Volume-Verschlüsselung | 🔲 Geplant |
| PHI in Logs vermeiden | Keine Patientendaten in Logfiles | ✅ Umgesetzt |

### 3.2 Integrität
| Massnahme | Implementierung | Status |
|---|---|---|
| Input-Validierung | Pydantic v2 (Backend), Zod (Frontend) | ✅ Umgesetzt |
| Audit-Trail | AuditMiddleware + AuditLog-Tabelle (wer, was, wann) | ✅ Umgesetzt |
| Soft-Delete | Keine physische Löschung (10-jährige Aufbewahrungspflicht) | ✅ Umgesetzt |
| DB-Constraints | Foreign Keys, Check Constraints, NOT NULL | ✅ Umgesetzt |
| Alembic-Migrationen | Versionierte, reproduzierbare Schema-Änderungen | ✅ Umgesetzt |

### 3.3 Verfügbarkeit
| Massnahme | Implementierung | Status |
|---|---|---|
| Health-Checks | `/health` Endpoint (DB, Valkey, RabbitMQ) | ✅ Umgesetzt |
| Backup-Skripte | `docker/backup/backup.sh` (pg_dump + verschlüsselt) | ✅ Umgesetzt |
| Restore-Prozedur | `docker/backup/restore.sh` (getestet) | ✅ Umgesetzt |
| Caching | Valkey Cache-Aside mit TTL (5 min Patient, 15s Alarm) | ✅ Umgesetzt |
| Rate Limiting | Nginx rate_limit Zone (10r/s) | ✅ Umgesetzt |

### 3.4 Datenminimierung
| Massnahme | Implementierung | Status |
|---|---|---|
| Zweckbindung | Nur klinisch notwendige Daten erfasst | ✅ Umgesetzt |
| Pagination | Alle List-Endpoints mit `skip`/`limit` (max 100) | ✅ Umgesetzt |
| Response-Filterung | Separate Create/Update/Response-Schemas | ✅ Umgesetzt |
| Cache-TTL | Automatisches Ablaufen gecachter Daten | ✅ Umgesetzt |

---

## 4. Rechte der betroffenen Personen

| Recht | nDSG Artikel | Implementierung | Status |
|---|---|---|---|
| Auskunftsrecht | Art. 25 | API-Endpoint für Patientendaten-Export | ✅ FHIR $everything |
| Recht auf Datenherausgabe | Art. 28 | FHIR R4 Export (JSON/XML) | ✅ Umgesetzt |
| Einwilligungsverwaltung | Art. 6 | Consent-Modul (6 Typen, Widerruf) | ✅ Umgesetzt |
| Berichtigungsrecht | Art. 32 | Update-Endpoints + Audit-Log | ✅ Umgesetzt |
| Löschungsrecht | Art. 32 | Soft-Delete (Aufbewahrungspflicht beachten) | ✅ Umgesetzt |

---

## 5. Risikobewertung

### 5.1 Identifizierte Risiken

| # | Risiko | Eintritts­wahrschein­lichkeit | Auswirkung | Massnahme |
|---|---|---|---|---|
| R1 | Unbefugter Zugriff auf Patientendaten | Niedrig | Hoch | RBAC, JWT, Audit-Trail |
| R2 | Datenverlust durch Systemausfall | Niedrig | Hoch | Backup-Skripte, Health-Checks |
| R3 | Falsche Vitaldaten-Alarme | Mittel | Mittel | Konfigurierbare Grenzwerte, Bestätigung |
| R4 | Injection-Angriffe (SQL/XSS) | Niedrig | Hoch | Pydantic-Validierung, ORM, CSP |
| R5 | Datenleck über Logs/Fehlermeldungen | Niedrig | Hoch | PHI-freie Logs, generische Error-Messages |
| R6 | Session-Hijacking | Niedrig | Hoch | PKCE, kurze Token-Laufzeit, HTTPS |

### 5.2 Restrisiko-Bewertung
Alle identifizierten Risiken sind durch implementierte Massnahmen auf ein akzeptables Niveau reduziert.
Regelmässige Überprüfung (mindestens jährlich) erforderlich.

---

## 6. Schweizer Besonderheiten

- **AHV-Nummer (756.XXXX.XXXX.XX):** Wird als Patienten-Identifikator gespeichert, unterliegt besonderem Schutz
- **Hosting:** Schweizer Datacenter (kein Drittland-Transfer)
- **Aufbewahrungspflicht:** 10 Jahre für medizinische Dokumentation (Standesrecht)
- **EPD-Anbindung:** Geplant via FHIR R4 / CH Core Profiles

---

## 7. Massnahmenplan

| # | Massnahme | Verantwortlich | Frist | Status |
|---|---|---|---|---|
| 1 | Verschlüsselung at Rest implementieren | DevOps | Phase 5 | 🔲 Geplant |
| 2 | Penetrationstest durchführen | Security | Phase 5 | 🔲 Geplant |
| 3 | Datenschutz-Schulung Team | DSB | Phase 5 | 🔲 Geplant |
| 4 | DSFA-Review durch externen DSB | DSB | Phase 6 | 🔲 Geplant |
| 5 | EPD-Stammgemeinschaft anbinden | Architektur | Phase 6 | 🔲 Geplant |

---

*Letzte Aktualisierung: Phase 4 — DSFA erstellt basierend auf implementiertem System (444 Tests, RBAC, Audit-Trail).*
