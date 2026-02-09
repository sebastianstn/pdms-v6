"""TimescaleDB helpers for hypertable setup and time-series queries."""

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def create_hypertable(session: AsyncSession, table: str, time_column: str = "recorded_at"):
    """Convert a regular table to a TimescaleDB hypertable."""
    await session.execute(text(f"SELECT create_hypertable('{table}', '{time_column}', if_not_exists => TRUE)"))
    await session.commit()
