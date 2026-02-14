"""ICD-10 Katalog — Tabelle + Seed-Daten für Diagnosesuche

Revision ID: 011_icd10_catalog
Revises: 010_diagnoses
Create Date: 2026-02-13
"""

from typing import Sequence, Union
import uuid

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from alembic import op

revision: str = "011_icd10_catalog"
down_revision: Union[str, None] = "010_diagnoses"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Häufigste ICD-10 Codes in der Schweizer Home-Hospitalisierung
ICD10_SEED = [
    # ─── Infektionskrankheiten (A00-B99) ────────────────────
    ("A09.0", "Sonstige Gastroenteritis und Kolitis infektiösen Ursprungs", "I", "A00-A09", "Infektionskrankheiten"),
    ("A41.9", "Sepsis, nicht näher bezeichnet", "I", "A30-A49", "Infektionskrankheiten"),
    ("A46", "Erysipel", "I", "A30-A49", "Infektionskrankheiten"),
    ("A49.9", "Bakterielle Infektion, nicht näher bezeichnet", "I", "A30-A49", "Infektionskrankheiten"),
    ("B34.9", "Virusinfektion, nicht näher bezeichnet", "I", "B25-B34", "Infektionskrankheiten"),
    ("B37.0", "Candida-Stomatitis (Soor)", "I", "B35-B49", "Infektionskrankheiten"),

    # ─── Neubildungen (C00-D48) ─────────────────────────────
    ("C18.9", "Bösartige Neubildung des Kolons, nicht näher bezeichnet", "II", "C15-C26", "Neubildungen"),
    ("C34.9", "Bösartige Neubildung der Bronchien/Lunge", "II", "C30-C39", "Neubildungen"),
    ("C50.9", "Bösartige Neubildung der Brustdrüse", "II", "C50", "Neubildungen"),
    ("C61", "Bösartige Neubildung der Prostata", "II", "C60-C63", "Neubildungen"),
    ("C67.9", "Bösartige Neubildung der Harnblase", "II", "C64-C68", "Neubildungen"),
    ("C78.7", "Sekundäre bösartige Neubildung der Leber", "II", "C76-C80", "Neubildungen"),
    ("C79.5", "Sekundäre bösartige Neubildung des Knochens", "II", "C76-C80", "Neubildungen"),
    ("C90.0", "Multiples Myelom", "II", "C81-C96", "Neubildungen"),
    ("D64.9", "Anämie, nicht näher bezeichnet", "III", "D60-D64", "Blut"),

    # ─── Endokrine/Stoffwechsel (E00-E90) ───────────────────
    ("E10.9", "Diabetes mellitus Typ 1 ohne Komplikationen", "IV", "E10-E14", "Stoffwechsel"),
    ("E11.0", "Diabetes mellitus Typ 2 mit Koma", "IV", "E10-E14", "Stoffwechsel"),
    ("E11.4", "Diabetes mellitus Typ 2 mit neurologischen Komplikationen", "IV", "E10-E14", "Stoffwechsel"),
    ("E11.5", "Diabetes mellitus Typ 2 mit peripheren vaskulären Komplikationen", "IV", "E10-E14", "Stoffwechsel"),
    ("E11.7", "Diabetes mellitus Typ 2 mit multiplen Komplikationen", "IV", "E10-E14", "Stoffwechsel"),
    ("E11.9", "Diabetes mellitus Typ 2 ohne Komplikationen", "IV", "E10-E14", "Stoffwechsel"),
    ("E43", "Nicht näher bezeichnete erhebliche Energie-/Eiweissmangelernährung", "IV", "E40-E46", "Stoffwechsel"),
    ("E44.0", "Mässige Energie- und Eiweissmangelernährung", "IV", "E40-E46", "Stoffwechsel"),
    ("E46", "Nicht näher bezeichnete Energie-/Eiweissmangelernährung", "IV", "E40-E46", "Stoffwechsel"),
    ("E78.0", "Reine Hypercholesterinämie", "IV", "E70-E90", "Stoffwechsel"),
    ("E78.5", "Hyperlipidämie, nicht näher bezeichnet", "IV", "E70-E90", "Stoffwechsel"),
    ("E83.5", "Störungen des Kalziumstoffwechsels", "IV", "E70-E90", "Stoffwechsel"),
    ("E86", "Volumenmangel (Dehydratation)", "IV", "E70-E90", "Stoffwechsel"),
    ("E87.1", "Hypoosmolalität und Hyponatriämie", "IV", "E70-E90", "Stoffwechsel"),
    ("E87.6", "Hypokaliämie", "IV", "E70-E90", "Stoffwechsel"),

    # ─── Psychische Störungen (F00-F99) ─────────────────────
    ("F00.1", "Demenz bei Alzheimer-Krankheit mit spätem Beginn", "V", "F00-F09", "Psyche"),
    ("F01.9", "Vaskuläre Demenz, nicht näher bezeichnet", "V", "F00-F09", "Psyche"),
    ("F03", "Nicht näher bezeichnete Demenz", "V", "F00-F09", "Psyche"),
    ("F05.0", "Delir ohne Demenz", "V", "F00-F09", "Psyche"),
    ("F05.1", "Delir bei Demenz", "V", "F00-F09", "Psyche"),
    ("F10.2", "Psychische Störung durch Alkohol — Abhängigkeitssyndrom", "V", "F10-F19", "Psyche"),
    ("F20.0", "Paranoide Schizophrenie", "V", "F20-F29", "Psyche"),
    ("F32.1", "Mittelgradige depressive Episode", "V", "F30-F39", "Psyche"),
    ("F32.2", "Schwere depressive Episode ohne psychotische Symptome", "V", "F30-F39", "Psyche"),
    ("F33.1", "Rezidivierende depressive Störung, mittelgradige Episode", "V", "F30-F39", "Psyche"),
    ("F41.0", "Panikstörung", "V", "F40-F48", "Psyche"),
    ("F41.1", "Generalisierte Angststörung", "V", "F40-F48", "Psyche"),
    ("F43.2", "Anpassungsstörungen", "V", "F40-F48", "Psyche"),

    # ─── Nervensystem (G00-G99) ─────────────────────────────
    ("G20", "Primäres Parkinson-Syndrom", "VI", "G20-G26", "Nervensystem"),
    ("G30.1", "Alzheimer-Krankheit mit spätem Beginn", "VI", "G30-G32", "Nervensystem"),
    ("G35", "Multiple Sklerose (Encephalomyelitis disseminata)", "VI", "G35-G37", "Nervensystem"),
    ("G40.9", "Epilepsie, nicht näher bezeichnet", "VI", "G40-G47", "Nervensystem"),
    ("G43.9", "Migräne, nicht näher bezeichnet", "VI", "G43-G44", "Nervensystem"),
    ("G45.9", "Transitorische zerebrale ischämische Attacke (TIA)", "VI", "G45-G46", "Nervensystem"),
    ("G47.3", "Schlafapnoe", "VI", "G40-G47", "Nervensystem"),
    ("G62.9", "Polyneuropathie, nicht näher bezeichnet", "VI", "G60-G64", "Nervensystem"),
    ("G81.9", "Hemiparese/Hemiplegie, nicht näher bezeichnet", "VI", "G80-G83", "Nervensystem"),
    ("G82.2", "Paraparese/Paraplegie, nicht näher bezeichnet", "VI", "G80-G83", "Nervensystem"),

    # ─── Kreislaufsystem (I00-I99) ──────────────────────────
    ("I10", "Essentielle (primäre) Hypertonie", "IX", "I10-I15", "Kreislauf"),
    ("I11.0", "Hypertensive Herzkrankheit mit Herzinsuffizienz", "IX", "I10-I15", "Kreislauf"),
    ("I20.0", "Instabile Angina pectoris", "IX", "I20-I25", "Kreislauf"),
    ("I20.9", "Angina pectoris, nicht näher bezeichnet", "IX", "I20-I25", "Kreislauf"),
    ("I21.0", "Akuter transmuraler Myokardinfarkt der Vorderwand", "IX", "I20-I25", "Kreislauf"),
    ("I21.9", "Akuter Myokardinfarkt, nicht näher bezeichnet", "IX", "I20-I25", "Kreislauf"),
    ("I25.1", "Atherosklerotische Herzkrankheit", "IX", "I20-I25", "Kreislauf"),
    ("I25.9", "Chronische ischämische Herzkrankheit", "IX", "I20-I25", "Kreislauf"),
    ("I26.9", "Lungenembolie ohne Angabe eines akuten Cor pulmonale", "IX", "I26-I28", "Kreislauf"),
    ("I42.0", "Dilatative Kardiomyopathie", "IX", "I42-I43", "Kreislauf"),
    ("I48.0", "Vorhofflimmern, paroxysmal", "IX", "I44-I49", "Kreislauf"),
    ("I48.1", "Vorhofflimmern, persistierend", "IX", "I44-I49", "Kreislauf"),
    ("I48.2", "Vorhofflimmern, permanent (chronisch)", "IX", "I44-I49", "Kreislauf"),
    ("I48.9", "Vorhofflimmern/-flattern, nicht näher bezeichnet", "IX", "I44-I49", "Kreislauf"),
    ("I49.9", "Kardiale Arrhythmie, nicht näher bezeichnet", "IX", "I44-I49", "Kreislauf"),
    ("I50.0", "Rechtsherzinsuffizienz", "IX", "I50", "Kreislauf"),
    ("I50.1", "Linksherzinsuffizienz", "IX", "I50", "Kreislauf"),
    ("I50.9", "Herzinsuffizienz, nicht näher bezeichnet", "IX", "I50", "Kreislauf"),
    ("I63.9", "Hirninfarkt, nicht näher bezeichnet", "IX", "I60-I69", "Kreislauf"),
    ("I64", "Schlaganfall, nicht als Blutung oder Infarkt bezeichnet", "IX", "I60-I69", "Kreislauf"),
    ("I67.2", "Zerebrale Atherosklerose", "IX", "I60-I69", "Kreislauf"),
    ("I69.3", "Folgen eines Hirninfarktes", "IX", "I60-I69", "Kreislauf"),
    ("I70.2", "Atherosklerose der Extremitätenarterien (pAVK)", "IX", "I70-I79", "Kreislauf"),
    ("I73.9", "Periphere Gefässkrankheit, nicht näher bezeichnet", "IX", "I70-I79", "Kreislauf"),
    ("I80.2", "Phlebothrombose der unteren Extremitäten", "IX", "I80-I89", "Kreislauf"),
    ("I83.9", "Varizen der unteren Extremitäten ohne Ulkus", "IX", "I80-I89", "Kreislauf"),
    ("I87.0", "Postthrombotisches Syndrom", "IX", "I80-I89", "Kreislauf"),

    # ─── Atmungssystem (J00-J99) ────────────────────────────
    ("J06.9", "Akute Infektion der oberen Atemwege", "X", "J00-J06", "Atmung"),
    ("J12.9", "Viruspneumonie, nicht näher bezeichnet", "X", "J09-J18", "Atmung"),
    ("J15.9", "Bakterielle Pneumonie, nicht näher bezeichnet", "X", "J09-J18", "Atmung"),
    ("J18.0", "Bronchopneumonie, nicht näher bezeichnet", "X", "J09-J18", "Atmung"),
    ("J18.9", "Pneumonie, nicht näher bezeichnet", "X", "J09-J18", "Atmung"),
    ("J20.9", "Akute Bronchitis, nicht näher bezeichnet", "X", "J20-J22", "Atmung"),
    ("J22", "Akute Infektion der unteren Atemwege, nicht näher bezeichnet", "X", "J20-J22", "Atmung"),
    ("J44.0", "COPD mit akuter Exazerbation", "X", "J40-J47", "Atmung"),
    ("J44.1", "COPD mit akuter Exazerbation, nicht näher bezeichnet", "X", "J40-J47", "Atmung"),
    ("J44.9", "COPD, nicht näher bezeichnet", "X", "J40-J47", "Atmung"),
    ("J45.9", "Asthma bronchiale, nicht näher bezeichnet", "X", "J40-J47", "Atmung"),
    ("J69.0", "Aspirationspneumonie durch Nahrung oder Erbrochenes", "X", "J60-J70", "Atmung"),
    ("J90", "Pleuraerguss", "X", "J90-J94", "Atmung"),
    ("J96.0", "Akute respiratorische Insuffizienz", "X", "J95-J99", "Atmung"),
    ("J96.1", "Chronische respiratorische Insuffizienz", "X", "J95-J99", "Atmung"),

    # ─── Verdauungssystem (K00-K93) ─────────────────────────
    ("K21.0", "Gastroösophageale Refluxkrankheit mit Ösophagitis", "XI", "K20-K31", "Verdauung"),
    ("K25.9", "Magenulkus, nicht näher bezeichnet", "XI", "K20-K31", "Verdauung"),
    ("K29.7", "Gastritis, nicht näher bezeichnet", "XI", "K20-K31", "Verdauung"),
    ("K52.9", "Nichtinfektiöse Gastroenteritis und Kolitis", "XI", "K50-K52", "Verdauung"),
    ("K56.6", "Sonstiger und nicht näher bezeichneter Ileus", "XI", "K55-K63", "Verdauung"),
    ("K59.0", "Obstipation", "XI", "K55-K63", "Verdauung"),
    ("K70.3", "Alkoholische Leberzirrhose", "XI", "K70-K77", "Verdauung"),
    ("K74.6", "Sonstige und nicht näher bezeichnete Zirrhose der Leber", "XI", "K70-K77", "Verdauung"),
    ("K85.9", "Akute Pankreatitis, nicht näher bezeichnet", "XI", "K80-K87", "Verdauung"),
    ("K92.2", "Gastrointestinale Blutung, nicht näher bezeichnet", "XI", "K90-K93", "Verdauung"),

    # ─── Haut (L00-L99) ────────────────────────────────────
    ("L02.9", "Hautabszess, Furunkel und Karbunkel", "XII", "L00-L08", "Haut"),
    ("L03.1", "Phlegmone an sonstigen Teilen der Extremitäten", "XII", "L00-L08", "Haut"),
    ("L89.1", "Dekubitus 2. Grades", "XII", "L80-L99", "Haut"),
    ("L89.2", "Dekubitus 3. Grades", "XII", "L80-L99", "Haut"),
    ("L89.3", "Dekubitus 4. Grades", "XII", "L80-L99", "Haut"),
    ("L97", "Ulcus cruris, anderenorts nicht klassifiziert", "XII", "L80-L99", "Haut"),

    # ─── Muskel-Skelett (M00-M99) ──────────────────────────
    ("M05.9", "Seropositive chronische Polyarthritis", "XIII", "M05-M14", "Muskel-Skelett"),
    ("M16.1", "Primäre Koxarthrose, einseitig", "XIII", "M15-M19", "Muskel-Skelett"),
    ("M17.1", "Primäre Gonarthrose, einseitig", "XIII", "M15-M19", "Muskel-Skelett"),
    ("M47.8", "Sonstige Spondylose", "XIII", "M45-M49", "Muskel-Skelett"),
    ("M54.5", "Kreuzschmerz (Lumbago)", "XIII", "M50-M54", "Muskel-Skelett"),
    ("M79.3", "Panniculitis, nicht näher bezeichnet", "XIII", "M70-M79", "Muskel-Skelett"),
    ("M80.0", "Osteoporose mit pathologischer Fraktur", "XIII", "M80-M85", "Muskel-Skelett"),
    ("M81.0", "Postmenopausale Osteoporose", "XIII", "M80-M85", "Muskel-Skelett"),
    ("M81.9", "Osteoporose, nicht näher bezeichnet", "XIII", "M80-M85", "Muskel-Skelett"),

    # ─── Urogenitalsystem (N00-N99) ─────────────────────────
    ("N10", "Akute tubulointerstitielle Nephritis (Pyelonephritis)", "XIV", "N10-N16", "Urogenital"),
    ("N17.9", "Akutes Nierenversagen, nicht näher bezeichnet", "XIV", "N17-N19", "Urogenital"),
    ("N18.3", "Chronische Nierenkrankheit, Stadium 3", "XIV", "N17-N19", "Urogenital"),
    ("N18.4", "Chronische Nierenkrankheit, Stadium 4", "XIV", "N17-N19", "Urogenital"),
    ("N18.5", "Chronische Nierenkrankheit, Stadium 5", "XIV", "N17-N19", "Urogenital"),
    ("N18.9", "Chronische Nierenkrankheit, nicht näher bezeichnet", "XIV", "N17-N19", "Urogenital"),
    ("N30.0", "Akute Zystitis", "XIV", "N30-N39", "Urogenital"),
    ("N39.0", "Harnwegsinfektion, Lokalisation nicht näher bezeichnet", "XIV", "N30-N39", "Urogenital"),
    ("N40", "Prostatahyperplasie", "XIV", "N40-N51", "Urogenital"),

    # ─── Verletzungen/Frakturen (S00-T98) ──────────────────
    ("S06.0", "Gehirnerschütterung (Commotio cerebri)", "XIX", "S00-S09", "Verletzungen"),
    ("S32.0", "Fraktur eines Lendenwirbels", "XIX", "S30-S39", "Verletzungen"),
    ("S42.2", "Fraktur des proximalen Endes des Humerus", "XIX", "S40-S49", "Verletzungen"),
    ("S52.5", "Distale Radiusfraktur", "XIX", "S50-S59", "Verletzungen"),
    ("S72.0", "Schenkelhalsfraktur", "XIX", "S70-S79", "Verletzungen"),
    ("S72.1", "Pertrochantäre Fraktur", "XIX", "S70-S79", "Verletzungen"),
    ("S82.0", "Fraktur der Patella", "XIX", "S80-S89", "Verletzungen"),
    ("S82.6", "Fraktur des Aussenknöchels (Malleolus lateralis)", "XIX", "S80-S89", "Verletzungen"),
    ("T81.4", "Infektion nach einem Eingriff", "XIX", "T80-T88", "Verletzungen"),
    ("T84.0", "Mechanische Komplikation einer Gelenkendoprothese", "XIX", "T80-T88", "Verletzungen"),
    ("T85.7", "Infektion/entzündliche Reaktion durch Prothese/Implantat", "XIX", "T80-T88", "Verletzungen"),

    # ─── Symptome/Befunde (R00-R99) ─────────────────────────
    ("R00.0", "Tachykardie, nicht näher bezeichnet", "XVIII", "R00-R09", "Symptome"),
    ("R04.0", "Epistaxis (Nasenbluten)", "XVIII", "R00-R09", "Symptome"),
    ("R05", "Husten", "XVIII", "R00-R09", "Symptome"),
    ("R06.0", "Dyspnoe", "XVIII", "R00-R09", "Symptome"),
    ("R07.4", "Brustschmerz, nicht näher bezeichnet", "XVIII", "R00-R09", "Symptome"),
    ("R10.4", "Sonstige und nicht näher bezeichnete Bauchschmerzen", "XVIII", "R10-R19", "Symptome"),
    ("R11", "Übelkeit und Erbrechen", "XVIII", "R10-R19", "Symptome"),
    ("R13", "Dysphagie (Schluckstörung)", "XVIII", "R10-R19", "Symptome"),
    ("R26.8", "Sonstige und nicht näher bezeichnete Störungen des Ganges", "XVIII", "R25-R29", "Symptome"),
    ("R29.6", "Sturzneigung, anderenorts nicht klassifiziert", "XVIII", "R25-R29", "Symptome"),
    ("R33", "Harnverhaltung", "XVIII", "R30-R39", "Symptome"),
    ("R40.0", "Somnolenz", "XVIII", "R40-R46", "Symptome"),
    ("R41.0", "Orientierungsstörung, nicht näher bezeichnet", "XVIII", "R40-R46", "Symptome"),
    ("R42", "Schwindel und Taumel", "XVIII", "R40-R46", "Symptome"),
    ("R50.9", "Fieber, nicht näher bezeichnet", "XVIII", "R50-R69", "Symptome"),
    ("R52.2", "Sonstiger chronischer Schmerz", "XVIII", "R50-R69", "Symptome"),
    ("R54", "Senilität (Altersschwäche)", "XVIII", "R50-R69", "Symptome"),
    ("R55", "Synkope und Kollaps", "XVIII", "R50-R69", "Symptome"),
    ("R56.0", "Fieberkrämpfe", "XVIII", "R50-R69", "Symptome"),
    ("R57.0", "Kardiogener Schock", "XVIII", "R50-R69", "Symptome"),
    ("R63.0", "Anorexie (Appetitlosigkeit)", "XVIII", "R50-R69", "Symptome"),
    ("R63.4", "Abnorme Gewichtsabnahme", "XVIII", "R50-R69", "Symptome"),
    ("R64", "Kachexie", "XVIII", "R50-R69", "Symptome"),

    # ─── Äussere Ursachen / Zusatzdiagnosen (Z00-Z99) ──────
    ("Z22.3", "Keimträger anderer näher bezeichneter bakterieller Krankheiten (MRSA)", "XXI", "Z20-Z29", "Zusatz"),
    ("Z43.1", "Versorgung eines Gastrostomas", "XXI", "Z40-Z54", "Zusatz"),
    ("Z43.3", "Versorgung eines Kolostomas", "XXI", "Z40-Z54", "Zusatz"),
    ("Z51.1", "Chemotherapie-Sitzung wegen bösartiger Neubildung", "XXI", "Z40-Z54", "Zusatz"),
    ("Z51.5", "Palliativbehandlung", "XXI", "Z40-Z54", "Zusatz"),
    ("Z74.0", "Hilfsbedürftigkeit wegen eingeschränkter Mobilität", "XXI", "Z70-Z76", "Zusatz"),
    ("Z87.3", "Krankheiten des Muskel-Skelett-Systems in der Eigenanamnese", "XXI", "Z80-Z99", "Zusatz"),
    ("Z93.1", "Vorhandensein eines Gastrostomas", "XXI", "Z80-Z99", "Zusatz"),
    ("Z95.0", "Vorhandensein eines Herzschrittmachers", "XXI", "Z80-Z99", "Zusatz"),
    ("Z95.1", "Vorhandensein eines aortokoronaren Bypasses", "XXI", "Z80-Z99", "Zusatz"),
    ("Z96.6", "Vorhandensein einer Gelenkendoprothese", "XXI", "Z80-Z99", "Zusatz"),
    ("Z99.1", "Abhängigkeit von einem Respirator (Beatmungsgerät)", "XXI", "Z80-Z99", "Zusatz"),
    ("Z99.2", "Abhängigkeit von Nierendialyse", "XXI", "Z80-Z99", "Zusatz"),
]


