from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import Filters, get_hotspot_service
from app.api.schemas import HotspotList
from app.services.hotspot_service import HotspotService

router = APIRouter(prefix="/api", tags=["hotspots"])


@router.get("/hotspots", response_model=HotspotList)
def hotspots(filters: Filters, service: Annotated[HotspotService, Depends(get_hotspot_service)]) -> dict:
    """Hotspots of the slice (RN-01), from the most to the fewest accidents."""
    return {
        "radius_meters": service.radius_m,
        "min_accidents": service.min_accidents,
        "hotspots": service.hotspots(filters),
    }
