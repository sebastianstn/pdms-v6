"""User endpoints — profile + role info."""

from fastapi import APIRouter, Depends

from src.api.dependencies import get_current_user

router = APIRouter()


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    """Aktuellen Benutzer zurückgeben."""
    return {
        "sub": user.get("sub"),
        "username": user.get("preferred_username"),
        "email": user.get("email"),
        "name": user.get("name"),
        "roles": user.get("realm_access", {}).get("roles", []),
    }