def upgrade() -> None:
    # Tabelle erstellen
    op.create_table(
        "icd10_catalog",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("code", sa.String(20), nullable=False, unique=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("chapter", sa.String(10), nullable=True),
        sa.Column("block", sa.String(20), nullable=True),
        sa.Column("category", sa.String(100), nullable=True),
    )
    op.create_index("ix_icd10_catalog_code", "icd10_catalog", ["code"])
    # Trigram-ähnliche Suche: Index für LIKE-Pattern auf title
    op.create_index("ix_icd10_catalog_title", "icd10_catalog", ["title"])

    # Seed-Daten einfügen
    icd10_table = sa.table(
        "icd10_catalog",
        sa.column("code", sa.String),
        sa.column("title", sa.String),
        sa.column("chapter", sa.String),
        sa.column("block", sa.String),
        sa.column("category", sa.String),
    )

    op.bulk_insert(
        icd10_table,
        [
            {"code": code, "title": title, "chapter": chapter, "block": block, "category": category}
            for code, title, chapter, block, category in ICD10_SEED
        ],
    )


def downgrade() -> None:
    op.drop_index("ix_icd10_catalog_title", table_name="icd10_catalog")
    op.drop_index("ix_icd10_catalog_code", table_name="icd10_catalog")
    op.drop_table("icd10_catalog")
