"""Development Seeder für PDMS.

Erzeugt realistische Fake-Daten über viele App-Bereiche, um UI- und Laufzeittests
mit einem gefüllten System durchführen zu können.

Ausführung:
    cd backend
    python -m src.scripts.seed_dev_data --patients 20 --reset
"""

from __future__ import annotations

import argparse
import asyncio
import random
import uuid
from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import delete, select

from src.domain.models.clinical import (
    Alarm,
    ClinicalNote,
    Encounter,
    Medication,
    MedicationAdministration,
    NursingAssessment,
    NursingEntry,
    VitalSign,
)
from src.domain.models.fluid_balance import FluidEntry
from src.domain.models.home_spital import HomeVisit, RemoteDevice, SelfMedicationLog, Teleconsult
from src.domain.models.lab import LabResult
from src.domain.models.legal import AdvanceDirective, Consent, DeathNotification, PalliativeCare, PatientWishes
from src.domain.models.patient import EmergencyContact, Insurance, MedicalProvider, Patient
from src.domain.models.planning import Appointment, DischargeCriteria
from src.domain.models.system import AppUser
from src.domain.models.therapy import (
    Consultation,
    Diagnosis,
    MedicalLetter,
    NursingDiagnosis,
    NutritionOrder,
    NutritionScreening,
    ShiftHandover,
    SupplyItem,
    SupplyUsage,
    TreatmentPlan,
    TreatmentPlanItem,
)
from src.domain.services.rbac_service import RbacPermissionService
from src.infrastructure.database import AsyncSessionLocal


@dataclass
class SeedStats:
    patients: int = 0
    encounters: int = 0
    vitals: int = 0
    alarms: int = 0
    medications: int = 0
    appointments: int = 0


def _ahv(index: int) -> str:
    """Erzeugt eine formatierte AHV-Nummer (nicht checksum-validiert)."""
    return f"756.{(1000 + index) % 10000:04d}.{(5000 + index * 7) % 10000:04d}.{index % 100:02d}"


def _pick[T](rng: random.Random, values: list[T]) -> T:
    """Kleiner Helfer für typisierte Zufallsauswahl."""
    return values[rng.randrange(0, len(values))]


async def reset_seed_data() -> None:
    """Löscht bestehende Seed-Zieldaten in FK-sicherer Reihenfolge."""
    async with AsyncSessionLocal() as session:
        # Kinder zuerst
        for model in [
            Alarm,
            VitalSign,
            MedicationAdministration,
            SelfMedicationLog,
            Medication,
            HomeVisit,
            Teleconsult,
            RemoteDevice,
            Appointment,
            NursingAssessment,
            NursingEntry,
            ClinicalNote,
            LabResult,
            FluidEntry,
            Consent,
            AdvanceDirective,
            PatientWishes,
            PalliativeCare,
            DeathNotification,
            TreatmentPlanItem,
            TreatmentPlan,
            Consultation,
            MedicalLetter,
            NursingDiagnosis,
            ShiftHandover,
            NutritionOrder,
            NutritionScreening,
            SupplyUsage,
            DischargeCriteria,
            Diagnosis,
            Insurance,
            EmergencyContact,
            MedicalProvider,
            Encounter,
            Patient,
            AppUser,
            SupplyItem,
        ]:
            await session.execute(delete(model))

        await session.commit()


