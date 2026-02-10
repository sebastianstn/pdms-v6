"""pgAudit config and application-level audit logging."""

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.system import AuditLog


async def log_action(
    session: AsyncSession,
    *,
    user_id: UUID,
    user_role: str,
    action: str,
    resource_type: str,
    resource_id: str | None = None,
    details: dict | None = None,
    ip_address: str | None = None,
):
    """Write an application-level audit log entry."""
    entry = AuditLog(
        user_id=user_id,
        user_role=user_role,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        details=details or {},
        ip_address=ip_address,
        created_at=datetime.now(UTC),
    )
    session.add(entry)
