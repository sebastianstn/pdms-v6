"""Event handlers for the PDMS notification consumer.

All handlers are registered via the @on_event decorator from the
rabbitmq infrastructure module.  They run inside the consumer task
whenever a matching message arrives from the pdms.events exchange.

Cache invalidation: handlers that mutate domain data call
``invalidate()`` so stale Valkey entries are evicted immediately
rather than waiting for TTL expiry.
"""

import logging

from src.infrastructure.rabbitmq import on_event
from src.infrastructure.valkey import CacheKeys, invalidate

logger = logging.getLogger("pdms.events.handlers")


# ─── Alarm Handlers ────────────────────────────────────────────


@on_event("alarm.critical")
async def handle_critical_alarm(payload: dict) -> None:
    """Handle critical alarm — high-priority notification."""
    logger.warning(
        "🚨 CRITICAL ALARM: patient=%s parameter=%s value=%s",
        payload.get("patient_id"),
        payload.get("parameter"),
        payload.get("value"),
    )
    await invalidate(CacheKeys.ALARM_ALL)
    # TODO Phase 3+: Push notification via WebSocket / SSE / external system


@on_event("alarm.warning")
async def handle_warning_alarm(payload: dict) -> None:
    """Handle warning alarm — medium-priority notification."""
    logger.info(
        "⚠️ WARNING ALARM: patient=%s parameter=%s value=%s",
        payload.get("patient_id"),
        payload.get("parameter"),
        payload.get("value"),
    )
    await invalidate(CacheKeys.ALARM_ALL)


@on_event("alarm.acknowledged")
async def handle_alarm_acknowledged(payload: dict) -> None:
    """Handle alarm acknowledged event."""
    logger.info(
        "✓ Alarm acknowledged: alarm_id=%s by=%s",
        payload.get("alarm_id"),
        payload.get("acknowledged_by"),
    )
    await invalidate(CacheKeys.ALARM_ALL)


@on_event("alarm.resolved")
async def handle_alarm_resolved(payload: dict) -> None:
    """Handle alarm resolved event."""
    logger.info(
        "✓ Alarm resolved: alarm_id=%s by=%s",
        payload.get("alarm_id"),
        payload.get("resolved_by"),
    )
    await invalidate(CacheKeys.ALARM_ALL)


# ─── Medication Handlers ──────────────────────────────────────


@on_event("medication.created")
async def handle_medication_created(payload: dict) -> None:
    logger.info(
        "💊 Medication created: patient=%s name=%s",
        payload.get("patient_id"),
        payload.get("medication_name"),
    )


@on_event("medication.discontinued")
async def handle_medication_discontinued(payload: dict) -> None:
    logger.info(
        "🛑 Medication discontinued: patient=%s name=%s",
        payload.get("patient_id"),
        payload.get("medication_name"),
    )


@on_event("medication.administered")
async def handle_medication_administered(payload: dict) -> None:
    logger.info(
        "💉 Medication administered: patient=%s med_id=%s",
        payload.get("patient_id"),
        payload.get("medication_id"),
    )


# ─── Encounter Handlers ───────────────────────────────────────


@on_event("encounter.admitted")
async def handle_encounter_admitted(payload: dict) -> None:
    logger.info(
        "🏥 Patient admitted: patient=%s encounter=%s ward=%s",
        payload.get("patient_id"),
        payload.get("encounter_id"),
        payload.get("ward"),
    )
    # Patient state changed — invalidate patient cache
    pid = payload.get("patient_id")
    if pid:
        await invalidate(CacheKeys.patient(pid), CacheKeys.PATIENT_LIST_ALL)


@on_event("encounter.discharged")
async def handle_encounter_discharged(payload: dict) -> None:
    logger.info(
        "🏠 Patient discharged: patient=%s encounter=%s",
        payload.get("patient_id"),
        payload.get("encounter_id"),
    )
    pid = payload.get("patient_id")
    if pid:
        await invalidate(CacheKeys.patient(pid), CacheKeys.PATIENT_LIST_ALL)


@on_event("encounter.transferred")
async def handle_encounter_transferred(payload: dict) -> None:
    logger.info(
        "🔄 Patient transferred: patient=%s encounter=%s → ward=%s",
        payload.get("patient_id"),
        payload.get("encounter_id"),
        payload.get("ward"),
    )
    pid = payload.get("patient_id")
    if pid:
        await invalidate(CacheKeys.patient(pid), CacheKeys.PATIENT_LIST_ALL)


@on_event("encounter.cancelled")
async def handle_encounter_cancelled(payload: dict) -> None:
    logger.info(
        "❌ Encounter cancelled: patient=%s encounter=%s",
        payload.get("patient_id"),
        payload.get("encounter_id"),
    )


# ─── Clinical Notes Handlers ──────────────────────────────────


@on_event("note.created")
async def handle_note_created(payload: dict) -> None:
    logger.info(
        "📝 Clinical note created: patient=%s note=%s type=%s",
        payload.get("patient_id"),
        payload.get("note_id"),
        payload.get("note_type"),
    )


@on_event("note.finalized")
async def handle_note_finalized(payload: dict) -> None:
    logger.info(
        "✅ Clinical note finalized: note=%s by=%s",
        payload.get("note_id"),
        payload.get("finalized_by"),
    )


@on_event("note.cosigned")
async def handle_note_cosigned(payload: dict) -> None:
    logger.info(
        "✅ Clinical note co-signed: note=%s by=%s",
        payload.get("note_id"),
        payload.get("co_signed_by"),
    )


# ─── Nursing Handlers ─────────────────────────────────────────


@on_event("nursing.entry_created")
async def handle_nursing_entry_created(payload: dict) -> None:
    logger.info(
        "📋 Nursing entry created: patient=%s category=%s",
        payload.get("patient_id"),
        payload.get("category"),
    )


@on_event("nursing.assessment_created")
async def handle_nursing_assessment_created(payload: dict) -> None:
    logger.info(
        "📊 Nursing assessment: patient=%s tool=%s score=%s risk=%s",
        payload.get("patient_id"),
        payload.get("assessment_tool"),
        payload.get("total_score"),
        payload.get("risk_level"),
    )
