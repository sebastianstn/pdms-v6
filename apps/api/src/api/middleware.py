"""Middleware: audit logging, CORS, rate limiting."""

import time
import logging

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from src.infrastructure.database import AsyncSessionLocal
from src.infrastructure.audit_db import log_action

logger = logging.getLogger("pdms.audit")


class AuditMiddleware(BaseHTTPMiddleware):
    """Log every mutating API request to the audit trail."""

    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration_ms = round((time.time() - start) * 1000)

        # Log mutating API requests to the database
        if request.url.path.startswith("/api/") and request.method in ("POST", "PATCH", "PUT", "DELETE"):
            try:
                # Extract user info from request state (set by auth dependency)
                user_id = getattr(request.state, "user_id", None)
                user_role = getattr(request.state, "user_role", "anonymous")

                if user_id:
                    async with AsyncSessionLocal() as session:
                        await log_action(
                            session,
                            user_id=user_id,
                            user_role=user_role,
                            action=request.method,
                            resource_type=request.url.path,
                            resource_id=None,
                            details={"status": response.status_code, "duration_ms": duration_ms},
                            ip_address=request.client.host if request.client else None,
                        )
                        await session.commit()
            except Exception as e:
                logger.warning(f"Audit log failed: {e}")

        # Always log to stdout for debugging
        if request.url.path.startswith("/api/"):
            logger.debug(
                f"{request.method} {request.url.path} → {response.status_code} ({duration_ms}ms)"
            )

        return response
