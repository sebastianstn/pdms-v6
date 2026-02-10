"""Centralized routing key constants for RabbitMQ events."""


class RoutingKeys:
    """Topic routing keys for the pdms.events exchange."""

    # ─── Vitals ────────────────────────────────────────────
    VITAL_RECORDED = "vital.recorded"

    # ─── Alarms ────────────────────────────────────────────
    ALARM_WARNING = "alarm.warning"
    ALARM_CRITICAL = "alarm.critical"
    ALARM_ACKNOWLEDGED = "alarm.acknowledged"
    ALARM_RESOLVED = "alarm.resolved"

    # ─── Medication ────────────────────────────────────────
    MEDICATION_CREATED = "medication.created"
    MEDICATION_UPDATED = "medication.updated"
    MEDICATION_DISCONTINUED = "medication.discontinued"
    MEDICATION_ADMINISTERED = "medication.administered"

    # ─── Encounters ────────────────────────────────────────
    ENCOUNTER_ADMITTED = "encounter.admitted"
    ENCOUNTER_DISCHARGED = "encounter.discharged"
    ENCOUNTER_TRANSFERRED = "encounter.transferred"
    ENCOUNTER_CANCELLED = "encounter.cancelled"

    # ─── Clinical Notes ────────────────────────────────────
    NOTE_CREATED = "note.created"
    NOTE_FINALIZED = "note.finalized"
    NOTE_COSIGNED = "note.cosigned"

    # ─── Nursing ───────────────────────────────────────────
    NURSING_ENTRY_CREATED = "nursing.entry_created"
    NURSING_ASSESSMENT_CREATED = "nursing.assessment_created"

    # ─── Appointments ──────────────────────────────────────
    APPOINTMENT_CREATED = "appointment.created"
    APPOINTMENT_CANCELLED = "appointment.cancelled"

    # ─── Consents ──────────────────────────────────────────
    CONSENT_GRANTED = "consent.granted"
    CONSENT_REVOKED = "consent.revoked"

    # ─── Home Visits (Phase 3b) ────────────────────────────
    HOME_VISIT_CREATED = "home_visit.created"
    HOME_VISIT_STATUS_CHANGED = "home_visit.status_changed"

    # ─── Teleconsults (Phase 3b) ───────────────────────────
    TELECONSULT_STARTED = "teleconsult.started"
    TELECONSULT_ENDED = "teleconsult.ended"

    # ─── Remote Devices (Phase 3b) ─────────────────────────
    DEVICE_ALERT = "device.alert"
    DEVICE_OFFLINE = "device.offline"

    # ─── Self-Medication (Phase 3b) ────────────────────────
    SELF_MED_MISSED = "self_medication.missed"
    # ─── Lab Results (Phase 3c) ────────────────────────────────
    LAB_RESULTED = "lab.resulted"
    LAB_CRITICAL = "lab.critical"

    # ─── Fluid Balance (Phase 3c) ──────────────────────────────
    FLUID_RECORDED = "fluid.recorded"
    FLUID_BALANCE_ALERT = "fluid.balance_alert"