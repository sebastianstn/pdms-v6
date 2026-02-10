"""RabbitMQ event publisher, consumer framework, and connection management.

Exchange: pdms.events (topic)
Routing keys follow the pattern: <domain>.<action>
  - vital.recorded
  - alarm.warning, alarm.critical, alarm.acknowledged, alarm.resolved
  - medication.created, medication.updated, medication.discontinued, medication.administered
  - encounter.admitted, encounter.discharged, encounter.transferred, encounter.cancelled
  - note.created, note.finalized, note.cosigned
  - nursing.entry_created, nursing.assessment_created
"""

import asyncio
import json
import logging
from datetime import UTC, datetime
from typing import Any, Callable, Coroutine

import aio_pika

from src.config import settings

logger = logging.getLogger("pdms.rabbitmq")

EXCHANGE_NAME = "pdms.events"

_connection: aio_pika.RobustConnection | None = None
_consumer_task: asyncio.Task | None = None


# ─── Connection ────────────────────────────────────────────────


async def get_rabbitmq_connection() -> aio_pika.RobustConnection:
    """Get or create a robust RabbitMQ connection."""
    global _connection
    if _connection is None or _connection.is_closed:
        _connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        logger.info("RabbitMQ connection established")
    return _connection


async def close_rabbitmq_connection() -> None:
    """Gracefully close the RabbitMQ connection."""
    global _connection, _consumer_task
    if _consumer_task and not _consumer_task.done():
        _consumer_task.cancel()
        try:
            await _consumer_task
        except asyncio.CancelledError:
            pass
        _consumer_task = None
    if _connection and not _connection.is_closed:
        await _connection.close()
        _connection = None
        logger.info("RabbitMQ connection closed")


# ─── Publish ───────────────────────────────────────────────────


async def publish_event(exchange_name: str, routing_key: str, body: bytes) -> None:
    """Publish an event to the topic exchange."""
    connection = await get_rabbitmq_connection()
    async with connection.channel() as channel:
        exchange = await channel.declare_exchange(
            exchange_name, aio_pika.ExchangeType.TOPIC, durable=True
        )
        await exchange.publish(
            aio_pika.Message(
                body=body,
                content_type="application/json",
                timestamp=datetime.now(UTC),
            ),
            routing_key=routing_key,
        )


async def emit_event(routing_key: str, payload: dict[str, Any]) -> None:
    """High-level helper: serialize payload and publish to pdms.events.

    Silently catches errors so that a RabbitMQ outage never breaks the
    core request/response flow.
    """
    try:
        body = json.dumps(payload, default=str).encode()
        await publish_event(EXCHANGE_NAME, routing_key, body)
        logger.debug("Event published: %s → %s", routing_key, payload.get("type", ""))
    except Exception as exc:
        logger.warning("RabbitMQ publish failed (%s): %s", routing_key, exc)


# ─── Consumer Framework ───────────────────────────────────────

# Handler registry: routing_key_pattern → async callback
_handlers: dict[str, Callable[[dict], Coroutine]] = {}


def on_event(routing_key: str):
    """Decorator to register an event handler.

    Usage:
        @on_event("alarm.critical")
        async def handle_critical_alarm(payload: dict):
            ...
    """
    def decorator(func: Callable[[dict], Coroutine]):
        _handlers[routing_key] = func
        return func
    return decorator


async def _process_message(message: aio_pika.IncomingMessage) -> None:
    """Process a single incoming message."""
    async with message.process():
        try:
            payload = json.loads(message.body)
            routing_key = message.routing_key
            logger.debug("Event received: %s", routing_key)

            for pattern, handler in _handlers.items():
                if _match_routing_key(pattern, routing_key):
                    await handler(payload)
        except Exception as exc:
            logger.error("Error processing event %s: %s", message.routing_key, exc, exc_info=True)


def _match_routing_key(pattern: str, key: str) -> bool:
    """Simple topic matching: '#' = multi-word wildcard, '*' = single-word wildcard."""
    if pattern == "#":
        return True
    p_parts = pattern.split(".")
    k_parts = key.split(".")

    pi = ki = 0
    while pi < len(p_parts) and ki < len(k_parts):
        if p_parts[pi] == "#":
            return True
        if p_parts[pi] == "*" or p_parts[pi] == k_parts[ki]:
            pi += 1
            ki += 1
        else:
            return False
    return pi == len(p_parts) and ki == len(k_parts)


async def start_consumer(queue_name: str = "pdms.notifications", binding_keys: list[str] | None = None) -> None:
    """Start consuming events from RabbitMQ.

    Args:
        queue_name: Name of the durable queue.
        binding_keys: Routing key patterns to bind (default: all events '#').
    """
    global _consumer_task

    if binding_keys is None:
        binding_keys = ["#"]

    async def _consume():
        while True:
            try:
                connection = await get_rabbitmq_connection()
                channel = await connection.channel()
                await channel.set_qos(prefetch_count=10)

                exchange = await channel.declare_exchange(
                    EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC, durable=True
                )
                queue = await channel.declare_queue(queue_name, durable=True)

                for key in binding_keys:
                    await queue.bind(exchange, routing_key=key)

                logger.info(
                    "Consumer started: queue=%s, bindings=%s, handlers=%d",
                    queue_name, binding_keys, len(_handlers),
                )

                async with queue.iterator() as queue_iter:
                    async for message in queue_iter:
                        await _process_message(message)

            except asyncio.CancelledError:
                logger.info("Consumer task cancelled")
                return
            except Exception as exc:
                logger.error("Consumer error, reconnecting in 5s: %s", exc)
                await asyncio.sleep(5)

    _consumer_task = asyncio.create_task(_consume())

