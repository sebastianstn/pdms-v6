# EPD-Anbindung (EPDG) — Integrationsplan

> Elektronisches Patientendossier gemäss EPDG (SR 816.1) — geplant für Phase 5-6.

---

## 1. Übersicht

Das elektronische Patientendossier (EPD) ermöglicht den sicheren Austausch medizinischer
Dokumente zwischen Behandelnden und Patienten. PDMS Home-Spital wird als
**Primärsystem** angebunden (Dokumente bereitstellen und abrufen).

| Attribut | Wert |
|---|---|
| **EPD-Rolle** | Primärsystem (Gesundheitsfachperson) |
| **Stammgemeinschaft** | CARA oder AD Swiss (Evaluation in Phase 5) |
| **Technischer Standard** | IHE-Profile über FHIR R4 |
| **Identifikation** | EPR-SPID (über ZAS) |

---

## 2. FHIR R4 Implementierungsstand

### 2.1 Implementierte FHIR-Endpoints

| Endpoint | Beschreibung | Status |
|---|---|---|
| `GET /api/v1/fhir/metadata` | CapabilityStatement (FHIR R4, CH Core) | ✅ Umgesetzt |
| `GET /api/v1/fhir/Patient` | Patienten-Suche (name, birthdate, identifier) | ✅ Umgesetzt |
| `GET /api/v1/fhir/Patient/{id}` | Einzelner Patient (CH Core Profile) | ✅ Umgesetzt |
| `GET /api/v1/fhir/Patient/{id}/$everything` | Gesamter Patientendatensatz als Bundle | ✅ Umgesetzt |

### 2.2 CH Core Profile Mappings

| PDMS-Modell | FHIR Resource | CH Core Profile | Status |
|---|---|---|---|
| Patient | Patient | `ch-core-patient` | ✅ Mapping implementiert |
| VitalSign | Observation | `ch-core-observation` | ✅ Mapping implementiert |
| Encounter | Encounter | `ch-core-encounter` | ✅ Mapping implementiert |
| Medication | MedicationRequest | `ch-core-medicationrequest` | ✅ Mapping implementiert |
| LabResult | Observation (Lab) | — | 🔲 Geplant |
| ClinicalNote | DocumentReference | — | 🔲 Geplant |

### 2.3 Kodierungssysteme

| System | Verwendung | Status |
|---|---|---|
| **LOINC** | Vitaldaten (8 Parameter), Laborwerte | ✅ 8 Codes implementiert |
| **ICD-10-GM** | Diagnose-Kodierung | ✅ Feld vorhanden |
| **ATC** | Medikamenten-Klassifikation | ✅ Feld vorhanden |
| **SNOMED CT** | Klinische Terminologie | 🔲 Geplant |
| **GLN** | Leistungserbringer-Identifikation | ✅ Feld vorhanden |

---

## 3. EPD-Integrationsschritte

### Phase 5 (Monate 19-24)

| # | Schritt | Beschreibung | Status |
|---|---|---|---|
| 1 | Stammgemeinschaft evaluieren | CARA vs. AD Swiss — Verträge, Kosten, Region | 🔲 |
| 2 | IHE-Profile registrieren | ITI-18, ITI-41, ITI-43 (XDS.b) | 🔲 |
| 3 | EPR-SPID Anbindung | ZAS (Zentrale Ausgleichsstelle) für Patienten-ID | 🔲 |
| 4 | HPC-Authentifizierung | Health Professional Card für Fachpersonen | 🔲 |
| 5 | Document Sharing implementieren | CDA/FHIR-Dokumente publizieren und abrufen | 🔲 |
| 6 | Konformitätstest | eHealth Suisse Testumgebung | 🔲 |

### Phase 6 (Monate 25-30)

| # | Schritt | Beschreibung | Status |
|---|---|---|---|
| 7 | Pilotbetrieb | Anbindung an EPD-Testumgebung der Stammgemeinschaft | 🔲 |
| 8 | Zertifizierung | Gemäss EPDV-EDI Anhang 2 | 🔲 |
| 9 | Go-Live | Produktive EPD-Anbindung | 🔲 |

---

## 4. IHE-Profile (geplant)

| Profil | Beschreibung | Relevanz |
|---|---|---|
| **ITI-18** | Registry Stored Query | Dokumente suchen |
| **ITI-41** | Provide and Register Document Set | Dokumente publizieren |
| **ITI-43** | Retrieve Document Set | Dokumente abrufen |
| **ITI-44** | Patient Identity Feed | Patient-ID synchronisieren |
| **PHARM-1** | Community Medication List | Medikationsliste |
| **CH:PPQ** | Privacy Policy Query | Zugriffssteuerung |

---

## 5. Voraussetzungen

### Technisch (erfüllt)
- [x] FHIR R4 Endpoints implementiert
- [x] CH Core Profile Mappings (Patient, Observation, Encounter, MedicationRequest)
- [x] LOINC-Kodierung für Vitaldaten
- [x] AHV-Nummer als Identifikator
- [x] GLN-Feld für Leistungserbringer
- [x] Consent-Management (Einwilligungsverwaltung)

### Organisatorisch (ausstehend)
- [ ] EPD-Stammgemeinschaft ausgewählt und Vertrag abgeschlossen
- [ ] Datenschutz-Folgenabschätzung für EPD-Anbindung aktualisiert
- [ ] Schulung des Personals für EPD-Workflow
- [ ] Notfall-Zugriff-Prozedur definiert (Break-the-Glass)

---

## 6. Sicherheitsanforderungen

- **mTLS** für Kommunikation mit Stammgemeinschaft
- **SAML 2.0 / OIDC** für HPC-Authentifizierung
- **XUA** (Cross-Enterprise User Assertion) für System-übergreifende Autorisierung
- **ATNA** (Audit Trail and Node Authentication) für EPD-Audit
- **Ende-zu-Ende-Verschlüsselung** für Dokumenten-Austausch

---

*Letzte Aktualisierung: Phase 4 — FHIR R4 Grundlage implementiert (4 Endpoints, 4 Ressource-Mappings, 8 LOINC-Codes).*
