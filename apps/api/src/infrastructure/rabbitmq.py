"""RabbitMQ event publisher and consumer setup."""

import aio_pika

from src.config import settings

_connection: aio_pika.RobustConnection | None = None


async def get_rabbitmq_connection() -> aio_pika.RobustConnection:
    """Get or create RabbitMQ connection."""
    global _connection
    if _connection is None or _connection.is_closed:
        _connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    return _connection


async def publish_event(exchange_name: str, routing_key: str, body: bytes):
    """Publish an event to RabbitMQ."""
    connection = await get_rabbitmq_connection()
    async with connection.channel() as channel:
        exchange = await channel.declare_exchange(exchange_name, aio_pika.ExchangeType.TOPIC, durable=True)
        await exchange.publish(
            aio_pika.Message(body=body, content_type="application/json"),
            routing_key=routing_key,
        )
