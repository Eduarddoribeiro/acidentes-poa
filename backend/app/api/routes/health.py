from fastapi import APIRouter

from app.api.schemas import Health

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", response_model=Health)
def health() -> dict:
    """Confirms the API is up."""
    return {"status": "ok"}
