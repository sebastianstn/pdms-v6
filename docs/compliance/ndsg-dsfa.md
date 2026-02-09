# Datenschutz-Folgenabschätzung (nDSG Art. 22)

## Status: In Vorbereitung

Dieses Dokument wird im Rahmen von Phase 4 (Monat 15-18) vollständig ausgearbeitet.

## Vorläufige Massnahmen

1. **Datenminimierung**: Nur klinisch notwendige Daten
2. **Verschlüsselung**: TLS 1.3 (Transport), AES-256 (at rest)
3. **Zugriffskontrolle**: RBAC via Keycloak
4. **Audit-Trail**: pgAudit + App-Level Logging
5. **Soft-Delete**: Keine physische Datenlöschung (Aufbewahrungspflicht)
6. **Hosting**: Schweizer Datacenter