async def seed_dev_data(*, patient_count: int, rng_seed: int, reset: bool) -> SeedStats:
    """Füllt die Datenbank mit breit gestreuten Fake-Daten für Entwicklung."""
    rng = random.Random(rng_seed)
    now = datetime.now(UTC)

    if reset:
        await reset_seed_data()

    stats = SeedStats()

    first_names = ["Anna", "Luca", "Mia", "Noah", "Sofia", "Lea", "Jonas", "Nina", "Paul", "Elena"]
    last_names = ["Muster", "Keller", "Meier", "Schmid", "Huber", "Wenger", "Brunner", "Berger", "Frei"]
    streets = ["Bahnhofstrasse", "Dorfweg", "Hauptstrasse", "Seestrasse", "Lindenweg"]
    cities = ["Zürich", "Winterthur", "Luzern", "Bern", "St. Gallen", "Basel"]
    wards = ["IPS LH", "Innere", "Geriatrie", "Palliativ", "HomeCare"]

    async with AsyncSessionLocal() as session:
        # RBAC-Defaults nur wenn leer
        await RbacPermissionService.seed_defaults(session, updated_by="seed-script")

        # Demo-User
        users = [
            AppUser(
                keycloak_id=f"seed-{role}-{idx}",
                username=f"{role}{idx}",
                email=f"{role}{idx}@pdms.local",
                first_name=role.capitalize(),
                last_name="Demo",
                role=role,
                is_active=True,
            )
            for idx, role in enumerate(["arzt", "pflege", "admin"], start=1)
        ]
        for user in users:
            user.set_password("dev1234")
        session.add_all(users)

        # Materialkatalog
        supply_items: list[SupplyItem] = []
        for i, name in enumerate([
            "Verbandsset steril",
            "Kanüle 20G",
            "NaCl 0.9% 500ml",
            "Infusionsbesteck",
            "Spritze 10ml",
            "Kompressen 10x10",
        ], start=1):
            item = SupplyItem(
                name=name,
                article_number=f"SEED-SUP-{i:04d}",
                category=_pick(rng, ["wound_care", "infusion", "other"]),
                unit=_pick(rng, ["piece", "pack", "set"]),
                stock_quantity=rng.randint(20, 120),
                min_stock=rng.randint(5, 15),
            )
            supply_items.append(item)
        session.add_all(supply_items)
        await session.flush()

        for i in range(1, patient_count + 1):
            first = _pick(rng, first_names)
            last = _pick(rng, last_names)
            gender = _pick(rng, ["male", "female"])

            patient = Patient(
                ahv_number=_ahv(i),
                first_name=first,
                last_name=last,
                date_of_birth=date(1950 + (i % 50), (i % 12) + 1, (i % 27) + 1),
                gender=gender,
                blood_type=_pick(rng, ["A+", "A-", "B+", "0+", "AB+"]),
                phone=f"+41 79 {rng.randint(100, 999)} {rng.randint(10, 99)} {rng.randint(10, 99)}",
                email=f"{first.lower()}.{last.lower()}{i}@mail.local",
                address_street=f"{_pick(rng, streets)} {rng.randint(1, 120)}",
                address_zip=str(rng.randint(1000, 9999)),
                address_city=_pick(rng, cities),
                address_canton=_pick(rng, ["ZH", "BE", "LU", "SG", "BS"]),
                language=_pick(rng, ["de", "fr", "it"]),
                status="active",
            )
            session.add(patient)
            await session.flush()
            stats.patients += 1

            # Stammdaten
            session.add_all([
                Insurance(
                    patient_id=patient.id,
                    insurer_name=_pick(rng, ["CSS", "Helsana", "SWICA", "Visana"]),
                    policy_number=f"P-{i:05d}-{rng.randint(100, 999)}",
                    insurance_type=_pick(rng, ["grundversicherung", "zusatz", "unfall"]),
                    franchise=_pick(rng, [300, 500, 1000, 1500, 2000, 2500]),
                    kostengutsprache=rng.random() < 0.4,
                    garant=_pick(rng, ["tiers_payant", "tiers_garant"]),
                ),
                EmergencyContact(
                    patient_id=patient.id,
                    name=f"Kontakt {last}",
                    relationship_type=_pick(rng, ["partner", "kind", "eltern", "freund"]),
                    phone=f"+41 78 {rng.randint(100, 999)} {rng.randint(10, 99)} {rng.randint(10, 99)}",
                    is_primary=True,
                    email=f"kontakt.{i}@mail.local",
                    priority=1,
                    is_key_person=True,
                ),
                MedicalProvider(
                    patient_id=patient.id,
                    provider_type=_pick(rng, ["hausarzt", "spitex", "spezialist"]),
                    name=f"Praxis {_pick(rng, last_names)}",
                    phone=f"+41 44 {rng.randint(100, 999)} {rng.randint(10, 99)} {rng.randint(10, 99)}",
                    email=f"provider{i}@pdms.local",
                    hin_email=f"provider{i}@hin.ch",
                ),
            ])

            # Aktiver Encounter
            encounter = Encounter(
                patient_id=patient.id,
                status="active",
                encounter_type=_pick(rng, ["hospitalization", "home-care", "ambulatory"]),
                ward=_pick(rng, wards),
                bed=f"{rng.randint(1, 4)}{_pick(rng, ['A', 'B'])}",
                admitted_at=now - timedelta(days=rng.randint(1, 14)),
                reason=_pick(rng, ["Pneumonie", "HWI", "Exsikkose", "Post-OP Monitoring"]),
            )
            session.add(encounter)
            await session.flush()
            stats.encounters += 1

            # Termine
            appointments: list[Appointment] = []
            for j in range(2):
                start = now + timedelta(days=j, hours=rng.randint(1, 8))
                appt = Appointment(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    appointment_type=_pick(rng, ["hausbesuch", "teleconsult", "konsil", "labor"]),
                    title=_pick(rng, ["Hausbesuch", "Telekonsultation", "Laborkontrolle", "Fachkonsil"]),
                    location=_pick(rng, ["Zuhause", "Video", "Labor", "Ambulanz"]),
                    scheduled_date=start.date(),
                    start_time=start,
                    end_time=start + timedelta(minutes=30),
                    duration_minutes=30,
                    status=_pick(rng, ["planned", "confirmed"]),
                )
                appointments.append(appt)
            session.add_all(appointments)
            await session.flush()
            stats.appointments += len(appointments)

            # Vitals (Zeitreihe)
            patient_vitals: list[VitalSign] = []
            for k in range(18):
                ts = now - timedelta(hours=48 - k * 2)
                hr = rng.randint(62, 115)
                spo2 = rng.randint(89, 99)
                vital = VitalSign(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    recorded_at=ts,
                    source="manual",
                    heart_rate=hr,
                    systolic_bp=rng.randint(100, 160),
                    diastolic_bp=rng.randint(60, 95),
                    spo2=spo2,
                    temperature=round(rng.uniform(36.0, 39.2), 1),
                    respiratory_rate=rng.randint(12, 30),
                    gcs=rng.randint(12, 15),
                    pain_score=rng.randint(0, 7),
                )
                patient_vitals.append(vital)
            session.add_all(patient_vitals)
            await session.flush()
            stats.vitals += len(patient_vitals)

            # Alarme aus auffälligen Vitals
            for vital in patient_vitals[-3:]:
                if (vital.spo2 or 100) < 92:
                    session.add(Alarm(
                        patient_id=patient.id,
                        vital_sign_id=vital.id,
                        parameter="spo2",
                        value=float(vital.spo2 or 0),
                        threshold_min=92.0,
                        severity="warning" if (vital.spo2 or 0) >= 90 else "critical",
                        status="active",
                        triggered_at=vital.recorded_at,
                    ))
                    stats.alarms += 1

            # Medikation
            meds: list[Medication] = []
            med_defs = [
                ("Paracetamol", "Paracetamol", "500", "mg", "oral", "3x täglich"),
                ("Ceftriaxon", "Ceftriaxon", "2", "g", "iv", "1x täglich"),
            ]
            for name, generic, dose, unit, route, freq in med_defs:
                med = Medication(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    name=name,
                    generic_name=generic,
                    dose=dose,
                    dose_unit=unit,
                    route=route,
                    frequency=freq,
                    start_date=now.date() - timedelta(days=rng.randint(0, 4)),
                    status="active",
                    reason="Infektbehandlung",
                )
                meds.append(med)
            session.add_all(meds)
            await session.flush()
            stats.medications += len(meds)

            for med in meds:
                session.add(MedicationAdministration(
                    medication_id=med.id,
                    patient_id=patient.id,
                    administered_at=now - timedelta(hours=rng.randint(1, 10)),
                    dose_given=med.dose,
                    dose_unit=med.dose_unit,
                    route=med.route,
                    status="completed",
                ))
                session.add(SelfMedicationLog(
                    patient_id=patient.id,
                    medication_id=med.id,
                    scheduled_time=now + timedelta(hours=2),
                    status=_pick(rng, ["pending", "confirmed", "missed"]),
                ))

            # Pflege / Notizen
            session.add_all([
                NursingEntry(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    category="observation",
                    title="Allgemeinzustand",
                    content="Patient wach, orientiert, kooperativ. Trinkmenge ausreichend.",
                    priority="normal",
                ),
                NursingAssessment(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    assessment_type="pain",
                    total_score=rng.randint(0, 8),
                    max_score=10,
                    risk_level=_pick(rng, ["low", "medium"]),
                    items={"ruhe": rng.randint(0, 5), "bewegung": rng.randint(0, 5)},
                ),
                ClinicalNote(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    note_type="progress_note",
                    title="Tagesverlauf",
                    content="Klinischer Verlauf stabil, keine akute Verschlechterung.",
                    status="final",
                ),
            ])

            # Labor
            for analyte, loinc, display, unit, ref_min, ref_max, value in [
                ("crp", "1988-5", "CRP", "mg/L", 0.0, 5.0, round(rng.uniform(3, 120), 1)),
                ("leukocytes", "6690-2", "Leukozyten", "10^9/L", 4.0, 10.0, round(rng.uniform(3, 16), 1)),
                ("creatinine", "2160-0", "Kreatinin", "µmol/L", 45.0, 104.0, round(rng.uniform(55, 160), 1)),
            ]:
                session.add(LabResult(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    analyte=analyte,
                    loinc_code=loinc,
                    display_name=display,
                    value=value,
                    unit=unit,
                    ref_min=ref_min,
                    ref_max=ref_max,
                    interpretation="pathological" if value > ref_max else "normal",
                    category="chemistry",
                    resulted_at=now - timedelta(hours=rng.randint(1, 24)),
                ))

            # I/O Bilanz
            session.add_all([
                FluidEntry(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    direction="intake",
                    category="oral",
                    display_name="Trinkmenge",
                    volume_ml=rng.randint(150, 450),
                ),
                FluidEntry(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    direction="intake",
                    category="infusion",
                    display_name="NaCl 0.9%",
                    volume_ml=500.0,
                    route="iv",
                ),
                FluidEntry(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    direction="output",
                    category="urine",
                    display_name="Urin",
                    volume_ml=rng.randint(200, 600),
                ),
            ])

            # Home-Spital
            home_visit = HomeVisit(
                patient_id=patient.id,
                appointment_id=appointments[0].id,
                encounter_id=encounter.id,
                assigned_nurse_name="Pflege Demo",
                status=_pick(rng, ["planned", "in_progress", "completed"]),
                planned_date=now.date(),
                planned_start=now + timedelta(hours=1),
                planned_end=now + timedelta(hours=2),
                patient_condition=_pick(rng, ["stable", "improved", "deteriorated"]),
                vital_signs_recorded=True,
                medication_administered=rng.random() < 0.7,
            )
            session.add(home_visit)

            session.add(Teleconsult(
                patient_id=patient.id,
                appointment_id=appointments[1].id,
                encounter_id=encounter.id,
                physician_name="Dr. Demo",
                status=_pick(rng, ["scheduled", "completed", "active"]),
                meeting_link="https://video.pdms.local/room/demo",
                meeting_platform="teams",
                scheduled_start=now + timedelta(hours=3),
                scheduled_end=now + timedelta(hours=3, minutes=30),
                soap_subjective="Patient berichtet leichte Dyspnoe bei Belastung.",
                soap_objective="SpO2 93-95%, RR 135/80 mmHg.",
                soap_assessment="Stabil unter Therapie.",
                soap_plan="Kontrolle in 24h, Medikation fortführen.",
            ))

            for dev_name, dev_type, unit in [
                ("Pulsoximeter Nonin", "pulsoximeter", "%"),
                ("Blutdruckgerät Omron", "blood_pressure", "mmHg"),
            ]:
                session.add(RemoteDevice(
                    patient_id=patient.id,
                    device_type=dev_type,
                    device_name=dev_name,
                    manufacturer="DemoMed",
                    serial_number=f"{dev_type[:3].upper()}-{i:03d}-{rng.randint(1000, 9999)}",
                    is_online=rng.random() < 0.85,
                    battery_level=rng.randint(25, 100),
                    last_seen_at=now - timedelta(minutes=rng.randint(1, 60)),
                    last_reading_value=str(rng.randint(90, 140)),
                    last_reading_unit=unit,
                    last_reading_at=now - timedelta(minutes=rng.randint(5, 120)),
                    installed_at=now.date() - timedelta(days=rng.randint(1, 30)),
                ))

            # Rechtliches
            session.add_all([
                Consent(
                    patient_id=patient.id,
                    consent_type="home_spital",
                    status="granted",
                    granted_at=now - timedelta(days=5),
                    granted_by=f"{patient.first_name} {patient.last_name}",
                    valid_from=(now - timedelta(days=5)).date(),
                ),
                AdvanceDirective(
                    patient_id=patient.id,
                    directive_type="patientenverfuegung",
                    rea_status=_pick(rng, ["FULL", "DNR"]),
                    intensive_care=True,
                    mechanical_ventilation=rng.random() < 0.8,
                    dialysis=rng.random() < 0.8,
                    artificial_nutrition=rng.random() < 0.85,
                    is_valid=True,
                ),
                PatientWishes(
                    patient_id=patient.id,
                    quality_of_life="Möglichst selbstständig zuhause bleiben.",
                    pain_management="Frühzeitig behandeln, keine starken Schmerzen.",
                    family_wishes="Tägliche Information an Angehörige.",
                ),
                PalliativeCare(
                    patient_id=patient.id,
                    is_active=rng.random() < 0.2,
                    reserve_morphin="Morphin 5mg s.c. b.B.",
                    goals_of_care="Symptomkontrolle und Lebensqualität.",
                ),
                DeathNotification(
                    patient_id=patient.id,
                    contact_name=f"Angehörige {patient.last_name}",
                    contact_phone=f"+41 79 {rng.randint(100, 999)} {rng.randint(10, 99)} {rng.randint(10, 99)}",
                    contact_role="Angehörige",
                    priority=1,
                    instructions="Bei kritischer Verschlechterung sofort informieren.",
                ),
            ])

            # Therapie / Diagnosen
            diagnosis = Diagnosis(
                patient_id=patient.id,
                encounter_id=encounter.id,
                icd_code=_pick(rng, ["J18.9", "N39.0", "I50.9", "E86"]),
                title=_pick(rng, ["Pneumonie", "Harnwegsinfekt", "Herzinsuffizienz", "Exsikkose"]),
                diagnosis_type="haupt",
                status="active",
            )
            session.add(diagnosis)
            await session.flush()

            plan = TreatmentPlan(
                patient_id=patient.id,
                encounter_id=encounter.id,
                title="Akuttherapieplan",
                diagnosis=diagnosis.title,
                icd_code=diagnosis.icd_code,
                goals="Infektkontrolle und klinische Stabilisierung.",
                interventions="AB-Therapie, Flüssigkeitsmanagement, engmaschige Kontrollen.",
                start_date=now.date() - timedelta(days=1),
                target_date=now.date() + timedelta(days=4),
                status="active",
                priority="high",
            )
            session.add(plan)
            await session.flush()

            session.add_all([
                TreatmentPlanItem(
                    plan_id=plan.id,
                    item_type="medication",
                    description="Ceftriaxon 2g i.v. 1x täglich",
                    frequency="1x täglich",
                    status="in_progress",
                    sort_order=1,
                ),
                Consultation(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    specialty="Infektiologie",
                    urgency="routine",
                    question="Dauer der antibiotischen Therapie?",
                    status="requested",
                ),
                MedicalLetter(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    letter_type="progress",
                    title="Zwischenbericht",
                    diagnosis=diagnosis.title,
                    findings="Klinisch stabil, Entzündungswerte rückläufig.",
                    recommendations="Fortführung Therapie, Verlaufskontrolle.",
                    status="draft",
                ),
                NursingDiagnosis(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    title="Beeinträchtigter Gasaustausch",
                    priority="high",
                    status="active",
                ),
                ShiftHandover(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    shift_type=_pick(rng, ["early", "late", "night"]),
                    handover_date=now.date(),
                    situation="Patient stabil, keine akuten Beschwerden.",
                    recommendation="Vitalzeichen alle 4h kontrollieren.",
                ),
                NutritionOrder(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    diet_type=_pick(rng, ["normal", "light", "diabetic"]),
                    caloric_target=rng.randint(1600, 2300),
                    fluid_target=rng.randint(1500, 2500),
                    start_date=now.date() - timedelta(days=1),
                    status="active",
                ),
                NutritionScreening(
                    patient_id=patient.id,
                    screening_type="nrs2002",
                    total_score=rng.randint(1, 5),
                    risk_level=_pick(rng, ["low", "medium", "high"]),
                    items={"bmi": rng.randint(0, 3), "weight_loss": rng.randint(0, 3)},
                ),
                DischargeCriteria(
                    patient_id=patient.id,
                    encounter_id=encounter.id,
                    planned_discharge_date=now.date() + timedelta(days=3),
                    crp_declining=rng.random() < 0.7,
                    crp_below_50=rng.random() < 0.6,
                    afebrile_48h=rng.random() < 0.65,
                    oral_stable_48h=rng.random() < 0.5,
                    clinical_improvement=rng.random() < 0.75,
                    aftercare_organized=rng.random() < 0.55,
                ),
            ])

            # Verbrauchsmaterialeinsatz
            session.add(SupplyUsage(
                patient_id=patient.id,
                encounter_id=encounter.id,
                supply_item_id=_pick(rng, supply_items).id,
                quantity=rng.randint(1, 4),
                reason="Routineversorgung",
            ))

        # Ende Patient-Loop
        await session.commit()

    return stats


async def _run() -> None:
    parser = argparse.ArgumentParser(description="PDMS Dev Seeder")
    parser.add_argument("--patients", type=int, default=20, help="Anzahl Patienten (Default: 20)")
    parser.add_argument("--seed", type=int, default=42, help="Random Seed (Default: 42)")
    parser.add_argument("--reset", action="store_true", help="Vorhandene Seed-Zieldaten vorab löschen")
    args = parser.parse_args()

    stats = await seed_dev_data(patient_count=max(args.patients, 1), rng_seed=args.seed, reset=args.reset)

    print("✅ Seeder abgeschlossen")
    print(f"   Patienten:      {stats.patients}")
    print(f"   Encounters:     {stats.encounters}")
    print(f"   Vitals:         {stats.vitals}")
    print(f"   Alarme:         {stats.alarms}")
    print(f"   Medikamente:    {stats.medications}")
    print(f"   Termine:        {stats.appointments}")


if __name__ == "__main__":
    asyncio.run(_run())
